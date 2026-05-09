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
  startDate?: string;
}): PolymarketEvent {
  const startDate = input.startDate ?? "2026-05-01T00:00:00Z";

  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    resolutionSource: `https://polymarket.com/event/${input.slug}`,
    startDate,
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
    published_at: startDate,
    createdAt: startDate,
    updatedAt: startDate,
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
}): PolymarketEvent {
  const startDate = input.startDate ?? "2026-05-01T00:00:00Z";
  const totalVolume = input.markets.reduce((sum, market) => sum + market.volume, 0);
  const totalVolume24hr = input.markets.reduce((sum, market) => sum + market.volume24hr, 0);
  const totalVolume1wk = input.markets.reduce((sum, market) => sum + market.volume1wk, 0);
  const totalLiquidity = input.markets.reduce((sum, market) => sum + market.liquidity, 0);
  const totalOpenInterest = input.markets.reduce((sum, market) => sum + market.openInterest, 0);
  const lastEndDate =
    input.markets
      .map((market) => market.endDate)
      .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())
      .at(-1) ?? startDate;

  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    description: input.description,
    resolutionSource: `https://polymarket.com/event/${input.slug}`,
    startDate,
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
    published_at: startDate,
    createdAt: startDate,
    updatedAt: startDate,
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
  buildMultiBinaryEvent({
    id: "fallback-us-iran-ceasefire",
    slug: "us-x-iran-ceasefire-by",
    title: "美伊会在何时之前出现停火框架？",
    description: "Polymarket 地缘政治热点事件，按不同时间边界拆分多个可交易子市场。",
    category: "World",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/us-x-iran-ceasefire-by-Cgmx3GCuOwjs.jpg",
    featured: true,
    markets: [
      {
        id: "fallback-us-iran-ceasefire-may-31",
        slug: "us-x-iran-ceasefire-by-may-31",
        question: "美伊会在 5 月 31 日前出现停火框架吗？",
        endDate: "2026-05-31T16:00:00Z",
        volume: 2840000,
        volume24hr: 720000,
        volume1wk: 2840000,
        liquidity: 128000,
        openInterest: 41000,
        yesPrice: 0.61,
        noPrice: 0.39,
      },
      {
        id: "fallback-us-iran-ceasefire-jun-30",
        slug: "us-x-iran-ceasefire-by-jun-30",
        question: "美伊会在 6 月 30 日前出现停火框架吗？",
        endDate: "2026-06-30T16:00:00Z",
        volume: 2480000,
        volume24hr: 540000,
        volume1wk: 2480000,
        liquidity: 116000,
        openInterest: 36000,
        yesPrice: 0.72,
        noPrice: 0.28,
      },
      {
        id: "fallback-us-iran-ceasefire-jul-31",
        slug: "us-x-iran-ceasefire-by-jul-31",
        question: "美伊会在 7 月 31 日前出现停火框架吗？",
        endDate: "2026-07-31T16:00:00Z",
        volume: 1960000,
        volume24hr: 330000,
        volume1wk: 1960000,
        liquidity: 102000,
        openInterest: 31000,
        yesPrice: 0.79,
        noPrice: 0.21,
      },
      {
        id: "fallback-us-iran-ceasefire-sep-30",
        slug: "us-x-iran-ceasefire-by-sep-30",
        question: "美伊会在 9 月 30 日前出现停火框架吗？",
        endDate: "2026-09-30T16:00:00Z",
        volume: 1420000,
        volume24hr: 180000,
        volume1wk: 1420000,
        liquidity: 86000,
        openInterest: 24000,
        yesPrice: 0.84,
        noPrice: 0.16,
      },
    ],
  }),
  buildBinaryEvent({
    id: "fallback-fed-cut-june",
    slug: "fed-cut-rates-before-june-2026",
    title: "美联储会在 2026 年 6 月前降息吗？",
    description: "围绕通胀、就业与金融条件的政策窗口事件。",
    category: "Finance",
    image: "/event-photo/finance.jpg",
    endDate: "2026-06-18T18:00:00Z",
    volume: 3680000,
    volume24hr: 940000,
    volume1wk: 3680000,
    liquidity: 154000,
    openInterest: 48000,
    featured: true,
    yesPrice: 0.34,
    noPrice: 0.66,
  }),
  buildBinaryEvent({
    id: "fallback-btc-ath-2026",
    slug: "bitcoin-new-ath-before-july-2026",
    title: "比特币会在 7 月前创下新高吗？",
    description: "加密资产主线事件，反映风险偏好和资金流向。",
    category: "Crypto",
    image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/BTC+fullsize.png",
    endDate: "2026-07-01T00:00:00Z",
    volume: 5220000,
    volume24hr: 1860000,
    volume1wk: 5220000,
    liquidity: 210000,
    openInterest: 68000,
    featured: true,
    yesPrice: 0.58,
    noPrice: 0.42,
  }),
  buildBinaryEvent({
    id: "fallback-sol-etf-2026",
    slug: "sol-etf-approved-before-august-2026",
    title: "Solana ETF 会在 8 月前获批吗？",
    description: "围绕美国监管节奏与加密资产机构化预期的概率事件。",
    category: "Crypto",
    image: "/event-photo/crypto.jpg",
    endDate: "2026-08-01T00:00:00Z",
    volume: 2440000,
    volume24hr: 580000,
    volume1wk: 2440000,
    liquidity: 122000,
    openInterest: 35000,
    yesPrice: 0.43,
    noPrice: 0.57,
  }),
  buildBinaryEvent({
    id: "fallback-nvidia-earnings-q2",
    slug: "nvidia-q2-revenue-beat-2026",
    title: "英伟达下一季营收会高于一致预期吗？",
    description: "科技龙头财报事件，直接影响 AI 板块情绪与估值。",
    category: "Tech",
    image: "/event-photo/tech.jpg",
    endDate: "2026-05-27T20:00:00Z",
    volume: 2760000,
    volume24hr: 620000,
    volume1wk: 2760000,
    liquidity: 118000,
    openInterest: 39000,
    yesPrice: 0.64,
    noPrice: 0.36,
  }),
  buildBinaryEvent({
    id: "fallback-openai-gpt6-2026",
    slug: "openai-gpt6-preview-before-september-2026",
    title: "OpenAI 会在 9 月前公开 GPT-6 预览吗？",
    description: "前沿模型迭代节奏事件，反映技术发布与资本预期。",
    category: "Tech",
    image: "/event-photo/tech.jpg",
    endDate: "2026-09-01T00:00:00Z",
    volume: 1980000,
    volume24hr: 310000,
    volume1wk: 1980000,
    liquidity: 94000,
    openInterest: 26000,
    yesPrice: 0.41,
    noPrice: 0.59,
  }),
  buildBinaryEvent({
    id: "fallback-champions-league-final",
    slug: "champions-league-final-over-two-goals-2026",
    title: "欧冠决赛总进球会超过 2 球吗？",
    description: "大型体育赛事结果型事件，适合作为高频参与入口。",
    category: "Sports",
    image: "/event-photo/sports.jpg",
    endDate: "2026-05-30T19:00:00Z",
    volume: 2280000,
    volume24hr: 760000,
    volume1wk: 2280000,
    liquidity: 108000,
    openInterest: 34000,
    yesPrice: 0.55,
    noPrice: 0.45,
  }),
  buildBinaryEvent({
    id: "fallback-lebron-finals-mvp",
    slug: "lebron-finals-mvp-2026",
    title: "詹姆斯会拿到 2026 总决赛 MVP 吗？",
    description: "围绕球星表现与赛果联动的体育热点事件。",
    category: "Sports",
    image: "/event-photo/sports.jpg",
    endDate: "2026-06-22T03:00:00Z",
    volume: 3140000,
    volume24hr: 880000,
    volume1wk: 3140000,
    liquidity: 132000,
    openInterest: 46000,
    yesPrice: 0.27,
    noPrice: 0.73,
  }),
  buildBinaryEvent({
    id: "fallback-us-govt-shutdown",
    slug: "us-government-shutdown-before-october-2026",
    title: "美国政府会在 10 月前再次停摆吗？",
    description: "财政谈判与国会博弈驱动的政治风险事件。",
    category: "Politics",
    image: "/event-photo/politics.jpg",
    endDate: "2026-10-01T00:00:00Z",
    volume: 2580000,
    volume24hr: 440000,
    volume1wk: 2580000,
    liquidity: 114000,
    openInterest: 32000,
    yesPrice: 0.38,
    noPrice: 0.62,
  }),
  buildBinaryEvent({
    id: "fallback-taiwan-drills",
    slug: "china-large-scale-taiwan-drills-before-june-2026",
    title: "中国会在 6 月前展开新一轮大规模台海军演吗？",
    description: "区域安全与政策风险相关的亚洲热点事件。",
    category: "World",
    image: "/event-photo/world.jpg",
    endDate: "2026-06-30T00:00:00Z",
    volume: 2860000,
    volume24hr: 670000,
    volume1wk: 2860000,
    liquidity: 126000,
    openInterest: 37000,
    yesPrice: 0.49,
    noPrice: 0.51,
  }),
  buildBinaryEvent({
    id: "fallback-apple-headset-china",
    slug: "apple-headset-china-launch-before-july-2026",
    title: "苹果头显会在 7 月前扩大中国市场发售吗？",
    description: "消费电子新品节奏与区域扩张进展事件。",
    category: "Tech",
    image: "/event-photo/tech.jpg",
    endDate: "2026-07-15T00:00:00Z",
    volume: 1840000,
    volume24hr: 260000,
    volume1wk: 1840000,
    liquidity: 88000,
    openInterest: 22000,
    yesPrice: 0.52,
    noPrice: 0.48,
  }),
];
