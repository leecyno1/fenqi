import { describe, expect, it, vi } from "vitest";

import { buildHeatScoreBreakdown, type NormalizedEventCandidate } from "./polymarket";
import {
  enrichCandidateWithNews,
  pickTopNewsMatches,
  type NewsMatch,
} from "./enrich-news";

const baseCandidate: NormalizedEventCandidate = {
  externalSource: "polymarket",
  externalId: "evt-1",
  externalSlug: "us-x-iran-ceasefire-by",
  sourceName: "Polymarket",
  sourceUrl: "https://polymarket.com/event/us-x-iran-ceasefire-by",
  canonicalSourceUrl: "https://polymarket.com/event/us-x-iran-ceasefire-by",
  question: "美伊会在本月内出现停火框架吗？",
  brief: "围绕美伊停火谈判窗口的概率分歧。",
  tone: "外部热点母池同步事件。",
  category: "current_affairs",
  status: "live",
  closesAt: new Date("2026-04-30T00:00:00Z"),
  resolvesAt: new Date("2026-04-30T00:00:00Z"),
  liquidity: 42000,
  yesShares: 14000,
  noShares: 16000,
  volumePoints: 98000,
  activeTraders: 420,
  probability: { yes: 0.52, no: 0.48 },
  externalYesProbabilityBps: 5200,
  externalNoProbabilityBps: 4800,
  externalPriceUpdatedAt: new Date("2026-04-06T00:00:00Z"),
  externalPriceStale: false,
  priceAnchorMode: "external",
  clobTokenIds: [],
  externalImageUrl: "https://polymarket-upload.example/iran.jpg",
  newsImageUrl: null,
  newsImageCachedUrl: null,
  newsImageSource: null,
  newsReferences: [],
  heatScore: 71,
  controversyScore: 58,
  isFeatured: true,
  resolutionSources: [{ label: "Polymarket 事件页", href: "https://polymarket.com/event/us-x-iran-ceasefire-by" }],
  evidence: ["关注外部母池的实时概率与活跃度变化。"],
  tags: ["Iran", "US"],
  lastSyncedAt: new Date("2026-04-06T00:00:00Z"),
};

describe("news enrichment", () => {
  it("ranks the most relevant whitelisted news matches first and removes duplicates", () => {
    const matches: NewsMatch[] = [
      {
        sourceName: "Reuters",
        articleUrl: "https://www.reuters.com/world/us-iran-ceasefire-talks-2026-04-06/",
        title: "US and Iran ceasefire talks enter critical stage this month",
        publishedAt: "2026-04-06T02:00:00Z",
        imageOriginalUrl: "https://www.reuters.com/example/iran.jpg",
        snippet: "Officials remain split on whether a ceasefire framework can be reached this month.",
        score: 91,
      },
      {
        sourceName: "Reuters",
        articleUrl: "https://www.reuters.com/world/us-iran-ceasefire-talks-2026-04-06/",
        title: "Duplicate Reuters item",
        publishedAt: "2026-04-06T01:00:00Z",
        imageOriginalUrl: null,
        snippet: "Duplicate link should be ignored.",
        score: 77,
      },
      {
        sourceName: "CNBC",
        articleUrl: "https://www.cnbc.com/2026/04/06/oil-dips-on-middle-east-headlines.html",
        title: "Oil dips on Middle East headlines as traders await clarity",
        publishedAt: "2026-04-06T01:00:00Z",
        imageOriginalUrl: "https://image.cnbcfm.com/api/v1/image/oil.jpg",
        snippet: "Markets watch the Iran situation but article is more macro than event-specific.",
        score: 62,
      },
      {
        sourceName: "Random Blog",
        articleUrl: "https://example.com/opinion/us-iran",
        title: "Opinion on Iran",
        publishedAt: "2026-04-06T03:00:00Z",
        imageOriginalUrl: null,
        snippet: "Should be filtered because source is not allowed.",
        score: 95,
      },
    ];

    const topMatches = pickTopNewsMatches(matches);

    expect(topMatches).toHaveLength(2);
    expect(topMatches[0].sourceName).toBe("Reuters");
    expect(topMatches[0].articleUrl).toContain("reuters.com");
    expect(topMatches[1].sourceName).toBe("CNBC");
  });

  it("enriches a candidate with top news references, cached image, and recalculated scores", async () => {
    const expectedScores = buildHeatScoreBreakdown({
      probabilityYes: 0.52,
      liquidity: 42000,
      volume24hr: 98000,
      volume1wk: 0,
      newsMatchCount: 2,
      conflictSignalCount: 2,
      crossSourceDivergence: 0.24,
      featured: true,
    });

    const enriched = await enrichCandidateWithNews(baseCandidate, {
      searchNews: vi.fn().mockResolvedValue([
        {
          sourceName: "Reuters",
          articleUrl: "https://www.reuters.com/world/us-iran-ceasefire-talks-2026-04-06/",
          title: "US and Iran ceasefire talks enter critical stage this month",
          publishedAt: "2026-04-06T02:00:00Z",
          imageOriginalUrl: "https://www.reuters.com/example/iran.jpg",
          snippet: "Officials remain split on whether a ceasefire framework can be reached this month.",
          score: 91,
        },
        {
          sourceName: "AP",
          articleUrl: "https://apnews.com/article/us-iran-ceasefire-talks-2026",
          title: "US and Iran officials disagree on path to ceasefire framework",
          publishedAt: "2026-04-06T00:30:00Z",
          imageOriginalUrl: "https://apnews.com/images/iran.jpg",
          snippet: "Negotiators remain divided over the timing and scope of a deal.",
          score: 83,
        },
      ]),
      cacheImage: vi.fn().mockResolvedValue("/news-cache/iran-talks.jpg"),
      scoreBreakdown: vi.fn().mockReturnValue(expectedScores),
    });

    expect(enriched.newsReferences).toHaveLength(2);
    expect(enriched.newsReferences[0]).toMatchObject({
      sourceName: "Reuters",
      articleUrl: "https://www.reuters.com/world/us-iran-ceasefire-talks-2026-04-06/",
      imageOriginalUrl: "https://www.reuters.com/example/iran.jpg",
      cachedImageUrl: "/news-cache/iran-talks.jpg",
    });
    expect(enriched.newsImageUrl).toBe("https://www.reuters.com/example/iran.jpg");
    expect(enriched.newsImageCachedUrl).toBe("/news-cache/iran-talks.jpg");
    expect(enriched.newsImageSource).toBe("Reuters");
    expect(enriched.heatScore).toBe(expectedScores.heatScore);
    expect(enriched.controversyScore).toBe(expectedScores.controversyScore);
  });
});
