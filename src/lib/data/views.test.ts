import { describe, expect, it } from "vitest";

import {
  buildEventDetailView,
  buildEventListItem,
  buildHomeEventSections,
  buildHomeMarketSections,
  buildMarketDetailView,
  buildMarketListItem,
  buildPortfolioView,
} from "./views";

describe("market view builders", () => {
  it("maps a market row into localized market list view data", () => {
    const market = buildMarketListItem({
      id: "mkt_ai_phone",
      slug: "cn-ai-phone-q3-shipment",
      question: "2026年第三季度，中国 AI 手机单季出货量会突破 1000 万台吗？",
      brief: "消费电子与模型端侧落地的交叉市场。",
      category: "technology",
      status: "live",
      closesAt: new Date("2026-07-29T12:00:00.000Z"),
      resolvesAt: new Date("2026-08-05T04:00:00.000Z"),
      liquidity: 125,
      yesShares: 84,
      noShares: 36,
      volumePoints: 483000,
      activeTraders: 2418,
    });

    expect(market.categoryLabel).toBe("科技");
    expect(market.statusLabel).toBe("进行中");
    expect(market.topicKey).toBe("tech");
    expect(market.probability.yes).toBeGreaterThan(market.probability.no);
    expect(market.sampleOrder.cost).toBeGreaterThan(0);
  });

  it("uses external anchored probability for display during cold start", () => {
    const market = buildMarketListItem({
      id: "mkt_gaza",
      slug: "israel-military-action-against-gaza-on",
      question: "以色列会对加沙采取军事行动吗？",
      brief: "外部热点锚定事件。",
      category: "current_affairs",
      status: "live",
      closesAt: new Date("2026-04-08T12:00:00.000Z"),
      resolvesAt: new Date("2026-04-09T12:00:00.000Z"),
      liquidity: 120,
      yesShares: 0,
      noShares: 0,
      volumePoints: 880,
      activeTraders: 4,
      externalYesProbabilityBps: 9500,
      externalNoProbabilityBps: 500,
      priceAnchorMode: "external",
      externalPriceUpdatedAt: new Date("2026-04-07T00:00:00.000Z"),
    });

    expect(market.probability.yes).toBeCloseTo(0.95, 5);
    expect(market.probability.no).toBeCloseTo(0.05, 5);
    expect(market.priceAnchorMode).toBe("external");
    expect(market.externalPriceStale).toBe(false);
  });

  it("blends external and local probability in hybrid mode", () => {
    const market = buildMarketListItem({
      id: "mkt_hybrid",
      slug: "hybrid-market",
      question: "混合盘口测试事件",
      brief: "混合模式。",
      category: "finance",
      status: "live",
      closesAt: new Date("2026-04-08T12:00:00.000Z"),
      resolvesAt: new Date("2026-04-09T12:00:00.000Z"),
      liquidity: 100,
      yesShares: 0,
      noShares: 0,
      volumePoints: 100,
      activeTraders: 2,
      externalYesProbabilityBps: 8000,
      externalNoProbabilityBps: 2000,
      priceAnchorMode: "hybrid",
      externalPriceUpdatedAt: new Date("2026-04-07T00:00:00.000Z"),
    });

    expect(market.probability.yes).toBeCloseTo(0.71, 5);
    expect(market.probability.no).toBeCloseTo(0.29, 5);
  });

  it("groups market cards into stable home feed sections", () => {
    const markets = [
      buildMarketListItem({
        id: "mkt_1",
        slug: "politics-us-house-approval-june-2026",
        question: "美国众议院会在 2026 年 6 月前通过预算框架吗？",
        brief: "政治议程博弈。",
        category: "current_affairs",
        status: "live",
        closesAt: new Date("2026-04-06T12:00:00.000Z"),
        resolvesAt: new Date("2026-04-08T12:00:00.000Z"),
        liquidity: 120,
        yesShares: 71,
        noShares: 49,
        volumePoints: 410000,
        activeTraders: 2100,
      }),
      buildMarketListItem({
        id: "mkt_2",
        slug: "sports-lakers-playoffs-2026",
        question: "湖人会进入 2026 季后赛吗？",
        brief: "赛季后段战绩判断。",
        category: "current_affairs",
        status: "live",
        closesAt: new Date("2026-04-05T16:00:00.000Z"),
        resolvesAt: new Date("2026-04-12T12:00:00.000Z"),
        liquidity: 125,
        yesShares: 59,
        noShares: 61,
        volumePoints: 390000,
        activeTraders: 1800,
      }),
      buildMarketListItem({
        id: "mkt_3",
        slug: "crypto-bitcoin-above-150k-2026",
        question: "比特币会在 2026 年第二季度前站上 15 万美元吗？",
        brief: "加密与流动性情绪。",
        category: "finance",
        status: "locked",
        closesAt: new Date("2026-04-05T04:00:00.000Z"),
        resolvesAt: new Date("2026-04-07T12:00:00.000Z"),
        liquidity: 130,
        yesShares: 64,
        noShares: 56,
        volumePoints: 520000,
        activeTraders: 2600,
      }),
    ];

    const sections = buildHomeMarketSections(markets, new Date("2026-04-05T00:00:00.000Z"));

    expect(sections[0]?.key).toBe("featured");
    expect(sections[1]?.key).toBe("closing-soon");
    expect(sections.find((section) => section.key === "politics")?.markets).toHaveLength(1);
    expect(sections.find((section) => section.key === "sports")?.markets).toHaveLength(1);
    expect(sections.find((section) => section.key === "crypto")?.markets).toHaveLength(1);
  });

  it("keeps parent event metadata on market detail views", () => {
    const market = buildMarketDetailView({
      id: "mkt_ceasefire_apr_15",
      slug: "us-x-iran-ceasefire-by-apr-15",
      question: "美伊会在 4 月 15 日前出现停火框架吗？",
      brief: "多时间边界子市场。",
      category: "current_affairs",
      status: "live",
      closesAt: new Date("2026-04-15T16:00:00.000Z"),
      resolvesAt: new Date("2026-06-30T16:00:00.000Z"),
      liquidity: 120,
      yesShares: 23,
      noShares: 77,
      volumePoints: 23800,
      activeTraders: 900,
      tone: "按父事件统一的外部来源结算。",
      evidence: ["以公开停火声明为准。"],
      resolutionSource: [{ label: "Polymarket", href: "https://polymarket.com/event/us-x-iran-ceasefire-by" }],
      resolution: null,
      parentEvent: {
        slug: "us-x-iran-ceasefire-by",
        title: "美伊会在何时之前出现停火框架？",
        childCount: 4,
      },
    });

    expect(market.parentEvent?.slug).toBe("us-x-iran-ceasefire-by");
    expect(market.parentEvent?.childCount).toBe(4);
  });
});

describe("event view builders", () => {
  it("selects a live high-volume child market as the primary child for an event", () => {
    const event = buildEventListItem({
      id: "evt_ceasefire",
      slug: "us-x-iran-ceasefire-by",
      title: "美国与伊朗会在何时之前达成停火？",
      brief: "同一事件下按不同时间边界拆分的多子市场。",
      category: "current_affairs",
      sourceName: "Polymarket",
      sourceUrl: "https://polymarket.com/event/us-x-iran-ceasefire-by",
      childMarkets: [
        {
          id: "mkt_1",
          slug: "us-x-iran-ceasefire-by-apr-7",
          question: "美国与伊朗会在 4 月 7 日前达成停火吗？",
          answerLabel: "4月7日",
          answerOrder: 1,
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-07T12:00:00.000Z"),
          resolvesAt: new Date("2026-04-07T12:30:00.000Z"),
          liquidity: 115,
          yesShares: 42,
          noShares: 73,
          volumePoints: 64,
          activeTraders: 16,
        },
        {
          id: "mkt_2",
          slug: "us-x-iran-ceasefire-by-apr-15",
          question: "美国与伊朗会在 4 月 15 日前达成停火吗？",
          answerLabel: "4月15日",
          answerOrder: 2,
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-15T12:00:00.000Z"),
          resolvesAt: new Date("2026-04-15T12:30:00.000Z"),
          liquidity: 130,
          yesShares: 89,
          noShares: 41,
          volumePoints: 132,
          activeTraders: 28,
        },
        {
          id: "mkt_3",
          slug: "us-x-iran-ceasefire-by-may-1",
          question: "美国与伊朗会在 5 月 1 日前达成停火吗？",
          answerLabel: "5月1日",
          answerOrder: 3,
          category: "current_affairs",
          status: "locked",
          closesAt: new Date("2026-05-01T12:00:00.000Z"),
          resolvesAt: new Date("2026-05-01T12:30:00.000Z"),
          liquidity: 120,
          yesShares: 91,
          noShares: 29,
          volumePoints: 180,
          activeTraders: 22,
        },
      ],
    });

    expect(event.primaryChildMarket.slug).toBe("us-x-iran-ceasefire-by-apr-15");
    expect(event.totalVolumePoints).toBe(376);
    expect(event.activeChildCount).toBe(3);
    expect(event.question).toBe("美国与伊朗会在何时之前达成停火？");
    expect(event.slug).toBe("us-x-iran-ceasefire-by");
  });

  it("prefers a still-tradeable child over expired or locked children when choosing the primary child", () => {
    const now = new Date("2026-04-08T12:00:00.000Z");
    const event = buildEventListItem(
      {
        id: "evt_dynamic_priority",
        slug: "world-ceasefire-dynamic-priority",
        title: "主要冲突会在何时之前达成停火？",
        brief: "主子市场选择应优先仍可交易的时间边界。",
        category: "current_affairs",
        sourceName: "Polymarket",
        sourceUrl: "https://polymarket.com/event/world-ceasefire-dynamic-priority",
        childMarkets: [
          {
            id: "mkt_locked_old",
            slug: "world-ceasefire-dynamic-priority-apr-05",
            question: "会在 4 月 5 日前达成停火吗？",
            answerLabel: "4月5日",
            answerOrder: 1,
            category: "current_affairs",
            status: "locked",
            closesAt: new Date("2026-04-05T12:00:00.000Z"),
            resolvesAt: new Date("2026-04-05T12:30:00.000Z"),
            liquidity: 150,
            yesShares: 94,
            noShares: 56,
            volumePoints: 920,
            activeTraders: 80,
          },
          {
            id: "mkt_live_expired",
            slug: "world-ceasefire-dynamic-priority-apr-08",
            question: "会在 4 月 8 日前达成停火吗？",
            answerLabel: "4月8日",
            answerOrder: 2,
            category: "current_affairs",
            status: "live",
            closesAt: new Date("2026-04-08T06:00:00.000Z"),
            resolvesAt: new Date("2026-04-08T12:30:00.000Z"),
            liquidity: 130,
            yesShares: 66,
            noShares: 64,
            volumePoints: 640,
            activeTraders: 42,
          },
          {
            id: "mkt_live_future",
            slug: "world-ceasefire-dynamic-priority-apr-15",
            question: "会在 4 月 15 日前达成停火吗？",
            answerLabel: "4月15日",
            answerOrder: 3,
            category: "current_affairs",
            status: "live",
            closesAt: new Date("2026-04-15T12:00:00.000Z"),
            resolvesAt: new Date("2026-04-15T12:30:00.000Z"),
            liquidity: 120,
            yesShares: 58,
            noShares: 62,
            volumePoints: 510,
            activeTraders: 33,
          },
        ],
      },
      now,
    );

    expect(event.primaryChildMarket.slug).toBe("world-ceasefire-dynamic-priority-apr-15");
    expect(event.closesAt.toISOString()).toBe("2026-04-15T12:00:00.000Z");
  });

  it("marks stale external events as ineligible for homepage exposure", () => {
    const now = new Date("2026-04-08T12:00:00.000Z");
    const event = buildEventListItem(
      {
        id: "evt_stale_external",
        slug: "stale-polymarket-event",
        title: "外部盘口已过期的测试事件",
        brief: "昨日同步但今日未刷新。",
        category: "current_affairs",
        sourceName: "Polymarket",
        sourceUrl: "https://polymarket.com/event/stale-polymarket-event",
        childMarkets: [
          {
            id: "mkt_stale_external",
            slug: "stale-polymarket-event-primary",
            question: "外部盘口已过期的测试事件",
            answerLabel: "主市场",
            answerOrder: 1,
            category: "current_affairs",
            status: "live",
            closesAt: new Date("2026-04-20T12:00:00.000Z"),
            resolvesAt: new Date("2026-04-20T18:00:00.000Z"),
            liquidity: 130,
            yesShares: 40,
            noShares: 60,
            volumePoints: 720,
            activeTraders: 50,
            externalYesProbabilityBps: 4100,
            externalNoProbabilityBps: 5900,
            priceAnchorMode: "external",
            externalPriceUpdatedAt: new Date("2026-04-07T00:00:00.000Z"),
            externalPriceStale: true,
          },
        ],
      },
      now,
    );

    expect(event.contentOrigin).toBe("external_live");
    expect(event.freshnessStatus).toBe("stale");
    expect(event.homepageEligible).toBe(false);
  });

  it("allows curated local events onto the homepage while excluding seed demo events", () => {
    const now = new Date("2026-04-08T12:00:00.000Z");
    const curated = buildEventListItem(
      {
        id: "evt_curated_local",
        slug: "culture-singer-2026-launch-lineup",
        title: "《歌手 2026》官宣首发阵容后，首发歌手会拿下总冠军吗？",
        brief: "以内娱公开官宣与节目结果为结算依据。",
        category: "current_affairs",
        childMarkets: [
          {
            id: "mkt_curated_local",
            slug: "culture-singer-2026-launch-lineup",
            question: "《歌手 2026》官宣首发阵容后，首发歌手会拿下总冠军吗？",
            answerLabel: "主市场",
            answerOrder: 1,
            category: "current_affairs",
            status: "live",
            closesAt: new Date("2026-06-28T12:00:00.000Z"),
            resolvesAt: new Date("2026-07-15T12:00:00.000Z"),
            liquidity: 120,
            yesShares: 61,
            noShares: 59,
            volumePoints: 980,
            activeTraders: 128,
          },
        ],
      },
      now,
    );
    const demo = buildEventListItem(
      {
        id: "evt_seed_demo",
        slug: "seed-demo-local-event",
        title: "开发示例事件",
        brief: "只用于开发演示，不应进入生产首页。",
        category: "current_affairs",
        childMarkets: [
          {
            id: "mkt_seed_demo",
            slug: "seed-demo-local-event",
            question: "开发示例事件",
            answerLabel: "主市场",
            answerOrder: 1,
            category: "current_affairs",
            status: "live",
            closesAt: new Date("2026-06-01T12:00:00.000Z"),
            resolvesAt: new Date("2026-06-02T12:00:00.000Z"),
            liquidity: 100,
            yesShares: 55,
            noShares: 45,
            volumePoints: 860,
            activeTraders: 91,
          },
        ],
      },
      now,
    );

    expect(curated.contentOrigin).toBe("local_curated");
    expect(curated.homepageEligible).toBe(true);
    expect(demo.contentOrigin).toBe("seed_demo");
    expect(demo.homepageEligible).toBe(false);
  });

  it("groups event cards into stable home feed sections", () => {
    const now = new Date("2026-04-05T00:20:00.000Z");
    const sections = buildHomeEventSections([
      buildEventListItem({
        id: "evt_1",
        slug: "us-x-iran-ceasefire-by",
        title: "美国与伊朗会在何时之前达成停火？",
        brief: "多子市场时间线事件。",
        category: "current_affairs",
        sourceName: "Polymarket",
        sourceUrl: "https://polymarket.com/event/us-x-iran-ceasefire-by",
        childMarkets: [
          {
            id: "mkt_1",
            slug: "us-x-iran-ceasefire-by-apr-15",
            question: "美国与伊朗会在 4 月 15 日前达成停火吗？",
            answerLabel: "4月15日",
            answerOrder: 1,
            category: "current_affairs",
            status: "live",
            closesAt: new Date("2026-04-15T12:00:00.000Z"),
            resolvesAt: new Date("2026-04-15T12:30:00.000Z"),
            liquidity: 120,
            yesShares: 82,
            noShares: 38,
            volumePoints: 188,
            activeTraders: 27,
            externalYesProbabilityBps: 6200,
            externalNoProbabilityBps: 3800,
            priceAnchorMode: "external",
            externalPriceUpdatedAt: new Date("2026-04-05T00:10:00.000Z"),
          },
        ],
      }, now),
      buildEventListItem({
        id: "evt_2",
        slug: "crypto-bitcoin-150k-q2-2026",
        title: "比特币会在 2026 年第二季度前突破 15 万美元吗？",
        brief: "加密价格时间边界事件。",
        category: "finance",
        sourceName: "Polymarket",
        sourceUrl: "https://polymarket.com/event/crypto-bitcoin-150k-q2-2026",
        childMarkets: [
          {
            id: "mkt_2",
            slug: "crypto-bitcoin-150k-q2-2026-primary",
            question: "比特币会在 2026 年第二季度前突破 15 万美元吗？",
            answerLabel: "Q2",
            answerOrder: 1,
            category: "finance",
            status: "live",
            closesAt: new Date("2026-04-25T12:00:00.000Z"),
            resolvesAt: new Date("2026-05-05T18:00:00.000Z"),
            liquidity: 130,
            yesShares: 70,
            noShares: 60,
            volumePoints: 220,
            activeTraders: 31,
            externalYesProbabilityBps: 5200,
            externalNoProbabilityBps: 4800,
            priceAnchorMode: "external",
            externalPriceUpdatedAt: new Date("2026-04-05T00:10:00.000Z"),
          },
        ],
      }, now),
    ], now);

    expect(sections[0]?.key).toBe("featured");
    expect(sections.find((section) => section.key === "world")?.markets).toHaveLength(1);
    expect(sections.find((section) => section.key === "crypto")?.markets).toHaveLength(1);
  });

  it("builds an event detail view with selected child holdings and event summary", () => {
    const event = buildEventDetailView({
      id: "evt_ceasefire",
      slug: "us-x-iran-ceasefire-by",
      title: "美国与伊朗会在何时之前达成停火？",
      brief: "多子市场时间线事件。",
      category: "current_affairs",
      sourceName: "Polymarket",
      sourceUrl: "https://polymarket.com/event/us-x-iran-ceasefire-by",
      childMarkets: [
        {
          id: "mkt_1",
          slug: "us-x-iran-ceasefire-by-apr-7",
          question: "美国与伊朗会在 4 月 7 日前达成停火吗？",
          answerLabel: "4月7日",
          answerOrder: 1,
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-07T12:00:00.000Z"),
          resolvesAt: new Date("2026-04-07T12:30:00.000Z"),
          liquidity: 115,
          yesShares: 42,
          noShares: 73,
          volumePoints: 64,
          activeTraders: 16,
        },
        {
          id: "mkt_2",
          slug: "us-x-iran-ceasefire-by-apr-15",
          question: "美国与伊朗会在 4 月 15 日前达成停火吗？",
          answerLabel: "4月15日",
          answerOrder: 2,
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-15T12:00:00.000Z"),
          resolvesAt: new Date("2026-04-15T12:30:00.000Z"),
          liquidity: 130,
          yesShares: 89,
          noShares: 41,
          volumePoints: 132,
          activeTraders: 28,
        },
      ],
      selectedChildSlug: "us-x-iran-ceasefire-by-apr-7",
      tone: "按公开停火声明和官方来源结算。",
      evidence: ["以官方联合声明为准。"],
      resolutionSource: [{ label: "Polymarket", href: "https://polymarket.com/event/us-x-iran-ceasefire-by" }],
      resolution: null,
      holdings: {
        totalShares: 9,
        selectedShares: 4,
        byMarketSlug: {
          "us-x-iran-ceasefire-by-apr-7": 4,
          "us-x-iran-ceasefire-by-apr-15": 5,
        },
        positionsByMarketSlug: {
          "us-x-iran-ceasefire-by-apr-7": { YES: 4, NO: 0 },
          "us-x-iran-ceasefire-by-apr-15": { YES: 0, NO: 5 },
        },
      },
    });

    expect(event.selectedChildMarket.slug).toBe("us-x-iran-ceasefire-by-apr-7");
    expect(event.primaryChildMarket.slug).toBe("us-x-iran-ceasefire-by-apr-15");
    expect(event.holdings.totalShares).toBe(9);
    expect(event.holdings.byMarketSlug["us-x-iran-ceasefire-by-apr-15"]).toBe(5);
  });
});

describe("portfolio view builder", () => {
  it("derives exposure and mark-to-market pnl from wallet and holdings", () => {
    const portfolio = buildPortfolioView({
      wallet: {
        userName: "北岸观察",
        balance: 125,
        credits: 151,
      },
      holdings: [
        {
          marketSlug: "cn-ai-phone-q3-shipment",
          marketQuestion: "2026年第三季度，中国 AI 手机单季出货量会突破 1000 万台吗？",
          side: "YES",
          shareCount: 22,
          totalCost: 11,
          currentProbability: 0.68,
        },
        {
          marketSlug: "fed-rate-cut-before-q3-2026",
          marketQuestion: "美联储会在 2026 年 9 月 30 日之前启动一次降息吗？",
          side: "NO",
          shareCount: 18,
          totalCost: 12,
          currentProbability: 0.59,
        },
      ],
      realizedPnl: 4,
      settledPnl: 1,
    });

    expect(portfolio.user.availableCredits).toBe(125);
    expect(portfolio.user.credits).toBe(151);
    expect(portfolio.summary.totalExposure).toBe(23);
    expect(portfolio.summary.markToMarket).toBeCloseTo(25.58, 5);
    expect(portfolio.summary.openPnl).toBeCloseTo(2.58, 5);
    expect(portfolio.summary.realizedPnl).toBe(4);
    expect(portfolio.summary.resolvedPnl).toBe(1);
  });
});
