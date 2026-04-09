import {
  PAYOUT_PER_SHARE,
  createMarketState,
  getMarketProbabilities,
  quoteBuyOrder,
  type MarketSide,
} from "../markets/lmsr";
import { scaleDownPositivePoints } from "../points";
import {
  HOMEPAGE_EXTERNAL_PRICE_MAX_AGE_MINUTES,
  LOCAL_CURATED_EVENT_SLUGS,
} from "@/config/content-governance";
import { resolveMarketImageUrl } from "./market-visuals";

export type MarketTopicKey =
  | "politics"
  | "world"
  | "sports"
  | "crypto"
  | "finance"
  | "tech"
  | "culture";

export type TrendDirection = "up" | "down" | "flat";
export type PriceAnchorMode = "external" | "hybrid" | "local";
export type ContentOrigin = "external_live" | "local_curated" | "seed_demo";
export type FreshnessStatus = "fresh" | "stale" | "missing";

export type MarketListItem = {
  id: string;
  slug: string;
  createdAt: Date;
  imageUrl: string;
  sourceName: string | null;
  sourceUrl: string | null;
  newsImageSource: string | null;
  heatScore: number;
  controversyScore: number;
  isFeatured: boolean;
  contentOrigin: ContentOrigin;
  freshnessStatus: FreshnessStatus;
  lastUpdatedAt: Date | null;
  homepageEligible: boolean;
  homepageRank: number;
  priceAnchorMode: PriceAnchorMode;
  externalPriceUpdatedAt: Date | null;
  externalPriceStale: boolean;
  question: string;
  brief: string;
  status: keyof typeof statusLabels;
  categoryLabel: string;
  statusLabel: string;
  topicKey: MarketTopicKey;
  topicLabel: string;
  closesAt: Date;
  resolvesAt: Date;
  volumePoints: number;
  activeTraders: number;
  liquidity: number;
  featuredScore: number;
  closingSoon: boolean;
  hasHistory: boolean;
  trendDirection: TrendDirection;
  probability: {
    yes: number;
    no: number;
  };
  sampleOrder: {
    cost: number;
    averagePrice: number;
    side: MarketSide;
  };
};

export type EventChildMarketView = {
  id: string;
  slug: string;
  question: string;
  answerLabel: string;
  answerOrder: number;
  status: keyof typeof statusLabels;
  statusLabel: string;
  isTradeable: boolean;
  freshnessStatus: FreshnessStatus;
  lastUpdatedAt: Date | null;
  priceAnchorMode: PriceAnchorMode;
  externalPriceUpdatedAt: Date | null;
  externalPriceStale: boolean;
  closesAt: Date;
  resolvesAt: Date;
  volumePoints: number;
  activeTraders: number;
  liquidity: number;
  probability: {
    yes: number;
    no: number;
  };
  buyPrices: {
    yes: number;
    no: number;
  };
  featuredScore: number;
  resolution?: {
    outcome: "YES" | "NO" | "VOID";
    sourceLabel: string;
    sourceUrl: string;
    rationale: string | null;
    resolvedAt: Date;
  } | null;
};

export type EventListItem = {
  id: string;
  slug: string;
  createdAt: Date;
  imageUrl: string;
  sourceName: string | null;
  sourceUrl: string | null;
  newsImageSource: string | null;
  heatScore: number;
  controversyScore: number;
  isFeatured: boolean;
  contentOrigin: ContentOrigin;
  freshnessStatus: FreshnessStatus;
  lastUpdatedAt: Date | null;
  homepageEligible: boolean;
  homepageRank: number;
  question: string;
  brief: string;
  status: keyof typeof statusLabels;
  categoryLabel: string;
  statusLabel: string;
  topicKey: MarketTopicKey;
  topicLabel: string;
  closesAt: Date;
  resolvesAt: Date;
  volumePoints: number;
  activeTraders: number;
  liquidity: number;
  featuredScore: number;
  closingSoon: boolean;
  hasHistory: boolean;
  trendDirection: TrendDirection;
  probability: {
    yes: number;
    no: number;
  };
  sampleOrder: {
    cost: number;
    averagePrice: number;
    side: MarketSide;
  };
  totalVolumePoints: number;
  activeChildCount: number;
  childMarkets: EventChildMarketView[];
  primaryChildMarket: EventChildMarketView;
};

export type HomeMarketSection = {
  key: "featured" | "closing-soon" | MarketTopicKey;
  title: string;
  description: string;
  markets: MarketListItem[];
};

export type HomeEventSection = {
  key: "featured" | "closing-soon" | MarketTopicKey;
  title: string;
  description: string;
  markets: EventListItem[];
};

export type MarketDetailView = MarketListItem & {
  tone: string;
  evidence: string[];
  parentEvent: {
    slug: string;
    title: string;
    childCount: number;
  } | null;
  externalReference: {
    label: string;
    href: string;
  } | null;
  newsReferences: Array<{
    sourceName: string;
    articleUrl: string;
    imageOriginalUrl?: string | null;
    cachedImageUrl?: string | null;
    fetchedAt?: string | null;
  }>;
  resolutionSource: Array<{
    label: string;
    href: string;
  }>;
  resolution: {
    outcome: "YES" | "NO" | "VOID";
    sourceLabel: string;
    sourceUrl: string;
    rationale: string | null;
    resolvedAt: Date;
  } | null;
};

export type EventDetailView = EventListItem & {
  tone: string;
  evidence: string[];
  externalReference: {
    label: string;
    href: string;
  } | null;
  newsReferences: Array<{
    sourceName: string;
    articleUrl: string;
    imageOriginalUrl?: string | null;
    cachedImageUrl?: string | null;
    fetchedAt?: string | null;
  }>;
  resolutionSource: Array<{
    label: string;
    href: string;
  }>;
  resolution: {
    outcome: "YES" | "NO" | "VOID";
    sourceLabel: string;
    sourceUrl: string;
    rationale: string | null;
    resolvedAt: Date;
  } | null;
  selectedChildMarket: EventChildMarketView;
  holdings: {
    totalShares: number;
    selectedShares: number;
    byMarketSlug: Record<string, number>;
    positionsByMarketSlug: Record<string, { YES: number; NO: number }>;
  };
};

export type AdminMarketListItem = {
  id: string;
  slug: string;
  question: string;
  status: keyof typeof statusLabels;
  categoryLabel: string;
  statusLabel: string;
  closesAt: Date;
  volumePoints: number;
};

export type AdminSettlementListItem = {
  id: string;
  slug: string;
  question: string;
  status: keyof typeof statusLabels;
  statusLabel: string;
  closesAt: Date;
  resolvesAt: Date;
  openPositionCount: number;
  openShareCount: number;
};

export type LeaderboardEntryView = {
  rank: number;
  name: string;
  title: string;
  score: number;
  hitRate: number;
  monthlyGain: number;
};

export type PortfolioView = {
  user: {
    name: string;
    availableCredits: number;
    credits: number;
  };
  holdings: Array<{
    marketSlug: string;
    marketQuestion: string;
    side: MarketSide;
    shares: number;
    totalCost: number;
    probability: number;
    currentValue: number;
    pnl: number;
  }>;
  summary: {
    totalExposure: number;
    markToMarket: number;
    openPnl: number;
    realizedPnl: number;
    resolvedPnl: number;
  };
};

const categoryLabels = {
  technology: "科技",
  finance: "财经",
  current_affairs: "时事",
} as const;

const statusLabels = {
  draft: "草稿",
  review: "待审核",
  live: "进行中",
  locked: "锁盘中",
  resolved: "已结算",
  voided: "已作废",
} as const;

const topicLabels: Record<MarketTopicKey, string> = {
  politics: "Politics",
  world: "World",
  sports: "Sports",
  crypto: "Crypto",
  finance: "Finance",
  tech: "Tech",
  culture: "Culture",
};

const sectionDescriptions: Record<HomeMarketSection["key"], string> = {
  featured: "当前成交和关注度最高的一批判断市场。",
  "closing-soon": "时间边界临近，优先关注锁盘前的价格变化。",
  politics: "聚焦选举、议程推进与治理事件。",
  world: "聚焦国际局势、政策冲击与全球事件。",
  sports: "聚焦赛果、晋级与联赛关键节点。",
  crypto: "聚焦加密资产价格、ETF 与监管变量。",
  finance: "聚焦利率、宏观与资产定价路径。",
  tech: "聚焦 AI、硬件、产品发布与平台竞合。",
  culture: "聚焦影视、娱乐和文化热点结果。",
};

const contentOriginLabels: Record<ContentOrigin, string> = {
  external_live: "外部动态",
  local_curated: "本地策展",
  seed_demo: "演示样例",
};

export function getCategoryLabel(category: keyof typeof categoryLabels) {
  return categoryLabels[category];
}

export function getStatusLabel(status: keyof typeof statusLabels) {
  return statusLabels[status];
}

export function getContentOriginLabel(origin: ContentOrigin) {
  return contentOriginLabels[origin];
}

export function inferMarketTopic(slug: string, category: keyof typeof categoryLabels): MarketTopicKey {
  if (slug.includes("ai-phone") || slug.includes("agent-os")) return "tech";
  if (slug.includes("fed-rate-cut")) return "finance";
  if (slug.startsWith("nba-") || slug.startsWith("nhl-") || slug.startsWith("mlb-")) return "sports";
  if (slug.startsWith("lol-") || slug.startsWith("cs2-")) return "sports";
  if (slug.startsWith("politics-")) return "politics";
  if (slug.startsWith("world-")) return "world";
  if (slug.startsWith("sports-")) return "sports";
  if (slug.startsWith("crypto-")) return "crypto";
  if (slug.startsWith("culture-")) return "culture";
  if (slug.startsWith("finance-")) return "finance";
  if (slug.startsWith("tech-")) return "tech";

  switch (category) {
    case "technology":
      return "tech";
    case "finance":
      return "finance";
    default:
      return "world";
  }
}

function inferTrendDirection(probability: { yes: number; no: number }): TrendDirection {
  const gap = probability.yes - probability.no;

  if (Math.abs(gap) < 0.04) {
    return "flat";
  }

  return gap > 0 ? "up" : "down";
}

function isClosingSoon(status: keyof typeof statusLabels, closesAt: Date, now: Date) {
  if (status !== "live" && status !== "locked") {
    return false;
  }

  const diff = closesAt.getTime() - now.getTime();
  return diff > 0 && diff <= 5 * 24 * 60 * 60 * 1000;
}

function isTradeableMarket(status: keyof typeof statusLabels, closesAt: Date, now: Date) {
  return status === "live" && closesAt.getTime() > now.getTime();
}

function inferContentOrigin(input: {
  slug: string;
  externalSource?: string | null;
  sourceUrl?: string | null;
}): ContentOrigin {
  if (
    input.externalSource === "polymarket" ||
    input.externalSource === "news_report" ||
    input.sourceUrl?.includes("polymarket.com")
  ) {
    return "external_live";
  }

  if (LOCAL_CURATED_EVENT_SLUGS.has(input.slug)) {
    return "local_curated";
  }

  return "seed_demo";
}

function inferFreshnessStatus(input: {
  contentOrigin: ContentOrigin;
  status: keyof typeof statusLabels;
  closesAt: Date;
  lastUpdatedAt?: Date | null;
  externalPriceStale?: boolean;
}, now: Date): FreshnessStatus {
  if (!isTradeableMarket(input.status, input.closesAt, now)) {
    return "stale";
  }

  if (input.contentOrigin === "seed_demo") {
    return "missing";
  }

  if (input.contentOrigin === "local_curated") {
    return "fresh";
  }

  if (!input.lastUpdatedAt || input.externalPriceStale) {
    return "stale";
  }

  const ageMinutes = (now.getTime() - input.lastUpdatedAt.getTime()) / 60_000;
  return ageMinutes <= HOMEPAGE_EXTERNAL_PRICE_MAX_AGE_MINUTES ? "fresh" : "stale";
}

function computeHomepageEligibility(input: {
  contentOrigin: ContentOrigin;
  status: keyof typeof statusLabels;
  closesAt: Date;
  freshnessStatus: FreshnessStatus;
}, now: Date) {
  if (!isTradeableMarket(input.status, input.closesAt, now)) {
    return false;
  }

  if (input.contentOrigin === "seed_demo") {
    return false;
  }

  if (input.contentOrigin === "external_live") {
    return input.freshnessStatus !== "missing";
  }

  return true;
}

function buildHomepageRank(input: {
  contentOrigin: ContentOrigin;
  freshnessStatus: FreshnessStatus;
  featuredScore: number;
  heatScore: number;
  controversyScore: number;
  volumePoints: number;
  activeTraders: number;
  isFeatured: boolean;
  homepageEligible: boolean;
}) {
  const originBoost =
    input.contentOrigin === "external_live"
      ? 120000
      : input.contentOrigin === "local_curated"
        ? 70000
        : -150000;
  const freshnessBoost =
    input.freshnessStatus === "fresh"
      ? 45000
      : input.freshnessStatus === "missing"
        ? -60000
        : -90000;
  const featureBoost = input.isFeatured ? 24000 : 0;
  const eligibilityPenalty = input.homepageEligible ? 0 : -250000;

  return (
    input.featuredScore +
    originBoost +
    freshnessBoost +
    featureBoost +
    input.heatScore * 900 +
    input.controversyScore * 650 +
    input.volumePoints +
    input.activeTraders * 16 +
    eligibilityPenalty
  );
}

function buildFeaturedScore(input: {
  volumePoints: number;
  activeTraders: number;
  status: keyof typeof statusLabels;
  probability: { yes: number; no: number };
}) {
  const conviction = Math.abs(input.probability.yes - input.probability.no) * 1000;
  const statusBoost =
    input.status === "live"
      ? 60000
      : input.status === "locked"
        ? 35000
        : input.status === "resolved"
          ? 18000
          : input.status === "voided"
            ? 12000
            : 9000;

  return input.volumePoints + input.activeTraders * 18 + conviction + statusBoost;
}

function normalizeBpsProbability(yesBps?: number | null, noBps?: number | null) {
  if (typeof yesBps !== "number" || typeof noBps !== "number") {
    return null;
  }

  const yes = Math.min(0.99, Math.max(0.01, yesBps / 10000));
  const no = Math.min(0.99, Math.max(0.01, noBps / 10000));
  const total = yes + no;

  return {
    yes: yes / total,
    no: no / total,
  };
}

export function getDisplayProbability(input: {
  localProbability: { yes: number; no: number };
  externalYesProbabilityBps?: number | null;
  externalNoProbabilityBps?: number | null;
  priceAnchorMode?: PriceAnchorMode | null;
}) {
  const mode = input.priceAnchorMode ?? "local";
  const externalProbability = normalizeBpsProbability(
    input.externalYesProbabilityBps,
    input.externalNoProbabilityBps,
  );

  if (!externalProbability || mode === "local") {
    return input.localProbability;
  }

  if (mode === "external") {
    return externalProbability;
  }

  const externalWeight = 0.7;
  const yes =
    externalProbability.yes * externalWeight +
    input.localProbability.yes * (1 - externalWeight);

  return {
    yes,
    no: 1 - yes,
  };
}

export function buildMarketListItem(
  input: {
    id: string;
    slug: string;
    createdAt?: Date;
    image?: string | null;
    newsImageCachedUrl?: string | null;
    newsImageUrl?: string | null;
    externalImageUrl?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    externalSource?: string | null;
    newsImageSource?: string | null;
    heatScore?: number;
    controversyScore?: number;
    isFeatured?: boolean;
    externalYesProbabilityBps?: number | null;
    externalNoProbabilityBps?: number | null;
    externalPriceUpdatedAt?: Date | null;
    externalPriceStale?: boolean;
    priceAnchorMode?: PriceAnchorMode | null;
    question: string;
    brief: string;
    category: keyof typeof categoryLabels;
    status: keyof typeof statusLabels;
    closesAt: Date;
    resolvesAt: Date;
    liquidity: number;
    yesShares: number;
    noShares: number;
    volumePoints: number;
    activeTraders: number;
  },
  now = new Date(),
): MarketListItem {
  const state = createMarketState({
    liquidity: input.liquidity,
    yesShares: input.yesShares,
    noShares: input.noShares,
  });
  const localProbability = getMarketProbabilities(state);
  const probability = getDisplayProbability({
    localProbability,
    externalYesProbabilityBps: input.externalYesProbabilityBps,
    externalNoProbabilityBps: input.externalNoProbabilityBps,
    priceAnchorMode: input.priceAnchorMode,
  });
  const leadingSide: MarketSide = probability.yes >= probability.no ? "YES" : "NO";
  const sampleOrder = quoteBuyOrder(state, {
    side: leadingSide,
    shareCount: 12,
  });
  const topicKey = inferMarketTopic(input.slug, input.category);
  const contentOrigin = inferContentOrigin({
    slug: input.slug,
    externalSource: input.externalSource,
    sourceUrl: input.sourceUrl,
  });
  const lastUpdatedAt = input.externalPriceUpdatedAt ?? input.createdAt ?? null;
  const freshnessStatus = inferFreshnessStatus(
    {
      contentOrigin,
      status: input.status,
      closesAt: input.closesAt,
      lastUpdatedAt,
      externalPriceStale: input.externalPriceStale,
    },
    now,
  );
  const featuredScore =
    buildFeaturedScore({
      volumePoints: input.volumePoints,
      activeTraders: input.activeTraders,
      status: input.status,
      probability,
    }) +
    (input.heatScore ?? 0) * 900 +
    (input.controversyScore ?? 0) * 650 +
    ((input.isFeatured ?? false) ? 42000 : 0);
  const homepageEligible = computeHomepageEligibility(
    {
      contentOrigin,
      status: input.status,
      closesAt: input.closesAt,
      freshnessStatus,
    },
    now,
  );
  const homepageRank = buildHomepageRank({
    contentOrigin,
    freshnessStatus,
    featuredScore,
    heatScore: input.heatScore ?? 0,
    controversyScore: input.controversyScore ?? 0,
    volumePoints: input.volumePoints,
    activeTraders: input.activeTraders,
    isFeatured: input.isFeatured ?? false,
    homepageEligible,
  });

  return {
    id: input.id,
    slug: input.slug,
    createdAt: input.createdAt ?? now,
    imageUrl: resolveMarketImageUrl(input.slug, topicKey, {
      manualImage: input.image,
      newsImageCachedUrl: input.newsImageCachedUrl,
      newsImageUrl: input.newsImageUrl,
      externalImageUrl: input.externalImageUrl,
    }),
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    newsImageSource: input.newsImageSource ?? null,
    heatScore: input.heatScore ?? 0,
    controversyScore: input.controversyScore ?? 0,
    isFeatured: input.isFeatured ?? false,
    contentOrigin,
    freshnessStatus,
    lastUpdatedAt,
    homepageEligible,
    homepageRank,
    priceAnchorMode: input.priceAnchorMode ?? "local",
    externalPriceUpdatedAt: input.externalPriceUpdatedAt ?? null,
    externalPriceStale: input.externalPriceStale ?? false,
    question: input.question,
    brief: input.brief,
    status: input.status,
    categoryLabel: categoryLabels[input.category],
    statusLabel: statusLabels[input.status],
    topicKey,
    topicLabel: topicLabels[topicKey],
    closesAt: input.closesAt,
    resolvesAt: input.resolvesAt,
    volumePoints: input.volumePoints,
    activeTraders: input.activeTraders,
    liquidity: input.liquidity,
    featuredScore,
    closingSoon: isClosingSoon(input.status, input.closesAt, now),
    hasHistory: true,
    trendDirection: inferTrendDirection(probability),
    probability,
    sampleOrder: {
      cost: scaleDownPositivePoints(sampleOrder.cost),
      averagePrice: scaleDownPositivePoints(sampleOrder.averagePrice),
      side: sampleOrder.side,
    },
  };
}

export function buildMarketDetailView(
  input: Parameters<typeof buildMarketListItem>[0] & {
    tone: string;
    evidence: string[];
    parentEvent?: MarketDetailView["parentEvent"];
    resolutionSource: Array<{
      label: string;
      href: string;
    }>;
    resolution: MarketDetailView["resolution"];
    newsReferences?: MarketDetailView["newsReferences"];
  },
): MarketDetailView {
  return {
    ...buildMarketListItem(input),
    tone: input.tone,
    evidence: input.evidence,
    parentEvent: input.parentEvent ?? null,
    externalReference: input.sourceName && input.sourceUrl ? { label: input.sourceName, href: input.sourceUrl } : null,
    newsReferences: input.newsReferences ?? [],
    resolutionSource: input.resolutionSource,
    resolution: input.resolution,
  };
}

export function buildEventChildMarketView(
  input: Omit<Parameters<typeof buildMarketListItem>[0], "brief"> & {
    brief?: string;
    answerLabel: string;
    answerOrder: number;
    resolution?: EventChildMarketView["resolution"];
  },
  now = new Date(),
): EventChildMarketView {
  const state = createMarketState({
    liquidity: input.liquidity,
    yesShares: input.yesShares,
    noShares: input.noShares,
  });
  const localProbability = getMarketProbabilities(state);
  const probability = getDisplayProbability({
    localProbability,
    externalYesProbabilityBps: input.externalYesProbabilityBps,
    externalNoProbabilityBps: input.externalNoProbabilityBps,
    priceAnchorMode: input.priceAnchorMode,
  });
  const lastUpdatedAt = input.externalPriceUpdatedAt ?? input.createdAt ?? null;
  const freshnessStatus = inferFreshnessStatus(
    {
      contentOrigin: inferContentOrigin({
        slug: input.slug,
        externalSource: input.externalSource,
        sourceUrl: input.sourceUrl,
      }),
      status: input.status,
      closesAt: input.closesAt,
      lastUpdatedAt,
      externalPriceStale: input.externalPriceStale,
    },
    now,
  );

  return {
    id: input.id,
    slug: input.slug,
    question: input.question,
    answerLabel: input.answerLabel,
    answerOrder: input.answerOrder,
    status: input.status,
    statusLabel: getStatusLabel(input.status),
    isTradeable: isTradeableMarket(input.status, input.closesAt, now),
    freshnessStatus,
    lastUpdatedAt,
    priceAnchorMode: input.priceAnchorMode ?? "local",
    externalPriceUpdatedAt: input.externalPriceUpdatedAt ?? null,
    externalPriceStale: input.externalPriceStale ?? false,
    closesAt: input.closesAt,
    resolvesAt: input.resolvesAt,
    volumePoints: input.volumePoints,
    activeTraders: input.activeTraders,
    liquidity: input.liquidity,
    probability,
    buyPrices: {
      yes: scaleDownPositivePoints(quoteBuyOrder(state, { side: "YES", shareCount: 1 }).averagePrice),
      no: scaleDownPositivePoints(quoteBuyOrder(state, { side: "NO", shareCount: 1 }).averagePrice),
    },
    featuredScore: buildFeaturedScore({
      volumePoints: input.volumePoints,
      activeTraders: input.activeTraders,
      status: input.status,
      probability,
    }),
    resolution: input.resolution ?? null,
  };
}

export function selectPrimaryEventChildMarket(childMarkets: EventChildMarketView[], now = new Date()) {
  const ranked = [...childMarkets].sort((left, right) => {
    const leftTradeable = isTradeableMarket(left.status, left.closesAt, now) ? 1 : 0;
    const rightTradeable = isTradeableMarket(right.status, right.closesAt, now) ? 1 : 0;
    const leftFresh = left.freshnessStatus === "fresh" ? 1 : 0;
    const rightFresh = right.freshnessStatus === "fresh" ? 1 : 0;

    return (
      rightTradeable - leftTradeable ||
      rightFresh - leftFresh ||
      right.volumePoints - left.volumePoints ||
      left.closesAt.getTime() - right.closesAt.getTime() ||
      left.answerOrder - right.answerOrder
    );
  });

  const [primary] = ranked;

  if (!primary) {
    throw new Error("Event must contain at least one child market.");
  }

  return primary;
}

export function buildEventListItem(
  input: {
    id: string;
    slug: string;
    title: string;
    brief: string;
    createdAt?: Date;
    image?: string | null;
    newsImageCachedUrl?: string | null;
    newsImageUrl?: string | null;
    externalImageUrl?: string | null;
    externalSource?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    newsImageSource?: string | null;
    heatScore?: number;
    controversyScore?: number;
    isFeatured?: boolean;
    category: keyof typeof categoryLabels;
    childMarkets: Array<
      Parameters<typeof buildEventChildMarketView>[0]
    >;
  },
  now = new Date(),
): EventListItem {
  const childMarkets = input.childMarkets.map((market) => buildEventChildMarketView(market, now));
  const primaryChildMarket = selectPrimaryEventChildMarket(childMarkets, now);
  const topicKey = inferMarketTopic(input.slug, input.category);
  const totalVolumePoints = childMarkets.reduce((sum, child) => sum + child.volumePoints, 0);
  const activeChildCount = childMarkets.length;
  const totalActiveTraders = childMarkets.reduce((sum, child) => sum + child.activeTraders, 0);
  const totalLiquidity = childMarkets.reduce((sum, child) => sum + child.liquidity, 0);
  const featuredScore =
    Math.max(...childMarkets.map((child) => child.featuredScore)) +
    (input.heatScore ?? 0) * 900 +
    (input.controversyScore ?? 0) * 650 +
    ((input.isFeatured ?? false) ? 42000 : 0);
  const contentOrigin = inferContentOrigin({
    slug: input.slug,
    externalSource: input.externalSource,
    sourceUrl: input.sourceUrl,
  });
  const lastUpdatedAt = primaryChildMarket.lastUpdatedAt ?? input.createdAt ?? null;
  const freshnessStatus = inferFreshnessStatus(
    {
      contentOrigin,
      status: primaryChildMarket.status,
      closesAt: primaryChildMarket.closesAt,
      lastUpdatedAt,
      externalPriceStale: primaryChildMarket.externalPriceStale,
    },
    now,
  );
  const homepageEligible = computeHomepageEligibility(
    {
      contentOrigin,
      status: primaryChildMarket.status,
      closesAt: primaryChildMarket.closesAt,
      freshnessStatus,
    },
    now,
  );
  const homepageRank = buildHomepageRank({
    contentOrigin,
    freshnessStatus,
    featuredScore,
    heatScore: input.heatScore ?? 0,
    controversyScore: input.controversyScore ?? 0,
    volumePoints: totalVolumePoints,
    activeTraders: totalActiveTraders,
    isFeatured: input.isFeatured ?? false,
    homepageEligible,
  });

  return {
    id: input.id,
    slug: input.slug,
    createdAt: input.createdAt ?? now,
    imageUrl: resolveMarketImageUrl(input.slug, topicKey, {
      manualImage: input.image,
      newsImageCachedUrl: input.newsImageCachedUrl,
      newsImageUrl: input.newsImageUrl,
      externalImageUrl: input.externalImageUrl,
    }),
    sourceName: input.sourceName ?? null,
    sourceUrl: input.sourceUrl ?? null,
    newsImageSource: input.newsImageSource ?? null,
    heatScore: input.heatScore ?? 0,
    controversyScore: input.controversyScore ?? 0,
    isFeatured: input.isFeatured ?? false,
    contentOrigin,
    freshnessStatus,
    lastUpdatedAt,
    homepageEligible,
    homepageRank,
    question: input.title,
    brief: input.brief,
    status: primaryChildMarket.status,
    categoryLabel: categoryLabels[input.category],
    statusLabel: primaryChildMarket.statusLabel,
    topicKey,
    topicLabel: topicLabels[topicKey],
    closesAt: primaryChildMarket.closesAt,
    resolvesAt: primaryChildMarket.resolvesAt,
    volumePoints: totalVolumePoints,
    activeTraders: totalActiveTraders,
    liquidity: totalLiquidity,
    featuredScore,
    closingSoon: isClosingSoon(primaryChildMarket.status, primaryChildMarket.closesAt, now),
    hasHistory: true,
    trendDirection: inferTrendDirection(primaryChildMarket.probability),
    probability: primaryChildMarket.probability,
    sampleOrder: {
      cost: primaryChildMarket.buyPrices.yes,
      averagePrice: primaryChildMarket.buyPrices.yes,
      side: primaryChildMarket.probability.yes >= primaryChildMarket.probability.no ? "YES" : "NO",
    },
    totalVolumePoints,
    activeChildCount,
    childMarkets,
    primaryChildMarket,
  };
}

export function buildEventDetailView(
  input: Parameters<typeof buildEventListItem>[0] & {
    selectedChildSlug?: string;
    tone: string;
    evidence: string[];
    resolutionSource: Array<{
      label: string;
      href: string;
    }>;
    resolution: EventDetailView["resolution"];
    newsReferences?: EventDetailView["newsReferences"];
    holdings?: EventDetailView["holdings"];
  },
): EventDetailView {
  const event = buildEventListItem(input);
  const selectedChildMarket =
    event.childMarkets.find((market) => market.slug === input.selectedChildSlug) ?? event.primaryChildMarket;

  return {
    ...event,
    tone: input.tone,
    evidence: input.evidence,
    externalReference: input.sourceName && input.sourceUrl ? { label: input.sourceName, href: input.sourceUrl } : null,
    newsReferences: input.newsReferences ?? [],
    resolutionSource: input.resolutionSource,
    resolution: input.resolution,
    selectedChildMarket,
    holdings: input.holdings ?? {
      totalShares: 0,
      selectedShares: 0,
      byMarketSlug: {},
      positionsByMarketSlug: {},
    },
  };
}

export function buildHomeMarketSections(markets: MarketListItem[], now = new Date()): HomeMarketSection[] {
  const sortedByFeatured = [...markets].sort((left, right) => right.featuredScore - left.featuredScore);
  const sortedByClosingSoon = [...markets]
    .filter((market) => isClosingSoon(market.status, market.closesAt, now))
    .sort((left, right) => left.closesAt.getTime() - right.closesAt.getTime());

  const topicOrder: MarketTopicKey[] = [
    "politics",
    "world",
    "sports",
    "crypto",
    "finance",
    "tech",
    "culture",
  ];

  const sections: HomeMarketSection[] = [
    {
      key: "featured",
      title: "热门市场",
      description: sectionDescriptions.featured,
      markets: sortedByFeatured.slice(0, 6),
    },
    {
      key: "closing-soon",
      title: "即将锁盘",
      description: sectionDescriptions["closing-soon"],
      markets: sortedByClosingSoon.slice(0, 6),
    },
  ];

  for (const topicKey of topicOrder) {
    const topicMarkets = sortedByFeatured.filter((market) => market.topicKey === topicKey).slice(0, 6);

    if (topicMarkets.length === 0) {
      continue;
    }

    sections.push({
      key: topicKey,
      title: topicLabels[topicKey],
      description: sectionDescriptions[topicKey],
      markets: topicMarkets,
    });
  }

  return sections.filter((section) => section.markets.length > 0);
}

export function buildHomeEventSections(events: EventListItem[], now = new Date()): HomeEventSection[] {
  const homepageEvents = events.filter((event) => event.homepageEligible);
  const featuredCandidates = homepageEvents.filter(
    (event) => event.contentOrigin !== "external_live" || event.freshnessStatus === "fresh",
  );
  const sortedByFeatured = [...(featuredCandidates.length > 0 ? featuredCandidates : homepageEvents)].sort(
    (left, right) =>
      right.homepageRank - left.homepageRank ||
      right.featuredScore - left.featuredScore ||
      right.totalVolumePoints - left.totalVolumePoints,
  );
  const sortedForSecondarySections = [...homepageEvents].sort(
    (left, right) =>
      right.homepageRank - left.homepageRank ||
      right.featuredScore - left.featuredScore ||
      right.totalVolumePoints - left.totalVolumePoints,
  );
  const sortedByClosingSoon = [...homepageEvents]
    .filter((event) => isClosingSoon(event.status, event.closesAt, now))
    .sort((left, right) => left.closesAt.getTime() - right.closesAt.getTime());

  const topicOrder: MarketTopicKey[] = [
    "politics",
    "world",
    "sports",
    "crypto",
    "finance",
    "tech",
    "culture",
  ];

  const sections: HomeEventSection[] = [
    {
      key: "featured",
      title: "热门事件",
      description: sectionDescriptions.featured,
      markets: sortedByFeatured.slice(0, 6),
    },
    {
      key: "closing-soon",
      title: "即将锁盘",
      description: sectionDescriptions["closing-soon"],
      markets: sortedByClosingSoon.slice(0, 6),
    },
  ];

  for (const topicKey of topicOrder) {
    const topicEvents = sortedForSecondarySections.filter((event) => event.topicKey === topicKey).slice(0, 6);

    if (topicEvents.length === 0) {
      continue;
    }

    sections.push({
      key: topicKey,
      title: topicLabels[topicKey],
      description: sectionDescriptions[topicKey],
      markets: topicEvents,
    });
  }

  return sections.filter((section) => section.markets.length > 0);
}

export function buildAdminMarketListItem(input: {
  id: string;
  slug: string;
  question: string;
  category: keyof typeof categoryLabels;
  status: keyof typeof statusLabels;
  closesAt: Date;
  volumePoints: number;
}): AdminMarketListItem {
  return {
    id: input.id,
    slug: input.slug,
    question: input.question,
    status: input.status,
    categoryLabel: getCategoryLabel(input.category),
    statusLabel: getStatusLabel(input.status),
    closesAt: input.closesAt,
    volumePoints: input.volumePoints,
  };
}

export function buildAdminSettlementListItem(input: AdminSettlementListItem): AdminSettlementListItem {
  return input;
}

export function buildPortfolioView(input: {
  wallet: {
    userName: string;
    balance: number;
    credits?: number;
  };
  holdings: Array<{
    marketSlug: string;
    marketQuestion: string;
    side: MarketSide;
    shareCount: number;
    totalCost: number;
    currentProbability: number;
  }>;
  realizedPnl: number;
  settledPnl: number;
}): PortfolioView {
  const holdings = input.holdings.map((holding) => {
    const currentValue = holding.shareCount * holding.currentProbability * PAYOUT_PER_SHARE;

    return {
      marketSlug: holding.marketSlug,
      marketQuestion: holding.marketQuestion,
      side: holding.side,
      shares: holding.shareCount,
      totalCost: holding.totalCost,
      probability: holding.currentProbability,
      currentValue,
      pnl: currentValue - holding.totalCost,
    };
  });

  return {
    user: {
      name: input.wallet.userName,
      availableCredits: input.wallet.balance,
      credits:
        input.wallet.credits ??
        input.wallet.balance + holdings.reduce((sum, item) => sum + item.currentValue, 0),
    },
    holdings,
    summary: {
      totalExposure: holdings.reduce((sum, item) => sum + item.totalCost, 0),
      markToMarket: holdings.reduce((sum, item) => sum + item.currentValue, 0),
      openPnl: holdings.reduce((sum, item) => sum + item.pnl, 0),
      realizedPnl: input.realizedPnl,
      resolvedPnl: input.settledPnl,
    },
  };
}
