import { describe, expect, it } from "vitest";

import {
  buildHomeFeedSearch,
  buildHomeFeedSectionAnchorId,
  buildHomeFeedSectionNavItems,
  buildHomeFeedSectionPanelId,
  buildHomeFeedSectionToggleA11yLabel,
  buildHomeFeedSectionToggleLabel,
  canExpandHomeSection,
  filterAndSortHomeSections,
  getVisibleHomeSectionMarkets,
  parseHomeFeedSearchParams,
  selectHomeFeaturedMarkets,
} from "./home-feed";
import { buildEventListItem, buildHomeEventSections, buildHomeMarketSections, buildMarketListItem } from "./views";

describe("home feed controls", () => {
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

  it("filters the grouped feed by topic and removes empty sections", () => {
    const sections = buildHomeMarketSections(markets, new Date("2026-04-05T00:00:00.000Z"));

    const filtered = filterAndSortHomeSections(sections, {
      topic: "sports",
      sort: "featured",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((section) => section.markets.every((market) => market.topicKey === "sports"))).toBe(true);
    expect(filtered.some((section) => section.key === "sports")).toBe(true);
  });

  it("sorts each visible section by closing time when requested", () => {
    const sections = buildHomeMarketSections(markets, new Date("2026-04-05T00:00:00.000Z"));

    const filtered = filterAndSortHomeSections(sections, {
      topic: "all",
      sort: "closing",
    });

    const featured = filtered.find((section) => section.key === "featured");

    expect(featured?.markets.map((market) => market.slug)).toEqual([
      "crypto-bitcoin-above-150k-2026",
      "sports-lakers-playoffs-2026",
      "politics-us-house-approval-june-2026",
    ]);
  });

  it("filters visible markets by terminal status bucket", () => {
    const sections = buildHomeMarketSections(
      [
        ...markets,
        buildMarketListItem({
          id: "mkt_4",
          slug: "world-ceasefire-before-july-2026",
          question: "主要冲突会在 2026 年 7 月前达成停火框架吗？",
          brief: "国际事件终态样例。",
          category: "current_affairs",
          status: "resolved",
          closesAt: new Date("2026-03-05T16:00:00.000Z"),
          resolvesAt: new Date("2026-03-12T12:00:00.000Z"),
          liquidity: 128,
          yesShares: 75,
          noShares: 45,
          volumePoints: 480000,
          activeTraders: 2200,
        }),
      ],
      new Date("2026-04-05T00:00:00.000Z"),
    );

    const filtered = filterAndSortHomeSections(sections, {
      topic: "all",
      sort: "featured",
      status: "terminal",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((section) =>
        section.markets.every((market) => market.status === "resolved" || market.status === "voided"),
      ),
    ).toBe(true);
  });

  it("filters visible markets by keyword across question and brief", () => {
    const sections = buildHomeMarketSections(markets, new Date("2026-04-05T00:00:00.000Z"));

    const filtered = filterAndSortHomeSections(sections, {
      query: "湖人",
    });

    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every((section) =>
        section.markets.every(
          (market) => market.question.includes("湖人") || market.brief.includes("湖人"),
        ),
      ),
    ).toBe(true);
  });

  it("returns a preview slice for collapsed sections and all cards when expanded", () => {
    const sections = buildHomeMarketSections(
      [
        ...markets,
        buildMarketListItem({
          id: "mkt_4",
          slug: "sports-warriors-playoffs-2026",
          question: "勇士会进入 2026 季后赛吗？",
          brief: "西部边缘席位判断。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-05T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-12T12:00:00.000Z"),
          liquidity: 121,
          yesShares: 58,
          noShares: 62,
          volumePoints: 360000,
          activeTraders: 1700,
        }),
        buildMarketListItem({
          id: "mkt_5",
          slug: "sports-celtics-finals-2026",
          question: "凯尔特人会打进 2026 总决赛吗？",
          brief: "争冠分区强队判断。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-07T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-15T12:00:00.000Z"),
          liquidity: 124,
          yesShares: 67,
          noShares: 53,
          volumePoints: 355000,
          activeTraders: 1680,
        }),
        buildMarketListItem({
          id: "mkt_6",
          slug: "sports-arsenal-top4-2026",
          question: "阿森纳会拿到 2026 欧冠资格吗？",
          brief: "联赛前四席位判断。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-08T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-18T12:00:00.000Z"),
          liquidity: 126,
          yesShares: 69,
          noShares: 51,
          volumePoints: 352000,
          activeTraders: 1650,
        }),
        buildMarketListItem({
          id: "mkt_7",
          slug: "sports-liverpool-top4-2026",
          question: "利物浦会拿到 2026 欧冠资格吗？",
          brief: "英超前四争夺。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-09T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-19T12:00:00.000Z"),
          liquidity: 120,
          yesShares: 62,
          noShares: 58,
          volumePoints: 348000,
          activeTraders: 1620,
        }),
      ],
      new Date("2026-04-05T00:00:00.000Z"),
    );

    const sportsSection = sections.find((section) => section.key === "sports");

    expect(sportsSection).toBeDefined();
    expect(canExpandHomeSection(sportsSection!)).toBe(true);
    expect(getVisibleHomeSectionMarkets(sportsSection!, false)).toHaveLength(4);
    expect(getVisibleHomeSectionMarkets(sportsSection!, true)).toHaveLength(5);
  });

  it("selects featured top 3 and fills gaps from fallback markets", () => {
    const sections = buildHomeMarketSections(markets, new Date("2026-04-05T00:00:00.000Z"));
    const featuredSection = sections.find((section) => section.key === "featured");

    expect(featuredSection).toBeDefined();

    const selected = selectHomeFeaturedMarkets(
      [{ ...featuredSection!, markets: featuredSection!.markets.slice(0, 2) }],
      markets,
      3,
    );

    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((item) => item.id)).size).toBe(3);
    expect(selected.slice(0, 2).map((item) => item.id)).toEqual(
      featuredSection!.markets.slice(0, 2).map((item) => item.id),
    );
  });

  it("prefers topic diversity for the top 3 featured cards before repeating the same topic", () => {
    const now = new Date("2026-04-08T00:00:00.000Z");
    const cultureA = buildEventListItem({
      id: "evt_culture_a",
      slug: "culture-a",
      title: "Culture A",
      brief: "Culture A",
      category: "current_affairs",
      childMarkets: [{
        id: "mkt_culture_a",
        slug: "culture-a",
        question: "Culture A",
        answerLabel: "主市场",
        answerOrder: 1,
        category: "current_affairs",
        status: "live",
        closesAt: new Date("2026-06-01T00:00:00.000Z"),
        resolvesAt: new Date("2026-06-02T00:00:00.000Z"),
        liquidity: 100,
        yesShares: 55,
        noShares: 45,
        volumePoints: 9000,
        activeTraders: 400,
      }],
    }, now);
    const cultureB = buildEventListItem({
      id: "evt_culture_b",
      slug: "culture-b",
      title: "Culture B",
      brief: "Culture B",
      category: "current_affairs",
      childMarkets: [{
        id: "mkt_culture_b",
        slug: "culture-b",
        question: "Culture B",
        answerLabel: "主市场",
        answerOrder: 1,
        category: "current_affairs",
        status: "live",
        closesAt: new Date("2026-06-03T00:00:00.000Z"),
        resolvesAt: new Date("2026-06-04T00:00:00.000Z"),
        liquidity: 100,
        yesShares: 56,
        noShares: 44,
        volumePoints: 8500,
        activeTraders: 380,
      }],
    }, now);
    const world = buildEventListItem({
      id: "evt_world",
      slug: "world-a",
      title: "World A",
      brief: "World A",
      category: "current_affairs",
      childMarkets: [{
        id: "mkt_world",
        slug: "world-a",
        question: "World A",
        answerLabel: "主市场",
        answerOrder: 1,
        category: "current_affairs",
        status: "live",
        closesAt: new Date("2026-05-01T00:00:00.000Z"),
        resolvesAt: new Date("2026-05-02T00:00:00.000Z"),
        liquidity: 100,
        yesShares: 60,
        noShares: 40,
        volumePoints: 4000,
        activeTraders: 210,
      }],
    }, now);
    const finance = buildEventListItem({
      id: "evt_finance",
      slug: "finance-a",
      title: "Finance A",
      brief: "Finance A",
      category: "finance",
      childMarkets: [{
        id: "mkt_finance",
        slug: "finance-a",
        question: "Finance A",
        answerLabel: "主市场",
        answerOrder: 1,
        category: "finance",
        status: "live",
        closesAt: new Date("2026-05-08T00:00:00.000Z"),
        resolvesAt: new Date("2026-05-09T00:00:00.000Z"),
        liquidity: 100,
        yesShares: 58,
        noShares: 42,
        volumePoints: 3800,
        activeTraders: 205,
      }],
    }, now);

    const selected = selectHomeFeaturedMarkets(
      [{
        key: "featured",
        title: "热门事件",
        description: "test",
        markets: [cultureA, cultureB, world, finance],
      }],
      [cultureA, cultureB, world, finance],
      3,
    );

    expect(selected).toHaveLength(3);
    expect(selected.map((item) => item.topicKey)).toEqual(["culture", "world", "finance"]);
  });

  it("builds stable quick-jump anchors for visible sections", () => {
    const sections = buildHomeMarketSections(markets, new Date("2026-04-05T00:00:00.000Z"));

    expect(buildHomeFeedSectionAnchorId("featured")).toBe("home-feed-featured");
    expect(buildHomeFeedSectionPanelId("featured")).toBe("home-feed-featured-panel");
    expect(buildHomeFeedSectionNavItems(sections)).toEqual(
      sections.map((section) => ({
        key: section.key,
        title: section.title,
        anchorId: `home-feed-${section.key}`,
      })),
    );
  });

  it("excludes stale and locked events from the default homepage sections", () => {
    const now = new Date("2026-04-08T12:00:00.000Z");
    const sections = buildHomeEventSections(
      [
        buildEventListItem(
          {
            id: "evt_live_external",
            slug: "us-x-iran-ceasefire-by",
            title: "美伊会在何时之前出现停火框架？",
            brief: "真实外部同步事件。",
            category: "current_affairs",
            sourceName: "Polymarket",
            sourceUrl: "https://polymarket.com/event/us-x-iran-ceasefire-by",
            childMarkets: [
              {
                id: "mkt_live_external",
                slug: "us-x-iran-ceasefire-by-apr-30",
                question: "美伊会在 4 月 30 日前出现停火框架吗？",
                answerLabel: "4月30日",
                answerOrder: 1,
                category: "current_affairs",
                status: "live",
                closesAt: new Date("2026-05-01T00:00:00.000Z"),
                resolvesAt: new Date("2026-07-01T00:00:00.000Z"),
                liquidity: 120,
                yesShares: 46,
                noShares: 54,
                volumePoints: 31200,
                activeTraders: 3400,
                externalYesProbabilityBps: 4600,
                externalNoProbabilityBps: 5400,
                priceAnchorMode: "external",
                externalPriceUpdatedAt: new Date("2026-04-08T11:45:00.000Z"),
              },
            ],
          },
          now,
        ),
        buildEventListItem(
          {
            id: "evt_locked_old",
            slug: "israel-military-action-against-gaza-on",
            title: "以色列会对加沙采取军事行动吗？",
            brief: "旧锁盘事件。",
            category: "current_affairs",
            sourceName: "Polymarket",
            sourceUrl: "https://polymarket.com/event/israel-military-action-against-gaza-on",
            childMarkets: [
              {
                id: "mkt_locked_old",
                slug: "israel-military-action-against-gaza-on",
                question: "以色列会对加沙采取军事行动吗？",
                answerLabel: "主市场",
                answerOrder: 1,
                category: "current_affairs",
                status: "locked",
                closesAt: new Date("2026-04-06T08:00:00.000Z"),
                resolvesAt: new Date("2026-04-06T08:00:00.000Z"),
                liquidity: 120,
                yesShares: 95,
                noShares: 5,
                volumePoints: 5400000,
                activeTraders: 2200,
              },
            ],
          },
          now,
        ),
        buildEventListItem(
          {
            id: "evt_seed_demo",
            slug: "seed-demo-local-event",
            title: "开发示例事件",
            brief: "本地演示事件。",
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
                closesAt: new Date("2026-05-09T12:00:00.000Z"),
                resolvesAt: new Date("2026-05-10T12:00:00.000Z"),
                liquidity: 100,
                yesShares: 51,
                noShares: 49,
                volumePoints: 9999,
                activeTraders: 500,
              },
            ],
          },
          now,
        ),
      ],
      now,
    );

    const featured = sections.find((section) => section.key === "featured");

    expect(featured?.markets.map((market) => market.slug)).toEqual(["us-x-iran-ceasefire-by"]);
  });

  it("builds stable expand-toggle copy and accessibility labels", () => {
    const sections = buildHomeMarketSections(
      [
        ...markets,
        buildMarketListItem({
          id: "mkt_4",
          slug: "sports-warriors-playoffs-2026",
          question: "勇士会进入 2026 季后赛吗？",
          brief: "西部边缘席位判断。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-05T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-12T12:00:00.000Z"),
          liquidity: 121,
          yesShares: 58,
          noShares: 62,
          volumePoints: 360000,
          activeTraders: 1700,
        }),
        buildMarketListItem({
          id: "mkt_5",
          slug: "sports-celtics-finals-2026",
          question: "凯尔特人会打进 2026 总决赛吗？",
          brief: "争冠分区强队判断。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-07T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-15T12:00:00.000Z"),
          liquidity: 124,
          yesShares: 67,
          noShares: 53,
          volumePoints: 355000,
          activeTraders: 1680,
        }),
        buildMarketListItem({
          id: "mkt_6",
          slug: "sports-arsenal-top4-2026",
          question: "阿森纳会拿到 2026 欧冠资格吗？",
          brief: "联赛前四席位判断。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-08T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-18T12:00:00.000Z"),
          liquidity: 126,
          yesShares: 69,
          noShares: 51,
          volumePoints: 352000,
          activeTraders: 1650,
        }),
        buildMarketListItem({
          id: "mkt_7",
          slug: "sports-liverpool-top4-2026",
          question: "利物浦会拿到 2026 欧冠资格吗？",
          brief: "英超前四争夺。",
          category: "current_affairs",
          status: "live",
          closesAt: new Date("2026-04-09T18:00:00.000Z"),
          resolvesAt: new Date("2026-04-19T12:00:00.000Z"),
          liquidity: 120,
          yesShares: 62,
          noShares: 58,
          volumePoints: 348000,
          activeTraders: 1620,
        }),
      ],
      new Date("2026-04-05T00:00:00.000Z"),
    );

    const sportsSection = sections.find((section) => section.key === "sports");

    expect(sportsSection).toBeDefined();
    expect(buildHomeFeedSectionToggleLabel(sportsSection!, false)).toBe("查看更多 +1");
    expect(buildHomeFeedSectionToggleLabel(sportsSection!, true)).toBe("收起");
    expect(buildHomeFeedSectionToggleA11yLabel(sportsSection!, false)).toBe("展开 Sports 分组");
    expect(buildHomeFeedSectionToggleA11yLabel(sportsSection!, true)).toBe("收起 Sports 分组");
  });
});

describe("home feed search params", () => {
  it("parses only supported values from query strings", () => {
    const parsed = parseHomeFeedSearchParams(
      new URLSearchParams("topic=crypto&sort=volume&status=locked"),
    );

    expect(parsed).toEqual({
      topic: "crypto",
      sort: "volume",
      status: "locked",
      query: "",
    });
  });

  it("drops default controls when serializing query strings", () => {
    expect(
      buildHomeFeedSearch({
        topic: "all",
        sort: "featured",
        status: "all",
        query: "",
      }),
    ).toBe("");

    expect(
      buildHomeFeedSearch({
        topic: "sports",
        sort: "closing",
        status: "live",
        query: "lakers",
      }),
    ).toBe("topic=sports&sort=closing&status=live&query=lakers");
  });

  it("normalizes keyword search params and trims blanks", () => {
    const parsed = parseHomeFeedSearchParams(
      new URLSearchParams("topic=crypto&sort=volume&status=locked&query=%20%20btc%20%20"),
    );

    expect(parsed).toEqual({
      topic: "crypto",
      sort: "volume",
      status: "locked",
      query: "btc",
    });
  });
});
