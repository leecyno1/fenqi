import { createHash } from "node:crypto";
import { z } from "zod";

import { scaleDownPositivePoints } from "../points";
import { cacheRemoteImage } from "./image-cache";
import {
  buildAnchoredLmsrState,
  buildHeatScoreBreakdown,
  type NormalizedEventCandidate,
} from "./polymarket";

const REPORTS_BASE_URL_DEFAULT = "http://45.197.148.64:8080";
const REPORTS_LLM_BASE_URL_DEFAULT = "https://api.sfkey.cn/v1";
const REPORTS_LLM_MODEL_DEFAULT = "minimax2.7";

const REPORTS_PLATFORM_ALLOWLIST_DEFAULT = [
  "thepaper",
  "toutiao",
  "baidu",
  "weibo",
  "zhihu",
  "wallstreetcn-hot",
  "cls-hot",
  "bilibili-hot-search",
];

const REPORTS_SYNC_LIMIT_DEFAULT = 18;
const REPORTS_PER_PLATFORM_LIMIT_DEFAULT = 4;

const reportsDateSchema = z.array(z.string().min(1));
const reportsPlatformSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    is_active: z.number().nullable().optional(),
    updated_at: z.string().nullable().optional(),
  }),
);

const reportNewsItemSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  platform_id: z.string().min(1),
  platform_name: z.string().min(1).optional().default("新闻源"),
  rank: z.number().nullable().optional(),
  url: z.string().url(),
  last_crawl_time: z.string().nullable().optional(),
});

const reportNewsPayloadSchema = z.object({
  date: z.string().min(1).optional(),
  platform_id: z.string().min(1).optional(),
  total: z.number().optional(),
  items: z.array(reportNewsItemSchema),
});

const generatedSpecSchema = z.object({
  shouldCreate: z.boolean(),
  eventTitle: z.string().min(6).max(90),
  brief: z.string().min(6).max(180),
  probabilityYes: z.number().min(0.05).max(0.95),
  closeHours: z.number().int().min(6).max(168),
  resolveHours: z.number().int().min(12).max(360),
  category: z.enum(["current_affairs", "finance", "technology"]),
  tags: z.array(z.string().min(1)).max(8),
  evidence: z.array(z.string().min(1)).min(1).max(4),
});

type GeneratedSpec = z.infer<typeof generatedSpecSchema>;
type ReportNewsItem = z.infer<typeof reportNewsItemSchema>;

type ReportsRuntimeConfig = {
  reportsBaseUrl: string;
  llmBaseUrl: string;
  llmModel: string;
  llmApiKey: string | null;
  syncLimit: number;
  perPlatformLimit: number;
  platformAllowlist: string[];
};

type ReportsGenerationDeps = {
  fetchJson?: (url: string) => Promise<unknown>;
  generateSpec?: (news: ReportNewsItem, config: ReportsRuntimeConfig) => Promise<GeneratedSpec | null>;
  resolveImage?: (
    news: ReportNewsItem,
    spec: GeneratedSpec,
  ) => Promise<{ newsImageUrl: string | null; newsImageCachedUrl: string | null; newsImageSource: string }>;
  now?: Date;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readReportsRuntimeConfig(): ReportsRuntimeConfig {
  const syncLimit = clamp(parseInteger(process.env.REPORTS_SYNC_LIMIT, REPORTS_SYNC_LIMIT_DEFAULT), 1, 80);
  const perPlatformLimit = clamp(
    parseInteger(process.env.REPORTS_PER_PLATFORM_LIMIT, REPORTS_PER_PLATFORM_LIMIT_DEFAULT),
    1,
    20,
  );
  const platformAllowlist = process.env.REPORTS_PLATFORM_ALLOWLIST
    ? process.env.REPORTS_PLATFORM_ALLOWLIST.split(",").map((value) => value.trim()).filter(Boolean)
    : REPORTS_PLATFORM_ALLOWLIST_DEFAULT;

  return {
    reportsBaseUrl: (process.env.REPORTS_BASE_URL ?? REPORTS_BASE_URL_DEFAULT).replace(/\/+$/, ""),
    llmBaseUrl: (process.env.REPORTS_LLM_BASE_URL ?? REPORTS_LLM_BASE_URL_DEFAULT).replace(/\/+$/, ""),
    llmModel: process.env.REPORTS_LLM_MODEL ?? REPORTS_LLM_MODEL_DEFAULT,
    llmApiKey: process.env.REPORTS_LLM_API_KEY?.trim() || null,
    syncLimit,
    perPlatformLimit,
    platformAllowlist,
  };
}

async function fetchJsonWithTimeout(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "fenqi-sync/1.0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

function normalizeSlug(input: string) {
  const base = input
    .toLowerCase()
    .replace(/[\u3000\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (base.length > 0) {
    return base.slice(0, 52);
  }

  return "news-event";
}

function buildStableId(url: string) {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

function toAbsoluteUrl(url: string, baseUrl: string) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("//")) {
    const protocol = new URL(baseUrl).protocol;
    return `${protocol}${url}`;
  }
  return new URL(url, baseUrl).toString();
}

function fallbackImageByCategory(category: GeneratedSpec["category"]) {
  switch (category) {
    case "finance":
      return "/event-photo/finance.jpg";
    case "technology":
      return "/event-photo/tech.jpg";
    default:
      return "/event-photo/world.jpg";
  }
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch html: ${response.status}`);
  }

  return response.text();
}

function extractMetaImage(html: string, articleUrl: string) {
  const image =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
    null;

  if (!image) {
    return null;
  }

  try {
    return toAbsoluteUrl(image, articleUrl);
  } catch {
    return null;
  }
}

async function resolveNewsImage(
  news: ReportNewsItem,
  spec: GeneratedSpec,
): Promise<{ newsImageUrl: string | null; newsImageCachedUrl: string | null; newsImageSource: string }> {
  try {
    const html = await fetchText(news.url);
    const newsImageUrl = extractMetaImage(html, news.url);
    if (newsImageUrl) {
      const cached = await cacheRemoteImage(newsImageUrl).catch(() => null);
      return {
        newsImageUrl,
        newsImageCachedUrl: cached,
        newsImageSource: news.platform_name,
      };
    }
  } catch {
    // fall back to deterministic local real-photo asset
  }

  return {
    newsImageUrl: null,
    newsImageCachedUrl: fallbackImageByCategory(spec.category),
    newsImageSource: news.platform_name,
  };
}

function extractJsonObject(raw: string) {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const content = fencedMatch?.[1] ?? raw;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return content.slice(start, end + 1);
}

export function parseGeneratedSpec(raw: string) {
  const json = extractJsonObject(raw);
  if (!json) {
    return null;
  }

  try {
    return generatedSpecSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

function inferCategoryFromNews(news: ReportNewsItem): GeneratedSpec["category"] {
  const text = `${news.title} ${news.platform_id}`.toLowerCase();

  if (
    /比特币|以太坊|币|btc|eth|crypto|美联储|利率|a股|美股|黄金|油价|央行|债券|汇率|财联社|wallstreet/.test(text)
  ) {
    return "finance";
  }

  if (/ai|芯片|算力|大模型|openai|苹果|华为|科技|半导体|robot|机器人|无人驾驶/.test(text)) {
    return "technology";
  }

  return "current_affairs";
}

async function generateSpecWithMinimax(
  news: ReportNewsItem,
  config: ReportsRuntimeConfig,
): Promise<GeneratedSpec | null> {
  if (!config.llmApiKey) {
    return null;
  }

  const systemPrompt = [
    "你是事件交易市场的审核编辑。",
    "根据新闻标题生成一个可验证的二元事件盘口草案。",
    "必须输出 JSON 对象，字段严格为：",
    "shouldCreate,eventTitle,brief,probabilityYes,closeHours,resolveHours,category,tags,evidence",
    "要求：",
    "1) 只接受可公开验证结果的事件，若不可验证 shouldCreate=false。",
    "2) probabilityYes 在 0.05-0.95 之间。",
    "3) eventTitle 用中文疑问句，最多 36 字。",
    "4) brief 不超过 70 字，聚焦结算标准。",
    "5) category 仅可为 current_affairs|finance|technology。",
    "6) evidence 给出 1-3 条可核验依据描述。",
  ].join("\n");

  const userPrompt = [
    `新闻标题: ${news.title}`,
    `新闻来源: ${news.platform_name} (${news.platform_id})`,
    `新闻链接: ${news.url}`,
    `榜单排名: ${news.rank ?? "unknown"}`,
    `默认分类提示: ${inferCategoryFromNews(news)}`,
  ].join("\n");

  const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.llmApiKey}`,
    },
    body: JSON.stringify({
      model: config.llmModel,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";

  return parseGeneratedSpec(content);
}

function buildCandidateFromSpec(input: {
  news: ReportNewsItem;
  spec: GeneratedSpec;
  images: { newsImageUrl: string | null; newsImageCachedUrl: string | null; newsImageSource: string };
  now: Date;
}): NormalizedEventCandidate {
  const stableId = buildStableId(input.news.url);
  const probabilityYes = clamp(input.spec.probabilityYes, 0.05, 0.95);
  const liquidity = clamp(
    90 + Math.round((50 - Math.min(50, input.news.rank ?? 50)) * 1.2),
    80,
    160,
  );
  const anchored = buildAnchoredLmsrState({
    yesProbability: probabilityYes,
    liquidity,
  });
  const closeAt = new Date(input.now.getTime() + input.spec.closeHours * 60 * 60 * 1000);
  const resolveAt = new Date(
    input.now.getTime() + Math.max(input.spec.resolveHours, input.spec.closeHours + 6) * 60 * 60 * 1000,
  );
  const volumeRaw = Math.max(120, 1400 - (input.news.rank ?? 200) * 8);
  const activeTraders = clamp(Math.round(volumeRaw / 18), 8, 140);
  const score = buildHeatScoreBreakdown({
    probabilityYes,
    liquidity,
    volume24hr: volumeRaw,
    volume1wk: volumeRaw * 2,
    newsMatchCount: 1,
    conflictSignalCount: Math.abs(probabilityYes - 0.5) < 0.12 ? 2 : 1,
    crossSourceDivergence: Math.abs(probabilityYes - 0.5) < 0.12 ? 0.7 : 0.35,
    featured: (input.news.rank ?? 999) <= 8,
  });

  return {
    externalSource: "news_report",
    externalId: stableId,
    externalSlug: `news-${normalizeSlug(input.spec.eventTitle)}-${stableId.slice(0, 6)}`,
    sourceName: input.news.platform_name,
    sourceUrl: input.news.url,
    canonicalSourceUrl: input.news.url,
    question: input.spec.eventTitle,
    brief: input.spec.brief,
    tone: "基于实时新闻榜单生成的可验证事件，使用模拟积分交易。",
    category: input.spec.category,
    status: "live",
    closesAt: closeAt,
    resolvesAt: resolveAt,
    liquidity,
    yesShares: anchored.yesShares,
    noShares: anchored.noShares,
    volumePoints: scaleDownPositivePoints(volumeRaw),
    activeTraders,
    probability: {
      yes: probabilityYes,
      no: 1 - probabilityYes,
    },
    externalYesProbabilityBps: null,
    externalNoProbabilityBps: null,
    externalPriceUpdatedAt: input.now,
    externalPriceStale: false,
    priceAnchorMode: "local",
    clobTokenIds: [],
    externalImageUrl: null,
    newsImageUrl: input.images.newsImageUrl,
    newsImageCachedUrl: input.images.newsImageCachedUrl,
    newsImageSource: input.images.newsImageSource,
    newsReferences: [
      {
        sourceName: input.news.platform_name,
        articleUrl: input.news.url,
        fetchedAt: input.now.toISOString(),
      },
    ],
    heatScore: score.heatScore,
    controversyScore: score.controversyScore,
    isFeatured: (input.news.rank ?? 999) <= 8,
    resolutionSources: [
      {
        label: `${input.news.platform_name} 原始链接`,
        href: input.news.url,
      },
    ],
    evidence: input.spec.evidence.slice(0, 3),
    tags: input.spec.tags.slice(0, 6),
    lastSyncedAt: input.now,
  };
}

async function fetchReportsNewsPool(config: ReportsRuntimeConfig, fetchJson: (url: string) => Promise<unknown>) {
  const datesPayload = await fetchJson(`${config.reportsBaseUrl}/api/dates`);
  const dates = reportsDateSchema.parse(datesPayload);
  const latestDate = dates[0];

  if (!latestDate) {
    return [];
  }

  const platformsPayload = await fetchJson(
    `${config.reportsBaseUrl}/api/platforms?date=${encodeURIComponent(latestDate)}`,
  );
  const platforms = reportsPlatformSchema.parse(platformsPayload)
    .map((platform) => platform.id)
    .filter((platformId) => config.platformAllowlist.includes(platformId));

  const candidates: ReportNewsItem[] = [];
  for (const platformId of platforms) {
    const payload = await fetchJson(
      `${config.reportsBaseUrl}/api/news?date=${encodeURIComponent(latestDate)}&platform_id=${encodeURIComponent(platformId)}&limit=${config.perPlatformLimit}&offset=0&sort=rank_asc`,
    );
    const parsed = reportNewsPayloadSchema.parse(payload);
    candidates.push(...parsed.items);
  }

  const deduped = new Map<string, ReportNewsItem>();
  for (const item of candidates) {
    const key = item.url || `${item.platform_id}:${item.title}`;
    const existing = deduped.get(key);
    if (!existing || (existing.rank ?? 9_999) > (item.rank ?? 9_999)) {
      deduped.set(key, item);
    }
  }

  return [...deduped.values()]
    .sort((a, b) => (a.rank ?? 9_999) - (b.rank ?? 9_999))
    .slice(0, config.syncLimit);
}

export async function getReportsGeneratedCandidates(
  deps: ReportsGenerationDeps = {},
): Promise<NormalizedEventCandidate[]> {
  const config = readReportsRuntimeConfig();
  if (!config.llmApiKey) {
    return [];
  }

  const fetchJson = deps.fetchJson ?? fetchJsonWithTimeout;
  const generateSpec = deps.generateSpec ?? generateSpecWithMinimax;
  const resolveImage = deps.resolveImage ?? resolveNewsImage;
  const now = deps.now ?? new Date();
  const newsPool = await fetchReportsNewsPool(config, fetchJson);

  const generated = await Promise.all(
    newsPool.map(async (news) => {
      const spec = await generateSpec(news, config);
      if (!spec || !spec.shouldCreate) {
        return null;
      }

      const images = await resolveImage(news, spec).catch(() => ({
        newsImageUrl: null,
        newsImageCachedUrl: fallbackImageByCategory(spec.category),
        newsImageSource: news.platform_name,
      }));
      return buildCandidateFromSpec({ news, spec, images, now });
    }),
  );

  return generated.filter((candidate): candidate is NormalizedEventCandidate => Boolean(candidate));
}
