import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { markets } from "../../db/schema";
import { createMarketState, getMarketProbabilities } from "../markets/lmsr";
import { CURATED_NEWS_FALLBACKS } from "./news-fallback";
import {
  buildHeatScoreBreakdown,
  type HeatScoreBreakdown,
  type NewsReference,
  type NormalizedEventCandidate,
} from "./polymarket";

const ALLOWED_SOURCES = new Set([
  "Reuters",
  "AP",
  "Bloomberg",
  "CNBC",
  "ESPN",
  "CoinDesk",
  "澎湃新闻",
  "财联社",
  "36氪",
  "虎嗅",
]);

const SOURCE_SEARCH_DOMAINS: Record<string, string[]> = {
  Reuters: ["reuters.com"],
  AP: ["apnews.com"],
  Bloomberg: ["bloomberg.com"],
  CNBC: ["cnbc.com"],
  ESPN: ["espn.com"],
  CoinDesk: ["coindesk.com"],
  澎湃新闻: ["thepaper.cn"],
  财联社: ["cls.cn", "wallstreetcn.com"],
  "36氪": ["36kr.com"],
  虎嗅: ["huxiu.com"],
};

const SOURCE_PRIORITY_BY_TOPIC: Record<NormalizedEventCandidate["category"], string[]> = {
  current_affairs: ["Reuters", "AP", "澎湃新闻", "CNBC"],
  finance: ["CoinDesk", "CNBC", "Bloomberg", "财联社"],
  technology: ["CNBC", "36氪", "虎嗅", "Bloomberg"],
};

const CONFLICT_PATTERNS = [
  /split/i,
  /uncertain/i,
  /uncertainty/i,
  /debate/i,
  /counterproposal/i,
  /counter/i,
  /reject/i,
  /disagree/i,
  /volatil/i,
  /拉锯/,
  /分歧/,
  /对立/,
  /不确定/,
  /争议/,
  /冲突/,
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(value: string) {
  return decodeHtmlEntities(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugToWords(slug: string) {
  return slug
    .split(/[-_/]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^\d+$/.test(part));
}

function extractSearchPhrases(candidate: NormalizedEventCandidate) {
  const phrases = [candidate.question, ...candidate.tags, ...slugToWords(candidate.externalSlug)];
  const deduped = new Set<string>();

  for (const phrase of phrases) {
    const normalized = phrase.trim();
    if (!normalized || normalized.length < 2) {
      continue;
    }

    deduped.add(normalized);
  }

  return [...deduped];
}

function buildSearchQueries(candidate: NormalizedEventCandidate) {
  const phrases = extractSearchPhrases(candidate);
  const combined = phrases.slice(0, 4).join(" ");

  return [candidate.question, combined, candidate.externalSlug.replace(/-/g, " ")].filter(Boolean);
}

function buildGoogleNewsUrl(sourceName: string, query: string) {
  const domains = SOURCE_SEARCH_DOMAINS[sourceName] ?? [];
  const domainClause = domains.map((domain) => `site:${domain}`).join(" OR ");
  const q = [query, domainClause].filter(Boolean).join(" ");
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", q);
  url.searchParams.set("hl", /[\u4e00-\u9fff]/.test(query) ? "zh-CN" : "en-US");
  url.searchParams.set("gl", /[\u4e00-\u9fff]/.test(query) ? "CN" : "US");
  url.searchParams.set("ceid", /[\u4e00-\u9fff]/.test(query) ? "CN:zh-Hans" : "US:en");
  return url.toString();
}

function extractTag(xml: string, tag: string) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1].trim() : null;
}

function parseRssMatches(xml: string): NewsMatch[] {
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) ?? [];

  return itemMatches
    .flatMap((item) => {
      const sourceName = stripHtml(extractTag(item, "source") ?? "");
      const title = stripHtml(extractTag(item, "title") ?? "");
      const articleUrl = stripHtml(extractTag(item, "link") ?? "");
      const snippet = stripHtml(extractTag(item, "description") ?? "");
      const publishedAt = stripHtml(extractTag(item, "pubDate") ?? "");

      if (!sourceName || !title || !articleUrl) {
        return [];
      }

      return [{
        sourceName,
        articleUrl,
        title,
        publishedAt,
        imageOriginalUrl: null,
        snippet,
        score: 0,
      } satisfies NewsMatch];
    })
}

function computeTokenOverlapScore(candidate: NormalizedEventCandidate, match: NewsMatch) {
  const haystack = normalizeText([match.title, match.snippet].filter(Boolean).join(" "));
  const tokens = extractSearchPhrases(candidate)
    .flatMap((phrase) => normalizeText(phrase).split(" "))
    .filter((token) => token.length >= 2);
  const uniqueTokens = [...new Set(tokens)];

  if (uniqueTokens.length === 0) {
    return 0;
  }

  const hits = uniqueTokens.filter((token) => haystack.includes(token)).length;
  return Math.round((hits / uniqueTokens.length) * 70);
}

function computeSourcePriorityScore(candidate: NormalizedEventCandidate, sourceName: string) {
  const priority = SOURCE_PRIORITY_BY_TOPIC[candidate.category] ?? [];
  const index = priority.indexOf(sourceName);

  if (index === -1) {
    return 8;
  }

  return Math.max(8, 28 - index * 5);
}

function computeRecencyScore(publishedAt: string) {
  const timestamp = Date.parse(publishedAt);
  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  const ageHours = Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60));

  if (ageHours <= 12) return 18;
  if (ageHours <= 24) return 14;
  if (ageHours <= 48) return 10;
  if (ageHours <= 96) return 6;
  return 2;
}

function scoreNewsMatch(candidate: NormalizedEventCandidate, match: NewsMatch) {
  return clamp(
    computeTokenOverlapScore(candidate, match) +
      computeSourcePriorityScore(candidate, match.sourceName) +
      computeRecencyScore(match.publishedAt),
    0,
    100,
  );
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "text/html,application/xml,text/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function extractOgImage(articleUrl: string) {
  try {
    const html = await fetchText(articleUrl);
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      null;

    return ogImage;
  } catch {
    return null;
  }
}

function countConflictSignals(matches: NewsMatch[]) {
  return matches.reduce((count, match) => {
    const text = [match.title, match.snippet].filter(Boolean).join(" ");
    return count + CONFLICT_PATTERNS.filter((pattern) => pattern.test(text)).length;
  }, 0);
}

function computeCrossSourceDivergence(matches: NewsMatch[]) {
  if (matches.length <= 1) {
    return 0;
  }

  const uniqueSources = new Set(matches.map((match) => match.sourceName)).size;
  const scores = matches.map((match) => match.score);
  const spread = Math.max(...scores) - Math.min(...scores);

  return clamp(uniqueSources / matches.length * 0.35 + spread / 100 * 0.35, 0, 1);
}

async function searchRemoteNews(candidate: NormalizedEventCandidate) {
  const queries = buildSearchQueries(candidate).slice(0, 2);
  const sources = SOURCE_PRIORITY_BY_TOPIC[candidate.category] ?? [];
  const collected: NewsMatch[] = [];

  for (const sourceName of sources) {
    for (const query of queries) {
      try {
        const xml = await fetchText(buildGoogleNewsUrl(sourceName, query));
        const matches = parseRssMatches(xml)
          .map((match) => ({
            ...match,
            score: scoreNewsMatch(candidate, match),
          }))
          .filter((match) => match.score >= 24);
        collected.push(...matches);
      } catch {
        // keep fallback path alive
      }
    }
  }

  return collected;
}

async function hydrateImage(match: NewsMatch) {
  if (match.imageOriginalUrl) {
    return match.imageOriginalUrl;
  }

  return extractOgImage(match.articleUrl);
}

export type NewsMatch = {
  sourceName: string;
  articleUrl: string;
  title: string;
  publishedAt: string;
  imageOriginalUrl: string | null;
  snippet: string | null;
  score: number;
};

type EnrichDeps = {
  searchNews?: (candidate: NormalizedEventCandidate) => Promise<NewsMatch[]>;
  cacheImage?: (imageUrl: string) => Promise<string | null>;
  scoreBreakdown?: (input: Parameters<typeof buildHeatScoreBreakdown>[0]) => HeatScoreBreakdown;
};

function toNewsReference(match: NewsMatch, cachedImageUrl: string | null): NewsReference {
  return {
    sourceName: match.sourceName,
    articleUrl: match.articleUrl,
    imageOriginalUrl: match.imageOriginalUrl,
    cachedImageUrl,
    fetchedAt: new Date().toISOString(),
  };
}

export function pickTopNewsMatches(matches: NewsMatch[]) {
  const deduped = new Map<string, NewsMatch>();

  for (const match of matches) {
    if (!ALLOWED_SOURCES.has(match.sourceName)) {
      continue;
    }

    const existing = deduped.get(match.articleUrl);
    if (!existing || existing.score < match.score) {
      deduped.set(match.articleUrl, match);
    }
  }

  return [...deduped.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return Date.parse(right.publishedAt || "") - Date.parse(left.publishedAt || "");
    })
    .slice(0, 3);
}

export async function enrichCandidateWithNews(
  candidate: NormalizedEventCandidate,
  deps: EnrichDeps = {},
): Promise<NormalizedEventCandidate> {
  const searchNews = deps.searchNews ?? (async (input: NormalizedEventCandidate) => {
    const curated =
      process.env.NODE_ENV === "production"
        ? []
        : (CURATED_NEWS_FALLBACKS[input.externalSlug] ?? []).map((match) => ({
            ...match,
            score: match.score || scoreNewsMatch(input, match),
          }));
    if (curated.length > 0) {
      return curated;
    }

    return searchRemoteNews(input);
  });
  const cacheImage = deps.cacheImage ?? (async () => null);
  const scoreBreakdown = deps.scoreBreakdown ?? buildHeatScoreBreakdown;
  const matches = pickTopNewsMatches(await searchNews(candidate));

  if (matches.length === 0) {
    return candidate;
  }

  const hydratedMatches = await Promise.all(
    matches.map(async (match) => ({
      ...match,
      imageOriginalUrl: await hydrateImage(match),
    })),
  );
  const leadMatch = hydratedMatches.find((match) => Boolean(match.imageOriginalUrl)) ?? hydratedMatches[0];
  const leadCachedImage =
    leadMatch.imageOriginalUrl ? await cacheImage(leadMatch.imageOriginalUrl).catch(() => null) : null;
  const references = hydratedMatches.map((match) =>
    toNewsReference(match, match.articleUrl === leadMatch.articleUrl ? leadCachedImage : null),
  );
  const score = scoreBreakdown({
    probabilityYes: candidate.probability.yes,
    liquidity: candidate.liquidity,
    volume24hr: candidate.volumePoints,
    volume1wk: 0,
    newsMatchCount: hydratedMatches.length,
    conflictSignalCount: countConflictSignals(hydratedMatches),
    crossSourceDivergence: computeCrossSourceDivergence(hydratedMatches),
    featured: candidate.isFeatured,
  });

  return {
    ...candidate,
    newsImageUrl: leadMatch.imageOriginalUrl,
    newsImageCachedUrl: leadCachedImage ?? candidate.newsImageCachedUrl,
    newsImageSource: leadMatch.sourceName,
    newsReferences: references,
    heatScore: score.heatScore,
    controversyScore: score.controversyScore,
  };
}

function rowToCandidate(row: Awaited<ReturnType<typeof getRowsToEnrich>>[number]): NormalizedEventCandidate {
  const probability = getMarketProbabilities(
    createMarketState({
      liquidity: row.liquidity,
      yesShares: row.yesShares,
      noShares: row.noShares,
    }),
  );

  return {
    externalSource:
      row.externalSource === "cn_entertainment"
        ? "cn_entertainment"
        : "polymarket",
    externalId: row.externalId ?? row.id,
    externalSlug: row.externalSlug ?? row.slug,
    sourceName: row.sourceName ?? "Polymarket",
    sourceUrl: row.sourceUrl ?? row.canonicalSourceUrl ?? `https://polymarket.com/event/${row.slug}`,
    canonicalSourceUrl: row.canonicalSourceUrl ?? row.sourceUrl ?? `https://polymarket.com/event/${row.slug}`,
    question: row.question,
    brief: row.brief,
    tone: row.tone,
    category: row.category,
    status: row.status,
    closesAt: row.closesAt,
    resolvesAt: row.resolvesAt,
    liquidity: row.liquidity,
    yesShares: row.yesShares,
    noShares: row.noShares,
    volumePoints: row.volumePoints,
    activeTraders: row.activeTraders,
    probability,
    externalYesProbabilityBps: row.externalYesProbabilityBps,
    externalNoProbabilityBps: row.externalNoProbabilityBps,
    externalPriceUpdatedAt: row.externalPriceUpdatedAt,
    externalPriceStale: row.externalPriceStale,
    priceAnchorMode: row.priceAnchorMode,
    clobTokenIds: Array.isArray(row.clobTokenIds) ? row.clobTokenIds.map(String) : [],
    externalImageUrl: row.externalImageUrl,
    newsImageUrl: row.newsImageUrl,
    newsImageCachedUrl: row.newsImageCachedUrl,
    newsImageSource: row.newsImageSource,
    newsReferences: Array.isArray(row.newsReferences) ? (row.newsReferences as NewsReference[]) : [],
    heatScore: row.heatScore,
    controversyScore: row.controversyScore,
    isFeatured: row.isFeatured,
    resolutionSources: Array.isArray(row.resolutionSources)
      ? (row.resolutionSources as NormalizedEventCandidate["resolutionSources"])
      : [],
    evidence: Array.isArray(row.evidence) ? row.evidence.filter((item): item is string => typeof item === "string") : [],
    tags: [],
    lastSyncedAt: row.lastSyncedAt ?? new Date(),
  };
}

async function getRowsToEnrich(limit = 12) {
  return db
    .select({
      id: markets.id,
      slug: markets.slug,
      externalSource: markets.externalSource,
      externalId: markets.externalId,
      externalSlug: markets.externalSlug,
      sourceName: markets.sourceName,
      sourceUrl: markets.sourceUrl,
      canonicalSourceUrl: markets.canonicalSourceUrl,
      externalImageUrl: markets.externalImageUrl,
      newsImageUrl: markets.newsImageUrl,
      newsImageCachedUrl: markets.newsImageCachedUrl,
      newsImageSource: markets.newsImageSource,
      newsReferences: markets.newsReferences,
      heatScore: markets.heatScore,
      controversyScore: markets.controversyScore,
      isFeatured: markets.isFeatured,
      externalYesProbabilityBps: markets.externalYesProbabilityBps,
      externalNoProbabilityBps: markets.externalNoProbabilityBps,
      externalPriceUpdatedAt: markets.externalPriceUpdatedAt,
      externalPriceStale: markets.externalPriceStale,
      priceAnchorMode: markets.priceAnchorMode,
      clobTokenIds: markets.clobTokenIds,
      question: markets.question,
      brief: markets.brief,
      tone: markets.tone,
      category: markets.category,
      status: markets.status,
      closesAt: markets.closesAt,
      resolvesAt: markets.resolvesAt,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      volumePoints: markets.volumePoints,
      activeTraders: markets.activeTraders,
      resolutionSources: markets.resolutionSources,
      evidence: markets.evidence,
      lastSyncedAt: markets.lastSyncedAt,
    })
    .from(markets)
      .where(
        and(
          inArray(markets.externalSource, ["polymarket", "cn_entertainment"]),
          or(
            isNull(markets.newsReferences),
          sql`jsonb_array_length(coalesce(${markets.newsReferences}, '[]'::jsonb)) = 0`,
          isNull(markets.newsImageSource),
          eq(markets.newsImageSource, ""),
          eq(markets.newsImageSource, "polymarket"),
        ),
      ),
    )
    .orderBy(desc(markets.isFeatured), desc(markets.volumePoints))
    .limit(limit);
}

export async function enrichMarketsWithNews(limit = 12) {
  const rows = await getRowsToEnrich(limit);
  let updated = 0;
  let skipped = 0;
  let matched = 0;

  for (const row of rows) {
    const candidate = rowToCandidate(row);
    const enriched = await enrichCandidateWithNews(candidate);

    if (enriched.newsReferences.length === 0) {
      skipped += 1;
      continue;
    }

    await db
      .update(markets)
      .set({
        newsImageUrl: enriched.newsImageUrl,
        newsImageCachedUrl: enriched.newsImageCachedUrl,
        newsImageSource: enriched.newsImageSource,
        newsReferences: enriched.newsReferences,
        heatScore: enriched.heatScore,
        controversyScore: enriched.controversyScore,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(markets.id, row.id));
    updated += 1;
    matched += enriched.newsReferences.length;
  }

  return {
    updated,
    skipped,
    matched,
  };
}
