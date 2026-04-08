import type { PolymarketEvent } from "./polymarket";

function buildBinaryEvent(input: {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  endDate: string;
  volume: number;
  volume24hr: number;
  volume1wk: number;
  liquidity: number;
  openInterest: number;
  featured?: boolean;
  yesPrice: number;
  noPrice: number;
}) : PolymarketEvent {
  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    resolutionSource: `https://polymarket.com/event/${input.slug}`,
    startDate: "2026-04-06T00:00:00Z",
    endDate: input.endDate,
    image: input.image,
    icon: null,
    active: true,
    closed: false,
    archived: false,
    new: false,
    featured: input.featured ?? false,
    restricted: false,
    liquidity: input.liquidity,
    volume: input.volume,
    openInterest: input.openInterest,
    sortBy: null,
    category: input.category,
    published_at: "2026-04-06T00:00:00Z",
    createdAt: "2026-04-06T00:00:00Z",
    updatedAt: "2026-04-06T00:00:00Z",
    competitive: 0,
    volume24hr: input.volume24hr,
    volume1wk: input.volume1wk,
    volume1mo: 0,
    volume1yr: 0,
    liquidityAmm: 0,
    liquidityClob: 0,
    commentCount: Math.max(18, Math.round(input.volume / 120000)),
    markets: [
      {
        id: `${input.id}-market`,
        question: input.title,
        slug: input.slug,
        resolutionSource: `https://polymarket.com/event/${input.slug}`,
        endDate: input.endDate,
        category: input.category,
        liquidity: String(input.liquidity),
        image: input.image,
        icon: null,
        description: input.description,
        outcomes: '["Yes","No"]',
        outcomePrices: JSON.stringify([String(input.yesPrice), String(input.noPrice)]),
        volume: String(input.volume),
        active: true,
        closed: false,
        archived: false,
        featured: input.featured ?? false,
        volume24hr: input.volume24hr,
        volume1wk: input.volume1wk,
        openInterest: input.openInterest,
      },
    ],
    series: null,
    tags: [],
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
}

function buildMultiBinaryEvent(input: {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  image: string;
  startDate?: string;
  featured?: boolean;
  markets: Array<{
    id: string;
    slug: string;
    question: string;
    endDate: string;
    volume: number;
    volume24hr: number;
    volume1wk: number;
    liquidity: number;
    openInterest: number;
    yesPrice: number;
    noPrice: number;
    image?: string;
    description?: string;
  }>;
}) : PolymarketEvent {
  const totalVolume = input.markets.reduce((sum, market) => sum + market.volume, 0);
  const totalVolume24hr = input.markets.reduce((sum, market) => sum + market.volume24hr, 0);
  const totalVolume1wk = input.markets.reduce((sum, market) => sum + market.volume1wk, 0);
  const totalLiquidity = input.markets.reduce((sum, market) => sum + market.liquidity, 0);
  const totalOpenInterest = input.markets.reduce((sum, market) => sum + market.openInterest, 0);
  const lastEndDate = input.markets
    .map((market) => market.endDate)
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())
    .at(-1) ?? input.startDate ?? "2026-04-06T00:00:00Z";

  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    resolutionSource: `https://polymarket.com/event/${input.slug}`,
    startDate: input.startDate ?? "2026-04-06T00:00:00Z",
    endDate: lastEndDate,
    image: input.image,
    icon: null,
    active: true,
    closed: false,
    archived: false,
    new: false,
    featured: input.featured ?? false,
    restricted: false,
    liquidity: totalLiquidity,
    volume: totalVolume,
    openInterest: totalOpenInterest,
    sortBy: null,
    category: input.category,
    published_at: input.startDate ?? "2026-04-06T00:00:00Z",
    createdAt: input.startDate ?? "2026-04-06T00:00:00Z",
    updatedAt: input.startDate ?? "2026-04-06T00:00:00Z",
    competitive: 0,
    volume24hr: totalVolume24hr,
    volume1wk: totalVolume1wk,
    volume1mo: 0,
    volume1yr: 0,
    liquidityAmm: 0,
    liquidityClob: 0,
    commentCount: Math.max(24, Math.round(totalVolume / 140000)),
    markets: input.markets.map((market, index) => ({
      id: market.id,
      question: market.question,
      slug: market.slug,
      resolutionSource: `https://polymarket.com/event/${input.slug}`,
      endDate: market.endDate,
      category: input.category,
      liquidity: String(market.liquidity),
      image: market.image ?? input.image,
      icon: null,
      description: market.description ?? input.description,
      outcomes: '["Yes","No"]',
      outcomePrices: JSON.stringify([String(market.yesPrice), String(market.noPrice)]),
      volume: String(market.volume),
      active: true,
      closed: false,
      archived: false,
      featured: index === 0 ? input.featured ?? false : false,
      volume24hr: market.volume24hr,
      volume1wk: market.volume1wk,
      openInterest: market.openInterest,
    })),
    series: null,
    tags: [],
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
}

export const POLYMARKET_FALLBACK_EVENTS: PolymarketEvent[] = [
  buildBinaryEvent({
    id: "fallback-fokus-wildcard",
    slug: "cs2-fokus-wc1-2026-04-06",
    title: "FOKUS vs. Wildcard",
    description: "Chrome DevTools 采集自 Polymarket 首页的实时电竞对战事件快照。",
    category: "Sports",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/counter-strike-image-16c415c538.png",
    endDate: "2026-04-06T08:00:00Z",
    volume: 280000,
    volume24hr: 180000,
    volume1wk: 280000,
    liquidity: 120000,
    openInterest: 64000,
    featured: true,
    yesPrice: 0.75,
    noPrice: 0.25,
  }),
  buildBinaryEvent({
    id: "fallback-btc-5m",
    slug: "btc-updown-5m-1775454600",
    title: "BTC 5分钟涨跌",
    description: "来自 Polymarket 首页的高频加密方向事件，用于驱动首页热点与图片展示。",
    category: "Crypto",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/BTC+fullsize.png",
    endDate: "2026-04-06T02:00:00Z",
    volume: 3200000,
    volume24hr: 3200000,
    volume1wk: 6200000,
    liquidity: 220000,
    openInterest: 90000,
    featured: true,
    yesPrice: 0.5,
    noPrice: 0.5,
  }),
  buildMultiBinaryEvent({
    id: "fallback-us-iran-ceasefire",
    slug: "us-x-iran-ceasefire-by",
    title: "美伊会在何时之前出现停火框架？",
    description: "来自 Polymarket 热门事件页的地缘政治多时间边界快照。",
    category: "World",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/us-x-iran-ceasefire-by-Cgmx3GCuOwjs.jpg",
    featured: true,
    markets: [
      {
        id: "fallback-us-iran-ceasefire-apr-15",
        slug: "us-x-iran-ceasefire-by-apr-15",
        question: "美伊会在 4 月 15 日前出现停火框架吗？",
        endDate: "2026-04-15T16:00:00Z",
        volume: 2380000,
        volume24hr: 660000,
        volume1wk: 2380000,
        liquidity: 120000,
        openInterest: 42000,
        yesPrice: 0.23,
        noPrice: 0.77,
      },
      {
        id: "fallback-us-iran-ceasefire-apr-30",
        slug: "us-x-iran-ceasefire-by-apr-30",
        question: "美伊会在 4 月 30 日前出现停火框架吗？",
        endDate: "2026-04-30T16:00:00Z",
        volume: 3120000,
        volume24hr: 840000,
        volume1wk: 3120000,
        liquidity: 150000,
        openInterest: 52000,
        yesPrice: 0.46,
        noPrice: 0.54,
      },
      {
        id: "fallback-us-iran-ceasefire-may-31",
        slug: "us-x-iran-ceasefire-by-may-31",
        question: "美伊会在 5 月 31 日前出现停火框架吗？",
        endDate: "2026-05-31T16:00:00Z",
        volume: 1840000,
        volume24hr: 420000,
        volume1wk: 1840000,
        liquidity: 104000,
        openInterest: 36000,
        yesPrice: 0.61,
        noPrice: 0.39,
      },
      {
        id: "fallback-us-iran-ceasefire-jun-30",
        slug: "us-x-iran-ceasefire-by-jun-30",
        question: "美伊会在 6 月 30 日前出现停火框架吗？",
        endDate: "2026-06-30T16:00:00Z",
        volume: 1060000,
        volume24hr: 180000,
        volume1wk: 1060000,
        liquidity: 86000,
        openInterest: 28000,
        yesPrice: 0.74,
        noPrice: 0.26,
      },
    ],
  }),
  buildBinaryEvent({
    id: "fallback-gaza-april-5",
    slug: "israel-military-action-against-gaza-on",
    title: "以色列会在 2026 年 4 月 5 日对加沙采取军事行动吗？",
    description: "来自 Polymarket 突发新闻榜的事件快照。",
    category: "World",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/polymarket-og-image.png",
    endDate: "2026-04-06T00:00:00Z",
    volume: 5400000,
    volume24hr: 1800000,
    volume1wk: 5400000,
    liquidity: 175000,
    openInterest: 88000,
    yesPrice: 0.95,
    noPrice: 0.05,
  }),
  buildBinaryEvent({
    id: "fallback-jdg-blg",
    slug: "lol-jdg-blg-2026-04-05",
    title: "JD Gaming vs. Bilibili Gaming",
    description: "来自 Polymarket 首页的电竞即时赛果事件快照。",
    category: "Sports",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/league-of-legends-7eb6fdbf7f.png",
    endDate: "2026-04-05T12:00:00Z",
    volume: 2000000,
    volume24hr: 1400000,
    volume1wk: 2000000,
    liquidity: 92000,
    openInterest: 54000,
    yesPrice: 0.51,
    noPrice: 0.49,
  }),
  buildBinaryEvent({
    id: "fallback-rockets-warriors",
    slug: "nba-hou-gsw-2026-04-05",
    title: "Rockets vs. Warriors",
    description: "来自 Polymarket 首页的 NBA 单场事件快照。",
    category: "Sports",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/nba-game-market.png",
    endDate: "2026-04-05T14:00:00Z",
    volume: 8000000,
    volume24hr: 3000000,
    volume1wk: 8000000,
    liquidity: 150000,
    openInterest: 76000,
    yesPrice: 0.99,
    noPrice: 0.01,
  }),
];
