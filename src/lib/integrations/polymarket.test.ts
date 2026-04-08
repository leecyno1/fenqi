import { describe, expect, it, vi } from "vitest";

import {
  buildAnchoredLmsrState,
  buildHeatScoreBreakdown,
  fetchPolymarketEvents,
  filterBinaryPolymarketEvents,
  normalizeExternalProbability,
  normalizePolymarketEvent,
  type PolymarketEvent,
} from "./polymarket";
import { POLYMARKET_FALLBACK_EVENTS } from "./polymarket-fallback";
import { createMarketState, getMarketProbabilities } from "../markets/lmsr";

const baseEvent: PolymarketEvent = {
  id: "2890",
  slug: "fed-cut-september-2026",
  title: "Will the Fed cut rates before September 30, 2026?",
  description: "Markets are pricing labor, inflation, and financial conditions into one decision.",
  resolutionSource: "https://www.federalreserve.gov/",
  startDate: "2026-04-01T00:00:00Z",
  endDate: "2026-09-30T00:00:00Z",
  image: "https://polymarket-upload.example/fed.png",
  icon: null,
  active: true,
  closed: false,
  archived: false,
  new: false,
  featured: true,
  restricted: false,
  liquidity: 41234,
  volume: 92110,
  openInterest: 18420,
  sortBy: null,
  category: "Finance",
  published_at: "2026-04-01T00:00:00Z",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
  competitive: 0,
  volume24hr: 14500,
  volume1wk: 52200,
  volume1mo: 0,
  volume1yr: 0,
  liquidityAmm: 0,
  liquidityClob: 0,
  commentCount: 42,
  markets: [
    {
      id: "mkt-fed-1",
      question: "Will the Fed cut rates before September 30, 2026?",
      slug: "fed-cut-september-2026",
      resolutionSource: "https://www.federalreserve.gov/",
      endDate: "2026-09-30T00:00:00Z",
      category: "Finance",
      liquidity: "41234.20",
      image: "https://polymarket-upload.example/fed-market.png",
      icon: null,
      description: "Fed watch market.",
      outcomes: '["Yes","No"]',
      outcomePrices: '["0.47","0.53"]',
      volume: "92110.0",
      active: true,
      closed: false,
      archived: false,
      featured: true,
      volume24hr: 14500,
      volume1wk: 52200,
      openInterest: 18420,
    },
    {
      id: "mkt-fed-2",
      question: "Will the Fed cut rates before October 31, 2026?",
      slug: "fed-cut-october-2026",
      resolutionSource: "https://www.federalreserve.gov/",
      endDate: "2026-10-31T00:00:00Z",
      category: "Finance",
      liquidity: "42500.00",
      image: "https://polymarket-upload.example/fed-market-2.png",
      icon: null,
      description: "Fed watch market for October.",
      outcomes: '["Yes","No"]',
      outcomePrices: '["0.61","0.39"]',
      volume: "71240.0",
      active: true,
      closed: false,
      archived: false,
      featured: false,
      volume24hr: 10400,
      volume1wk: 41100,
      openInterest: 15010,
    },
  ],
  series: null,
  tags: [{ id: "1", slug: "fed", label: "Fed" }],
  cyom: false,
  closedTime: null,
  showAllOutcomes: false,
  showMarketImages: true,
  enableNegRisk: false,
  seriesSlug: null,
  negRiskAugmented: false,
  pendingDeployment: false,
  deploying: false,
  requiresTranslation: false,
  eventMetadata: null,
};

describe("polymarket normalization", () => {
  it("keeps only binary yes/no events and maps them into one event with many child markets", () => {
    const nonBinary = {
      ...baseEvent,
      id: "4000",
      slug: "election-3-way",
      markets: [
        {
          ...baseEvent.markets[0],
          id: "mkt-election-1",
          outcomes: '["Alice","Bob","Carol"]',
          outcomePrices: '["0.2","0.3","0.5"]',
        },
      ],
    };

    const filtered = filterBinaryPolymarketEvents([baseEvent, nonBinary]);

    expect(filtered).toHaveLength(1);
    const candidate = normalizePolymarketEvent(filtered[0]);
    expect(candidate.event.externalSource).toBe("polymarket");
    expect(candidate.event.externalEventSlug).toBe("fed-cut-september-2026");
    expect(candidate.event.category).toBe("finance");
    expect(candidate.childMarkets).toHaveLength(2);
    expect(candidate.childMarkets[0]?.status).toBe("live");
    expect(candidate.childMarkets[0]?.probability.yes).toBeCloseTo(0.47, 5);
    expect(candidate.childMarkets[0]?.externalImageUrl).toContain("fed");
    expect(candidate.childMarkets[0]?.answerLabel).toBe("9月30日");
    expect(candidate.childMarkets[1]?.answerLabel).toBe("10月31日");
  });

  it("builds stable heat and controversy scores with featured boost", () => {
    const closeRace = buildHeatScoreBreakdown({
      probabilityYes: 0.51,
      liquidity: 42000,
      volume24hr: 18000,
      volume1wk: 58000,
      newsMatchCount: 3,
      conflictSignalCount: 2,
      crossSourceDivergence: 0.72,
      featured: true,
    });

    const consensusRace = buildHeatScoreBreakdown({
      probabilityYes: 0.82,
      liquidity: 42000,
      volume24hr: 18000,
      volume1wk: 58000,
      newsMatchCount: 1,
      conflictSignalCount: 0,
      crossSourceDivergence: 0.1,
      featured: false,
    });

    expect(closeRace.controversyScore).toBeGreaterThan(consensusRace.controversyScore);
    expect(closeRace.combinedScore).toBeGreaterThan(consensusRace.combinedScore);
  });

  it.each([
    ["0.95", "0.05", 0.95],
    ["0.20", "0.80", 0.2],
    ["0.51", "0.49", 0.51],
  ])("anchors LMSR state to external outcome prices %s/%s", (yesPrice, noPrice, expectedYes) => {
    const event = {
      ...baseEvent,
      markets: [
        {
          ...baseEvent.markets[0],
          outcomePrices: JSON.stringify([yesPrice, noPrice]),
        },
      ],
    };
    const candidate = normalizePolymarketEvent(event);
    const childMarket = candidate.childMarkets[0];
    if (!childMarket) {
      throw new Error("Expected at least one child market");
    }
    const probability = getMarketProbabilities(
      createMarketState({
        liquidity: childMarket.liquidity,
        yesShares: childMarket.yesShares,
        noShares: childMarket.noShares,
      }),
    );

    expect(childMarket.probability.yes).toBeCloseTo(expectedYes, 5);
    expect(probability.yes).toBeCloseTo(expectedYes, 2);
    expect(childMarket.externalYesProbabilityBps).toBe(Math.round(expectedYes * 10000));
    expect(childMarket.priceAnchorMode).toBe("external");
  });

  it("prefers tight CLOB midpoint and falls back to last trade for wide spread", () => {
    expect(
      normalizeExternalProbability({
        gammaOutcomePrices: ["0.43", "0.57"],
        midpointPrice: 0.62,
        bestBid: 0.61,
        bestAsk: 0.63,
        lastTradePrice: 0.59,
      }).yes,
    ).toBeCloseTo(0.62, 5);

    expect(
      normalizeExternalProbability({
        gammaOutcomePrices: ["0.43", "0.57"],
        midpointPrice: 0.62,
        bestBid: 0.5,
        bestAsk: 0.7,
        lastTradePrice: 0.59,
      }).yes,
    ).toBeCloseTo(0.59, 5);
  });

  it("can build an anchored state directly from a target probability", () => {
    const anchored = buildAnchoredLmsrState({ yesProbability: 0.2, liquidity: 120 });
    const probability = getMarketProbabilities(createMarketState(anchored));

    expect(probability.yes).toBeCloseTo(0.2, 2);
  });

  it("ships a multi-child fallback event for us-x-iran-ceasefire-by", () => {
    const fallbackEvent = POLYMARKET_FALLBACK_EVENTS.find(
      (event) => event.slug === "us-x-iran-ceasefire-by",
    );

    expect(fallbackEvent).toBeTruthy();
    if (!fallbackEvent) {
      return;
    }

    const candidate = normalizePolymarketEvent(fallbackEvent);

    expect(candidate.childMarkets.length).toBeGreaterThan(1);
    expect(candidate.childMarkets.map((market) => market.answerLabel)).toEqual([
      "4月15日",
      "4月30日",
      "5月31日",
      "6月30日",
    ]);
  });

  it("throws instead of silently using the bundled fallback when fallback is disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));

    try {
      await expect(
        fetchPolymarketEvents({
          limit: 1,
          active: true,
          allowFallback: false,
        }),
      ).rejects.toThrow("fetch failed");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
