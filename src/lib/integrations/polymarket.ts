import type { marketCategoryEnum, marketStatusEnum } from "@/db/schema";
import { scaleDownPositivePoints } from "../points";
import { POLYMARKET_FALLBACK_EVENTS } from "./polymarket-fallback";

type MarketCategory = typeof marketCategoryEnum.enumValues[number];
type MarketStatus = typeof marketStatusEnum.enumValues[number];

export type PolymarketTag = {
  id: string;
  slug: string;
  label: string;
};

export type PolymarketMarket = {
  id: string;
  question: string;
  slug: string;
  resolutionSource: string | null;
  endDate: string | null;
  category: string | null;
  liquidity: string | number | null;
  image: string | null;
  icon: string | null;
  description: string | null;
  outcomes: string | string[] | null;
  outcomePrices: string | string[] | null;
  volume: string | number | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  featured: boolean;
  volume24hr: number | null;
  volume1wk: number | null;
  openInterest: number | null;
  conditionId?: string | null;
  clobTokenIds?: string | string[] | null;
};

export type PolymarketEvent = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  resolutionSource: string | null;
  startDate: string | null;
  endDate: string | null;
  image: string | null;
  icon: string | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  new: boolean;
  featured: boolean;
  restricted: boolean;
  liquidity: number | null;
  volume: number | null;
  openInterest: number | null;
  sortBy: string | null;
  category: string | null;
  published_at: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  competitive: number | null;
  volume24hr: number | null;
  volume1wk: number | null;
  volume1mo: number | null;
  volume1yr: number | null;
  liquidityAmm: number | null;
  liquidityClob: number | null;
  commentCount: number | null;
  markets: PolymarketMarket[];
  series: unknown;
  tags: PolymarketTag[];
  cyom: boolean;
  closedTime: string | null;
  showAllOutcomes: boolean;
  showMarketImages: boolean;
  enableNegRisk: boolean;
  seriesSlug: string | null;
  negRiskAugmented: boolean;
  pendingDeployment: boolean;
  deploying: boolean;
  requiresTranslation: boolean;
  eventMetadata: unknown;
};

export type HeatScoreBreakdown = {
  heatScore: number;
  controversyScore: number;
  combinedScore: number;
  components: {
    liquidity: number;
    volume: number;
    news: number;
    controversy: number;
    featureBoost: number;
  };
};

export type NewsReference = {
  sourceName: string;
  articleUrl: string;
  imageOriginalUrl?: string | null;
  cachedImageUrl?: string | null;
  fetchedAt?: string | null;
};

export type ExternalMarketSource = "polymarket" | "cn_entertainment" | "news_report";
export type PriceAnchorMode = "external" | "hybrid" | "local";

export type NormalizedMarketEventCandidate = {
  externalSource: ExternalMarketSource;
  externalEventId: string;
  externalEventSlug: string;
  slug: string;
  title: string;
  brief: string;
  tone: string;
  category: MarketCategory;
  sourceName: string;
  sourceUrl: string;
  canonicalSourceUrl: string;
  externalImageUrl: string | null;
  newsImageUrl: string | null;
  newsImageCachedUrl: string | null;
  newsImageSource: string | null;
  newsReferences: NewsReference[];
  heatScore: number;
  controversyScore: number;
  isFeatured: boolean;
  resolutionSources: Array<{
    label: string;
    href: string;
  }>;
  evidence: string[];
  tags: string[];
  lastSyncedAt: Date;
};

export type NormalizedChildMarketCandidate = {
  externalSource: ExternalMarketSource;
  externalEventId: string;
  externalEventSlug: string;
  externalMarketId: string;
  externalMarketSlug: string;
  answerLabel: string;
  answerOrder: number;
  question: string;
  brief: string;
  tone: string;
  category: MarketCategory;
  status: MarketStatus;
  closesAt: Date;
  resolvesAt: Date;
  liquidity: number;
  yesShares: number;
  noShares: number;
  volumePoints: number;
  activeTraders: number;
  probability: {
    yes: number;
    no: number;
  };
  externalYesProbabilityBps: number | null;
  externalNoProbabilityBps: number | null;
  externalPriceUpdatedAt: Date | null;
  externalPriceStale: boolean;
  priceAnchorMode: PriceAnchorMode;
  clobTokenIds: string[];
  externalImageUrl: string | null;
  lastSyncedAt: Date;
};

export type NormalizedEventBundleCandidate = {
  event: NormalizedMarketEventCandidate;
  childMarkets: NormalizedChildMarketCandidate[];
};

export type NormalizedEventCandidate = {
  externalSource: ExternalMarketSource;
  externalId: string;
  externalSlug: string;
  sourceName: string;
  sourceUrl: string;
  canonicalSourceUrl: string;
  question: string;
  brief: string;
  tone: string;
  category: MarketCategory;
  status: MarketStatus;
  closesAt: Date;
  resolvesAt: Date;
  liquidity: number;
  yesShares: number;
  noShares: number;
  volumePoints: number;
  activeTraders: number;
  probability: {
    yes: number;
    no: number;
  };
  externalYesProbabilityBps: number | null;
  externalNoProbabilityBps: number | null;
  externalPriceUpdatedAt: Date | null;
  externalPriceStale: boolean;
  priceAnchorMode: PriceAnchorMode;
  clobTokenIds: string[];
  externalImageUrl: string | null;
  newsImageUrl: string | null;
  newsImageCachedUrl: string | null;
  newsImageSource: string | null;
  newsReferences: NewsReference[];
  heatScore: number;
  controversyScore: number;
  isFeatured: boolean;
  resolutionSources: Array<{
    label: string;
    href: string;
  }>;
  evidence: string[];
  tags: string[];
  lastSyncedAt: Date;
};

const POLYMARKET_EVENT_URL = "https://polymarket.com/event";
const POLYMARKET_CLOB_URL = "https://clob.polymarket.com";
const POLYMARKET_EVENTS_API_URL = "https://gamma-api.polymarket.com/events";

type FetchEventsVariant = {
  order?: string;
  includeClosed: boolean;
};

const EVENTS_QUERY_VARIANTS: FetchEventsVariant[] = [
  { order: "volume_24hr", includeClosed: true },
  { order: "volume24hr", includeClosed: true },
  { order: "volume_24hr", includeClosed: false },
  { order: "volume24hr", includeClosed: false },
  { order: "volume", includeClosed: false },
  { includeClosed: false },
];

function createEventsQuery(input: {
  limit: number;
  offset: number;
  active?: boolean;
  variant: FetchEventsVariant;
}) {
  const query = new URLSearchParams();
  query.set("limit", String(input.limit));
  query.set("offset", String(input.offset));
  if (input.variant.includeClosed) {
    query.set("closed", "false");
  }
  if (input.variant.order) {
    query.set("order", input.variant.order);
    query.set("ascending", "false");
  }
  if (typeof input.active === "boolean") {
    query.set("active", String(input.active));
  }
  return query;
}

function readEventsPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload as PolymarketEvent[];
  }

  if (typeof payload === "object" && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) {
      return record.data as PolymarketEvent[];
    }
    if (Array.isArray(record.events)) {
      return record.events as PolymarketEvent[];
    }
  }

  throw new Error("Failed to fetch Polymarket events: unexpected payload shape");
}

async function fetchEventsPage(input: { limit: number; offset: number; active?: boolean }) {
  let last422: { query: string; body: string } | null = null;

  for (const variant of EVENTS_QUERY_VARIANTS) {
    const query = createEventsQuery({
      limit: input.limit,
      offset: input.offset,
      active: input.active,
      variant,
    });
    const url = `${POLYMARKET_EVENTS_API_URL}?${query.toString()}`;
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as unknown;
      return readEventsPayload(payload);
    }

    const body = (await response.text()).trim();
    if (response.status === 422) {
      last422 = { query: query.toString(), body };
      continue;
    }

    const error = new Error(
      `Failed to fetch Polymarket events: ${response.status}${body ? ` (${body.slice(0, 240)})` : ""}`,
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const error = new Error(
    `Failed to fetch Polymarket events: 422${
      last422 ? ` (query=${last422.query}${last422.body ? `; body=${last422.body.slice(0, 240)}` : ""})` : ""
    }`,
  ) as Error & { status?: number };
  error.status = 422;
  throw error;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseJsonArray(value: string | Array<string | number> | null | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeOutcomeLabel(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getBinaryMarkets(event: PolymarketEvent) {
  return event.markets.filter((market) => {
    const outcomes = parseJsonArray(market.outcomes).map(normalizeOutcomeLabel);
    return outcomes.length === 2 && outcomes[0] === "yes" && outcomes[1] === "no";
  });
}

function mapCategory(category: string | null | undefined): MarketCategory {
  switch ((category ?? "").trim().toLowerCase()) {
    case "crypto":
    case "finance":
      return "finance";
    case "tech":
    case "technology":
      return "technology";
    default:
      return "current_affairs";
  }
}

function mapStatus(event: PolymarketEvent, market: PolymarketMarket): MarketStatus {
  const closeDate = new Date(market.endDate ?? event.endDate ?? 0);
  const now = Date.now();
  const isPastClose = Number.isFinite(closeDate.getTime()) && closeDate.getTime() <= now;

  if (event.closed || market.closed || isPastClose) {
    return "locked";
  }

  if (event.active && market.active) {
    return "live";
  }

  return "review";
}

function normalizeClobTokenIds(value: string | string[] | null | undefined) {
  return parseJsonArray(value)
    .map((item) => String(item).trim())
    .filter(Boolean);
}

export function normalizeExternalProbability(input: {
  gammaOutcomePrices?: Array<string | number> | string | null;
  midpointPrice?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  lastTradePrice?: number | null;
}) {
  const spread =
    typeof input.bestBid === "number" && typeof input.bestAsk === "number"
      ? input.bestAsk - input.bestBid
      : null;
  const canUseMidpoint =
    typeof input.midpointPrice === "number" &&
    Number.isFinite(input.midpointPrice) &&
    (spread === null || spread <= 0.1);
  const anchoredYes =
    canUseMidpoint && typeof input.midpointPrice === "number"
      ? input.midpointPrice
      : typeof input.lastTradePrice === "number" && Number.isFinite(input.lastTradePrice)
        ? input.lastTradePrice
        : parseJsonArray(input.gammaOutcomePrices).map((value) => normalizeNumber(value))[0] ?? 0.5;
  const yes = clamp(anchoredYes, 0.01, 0.99);
  const gammaNo = parseJsonArray(input.gammaOutcomePrices).map((value) => normalizeNumber(value))[1];
  const no = clamp(gammaNo && !canUseMidpoint && input.lastTradePrice == null ? gammaNo : 1 - yes, 0.01, 0.99);
  const total = yes + no;

  return {
    yes: yes / total,
    no: no / total,
  };
}

export type ClobTokenPrice = {
  tokenId: string;
  yesProbability: number;
  stale: boolean;
};

async function fetchClobJson(path: string) {
  const response = await fetch(`${POLYMARKET_CLOB_URL}${path}`, {
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<unknown>;
}

function readNumericField(value: unknown, field: string) {
  if (typeof value !== "object" || value === null || !(field in value)) {
    return null;
  }

  const raw = (value as Record<string, unknown>)[field];
  const parsed = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchClobTokenPrice(
  tokenId: string,
  gammaOutcomePrices?: Array<string | number> | string | null,
): Promise<ClobTokenPrice> {
  const [midpointPayload, spreadPayload, lastTradePayload] = await Promise.all([
    fetchClobJson(`/midpoint?token_id=${encodeURIComponent(tokenId)}`),
    fetchClobJson(`/spread?token_id=${encodeURIComponent(tokenId)}`),
    fetchClobJson(`/last-trade-price?token_id=${encodeURIComponent(tokenId)}`),
  ]);
  const midpointPrice = readNumericField(midpointPayload, "mid");
  const spread = readNumericField(spreadPayload, "spread");
  const lastTradePrice = readNumericField(lastTradePayload, "price");
  const probability = normalizeExternalProbability({
    gammaOutcomePrices,
    midpointPrice,
    bestBid: spread !== null && midpointPrice !== null ? midpointPrice - spread / 2 : null,
    bestAsk: spread !== null && midpointPrice !== null ? midpointPrice + spread / 2 : null,
    lastTradePrice,
  });

  return {
    tokenId,
    yesProbability: probability.yes,
    stale: midpointPrice === null && lastTradePrice === null,
  };
}

export function buildAnchoredLmsrState(input: { yesProbability: number; liquidity: number }) {
  const probabilityYes = clamp(input.yesProbability, 0.01, 0.99);
  const shift = Math.round(input.liquidity * Math.log(probabilityYes / (1 - probabilityYes)));
  const yesShares = Math.max(0, shift);
  const noShares = Math.max(0, -shift);

  return { liquidity: input.liquidity, yesShares, noShares };
}

function buildChineseBrief(event: PolymarketEvent, market: PolymarketMarket, category: MarketCategory) {
  const source = event.description?.trim() || market.description?.trim() || "围绕同一时间边界下的概率分歧进行持续观察。";
  const topicLabel =
    category === "finance" ? "宏观与资产定价" : category === "technology" ? "科技变量" : "公共议题";

  return `${topicLabel}事件。${source}`;
}

function buildEvidence(event: PolymarketEvent, market: PolymarketMarket) {
  const evidence = [
    "观察外部母池的实时概率与活跃度变化。",
    event.resolutionSource || market.resolutionSource || "关注官方来源与权威媒体更新。",
  ];

  return evidence.filter(Boolean);
}

export function filterBinaryPolymarketEvents(events: PolymarketEvent[]) {
  const minCloseTime = Date.now() + 3 * 60 * 60 * 1000;

  return events.filter((event) => {
    const binaryMarkets = getBinaryMarkets(event).filter((market) => {
      const closeDate = new Date(market.endDate ?? event.endDate ?? 0);
      return (
        market.active &&
        !market.closed &&
        !market.archived &&
        Number.isFinite(closeDate.getTime()) &&
        closeDate.getTime() > minCloseTime
      );
    });

    return Boolean(
      binaryMarkets.length > 0 &&
        event.active &&
        !event.closed &&
        !event.archived
    );
  });
}

export function buildHeatScoreBreakdown(input: {
  probabilityYes: number;
  liquidity: number;
  volume24hr: number;
  volume1wk: number;
  newsMatchCount: number;
  conflictSignalCount: number;
  crossSourceDivergence: number;
  featured: boolean;
}): HeatScoreBreakdown {
  const closenessToFifty = 1 - Math.min(1, Math.abs(input.probabilityYes - 0.5) / 0.5);
  const liquidityScore = clamp(Math.round(Math.log10(Math.max(input.liquidity, 10)) * 14), 0, 30);
  const volumeScore = clamp(
    Math.round(Math.log10(Math.max(input.volume24hr + input.volume1wk * 0.35, 10)) * 16),
    0,
    34,
  );
  const newsScore = clamp(input.newsMatchCount * 5, 0, 15);
  const controversySignal = clamp(
    Math.round(closenessToFifty * 40 + input.conflictSignalCount * 8 + input.crossSourceDivergence * 24),
    0,
    70,
  );
  const featureBoost = input.featured ? 12 : 0;

  const heatScore = clamp(liquidityScore + volumeScore + newsScore + featureBoost, 0, 100);
  const controversyScore = clamp(controversySignal + Math.round(newsScore * 0.4), 0, 100);
  const combinedScore = clamp(Math.round(heatScore * 0.55 + controversyScore * 0.45 + featureBoost * 0.35), 0, 100);

  return {
    heatScore,
    controversyScore,
    combinedScore,
    components: {
      liquidity: liquidityScore,
      volume: volumeScore,
      news: newsScore,
      controversy: controversySignal,
      featureBoost,
    },
  };
}

function formatAnswerLabel(value: Date, fallbackOrder: number) {
  if (!Number.isFinite(value.getTime())) {
    return `选项 ${fallbackOrder}`;
  }

  const month = value.getUTCMonth() + 1;
  const day = value.getUTCDate();
  return `${month}月${day}日`;
}

export function normalizePolymarketEvent(event: PolymarketEvent): NormalizedEventBundleCandidate {
  const binaryMarkets = getBinaryMarkets(event);

  if (binaryMarkets.length === 0) {
    throw new Error(`Event ${event.slug} is not a binary Yes/No market.`);
  }
  const category = mapCategory(binaryMarkets[0]?.category ?? event.category);
  const scores = buildHeatScoreBreakdown({
    probabilityYes: normalizeExternalProbability({
      gammaOutcomePrices: binaryMarkets[0]?.outcomePrices,
    }).yes,
    liquidity: Math.max(
      100,
      Math.round(
        normalizeNumber(event.liquidity) ||
          normalizeNumber(binaryMarkets[0]?.liquidity) ||
          normalizeNumber(event.openInterest),
      ),
    ),
    volume24hr: event.volume24hr ?? binaryMarkets[0]?.volume24hr ?? 0,
    volume1wk: event.volume1wk ?? binaryMarkets[0]?.volume1wk ?? 0,
    newsMatchCount: 0,
    conflictSignalCount: 0,
    crossSourceDivergence: 0,
    featured: Boolean(event.featured || binaryMarkets.some((market) => market.featured)),
  });
  const canonicalSourceUrl = `${POLYMARKET_EVENT_URL}/${event.slug}`;
  const childMarkets = binaryMarkets.map((market, index) => {
    const probability = normalizeExternalProbability({
      gammaOutcomePrices: market.outcomePrices,
    });
    const liquidity = Math.max(
      100,
      Math.round(
        normalizeNumber(market.liquidity) ||
          normalizeNumber(event.liquidity) ||
          normalizeNumber(event.openInterest),
      ),
    );
    const closesAt = new Date(market.endDate ?? event.endDate ?? event.createdAt ?? Date.now());
    const resolvesAt = new Date(event.endDate ?? market.endDate ?? closesAt);
    const { yesShares, noShares } = buildAnchoredLmsrState({
      yesProbability: probability.yes,
      liquidity,
    });

    return {
      externalSource: "polymarket",
      externalEventId: event.id,
      externalEventSlug: event.slug,
      externalMarketId: market.id,
      externalMarketSlug: market.slug,
      answerLabel: formatAnswerLabel(closesAt, index + 1),
      answerOrder: index + 1,
      question: market.question?.trim() || event.title.trim(),
      brief: buildChineseBrief(event, market, category),
      tone: "外部热点母池同步事件，采用中文摘要承接，保留时间边界与结算线索。",
      category,
      status: mapStatus(event, market),
      closesAt,
      resolvesAt,
      liquidity,
      yesShares,
      noShares,
      volumePoints: scaleDownPositivePoints(
        normalizeNumber(market.volume) || normalizeNumber(event.volume),
      ),
      activeTraders: Math.max(
        1,
        Math.round((event.commentCount ?? 0) + (market.openInterest ?? event.openInterest ?? 0) / 50),
      ),
      probability,
      externalYesProbabilityBps: Math.round(probability.yes * 10000),
      externalNoProbabilityBps: Math.round(probability.no * 10000),
      externalPriceUpdatedAt: new Date(),
      externalPriceStale: false,
      priceAnchorMode: "external",
      clobTokenIds: normalizeClobTokenIds(market.clobTokenIds),
      externalImageUrl: market.image ?? event.image ?? null,
      lastSyncedAt: new Date(),
    } satisfies NormalizedChildMarketCandidate;
  });

  return {
    event: {
      externalSource: "polymarket",
      externalEventId: event.id,
      externalEventSlug: event.slug,
      slug: event.slug,
      title: event.title.trim(),
      brief: buildChineseBrief(event, binaryMarkets[0], category),
      tone: "外部热点母池同步事件，采用中文摘要承接，保留时间边界与结算线索。",
      category,
      sourceName: "Polymarket",
      sourceUrl: canonicalSourceUrl,
      canonicalSourceUrl,
      externalImageUrl: event.image ?? binaryMarkets[0]?.image ?? null,
      newsImageUrl: null,
      newsImageCachedUrl: null,
      newsImageSource: null,
      newsReferences: [],
      heatScore: scores.heatScore,
      controversyScore: scores.controversyScore,
      isFeatured: Boolean(event.featured || binaryMarkets.some((market) => market.featured)),
      resolutionSources: [
        {
          label: "Polymarket 事件页",
          href: canonicalSourceUrl,
        },
        ...(event.resolutionSource || binaryMarkets[0]?.resolutionSource
          ? [
              {
                label: "原始结算来源",
                href: String(event.resolutionSource ?? binaryMarkets[0]?.resolutionSource),
              },
            ]
          : []),
      ],
      evidence: buildEvidence(event, binaryMarkets[0]),
      tags: event.tags.map((tag) => tag.label),
      lastSyncedAt: new Date(),
    },
    childMarkets,
  };
}

export async function fetchPolymarketEvents(options: { limit?: number; active?: boolean; allowFallback?: boolean } = {}) {
  const targetLimit = options.limit ?? 100;
  const pageSize = Math.min(100, targetLimit);

  try {
    const events: PolymarketEvent[] = [];

    for (let offset = 0; offset < targetLimit; offset += pageSize) {
      let page: PolymarketEvent[];
      try {
        page = await fetchEventsPage({
          limit: Math.min(pageSize, targetLimit - offset),
          offset,
          active: options.active,
        });
      } catch (error) {
        const status = typeof error === "object" && error !== null ? (error as { status?: number }).status : undefined;
        if (offset > 0 && status === 422) {
          break;
        }
        throw error;
      }
      events.push(...page);

      if (page.length < pageSize) {
        break;
      }
    }

    return events;
  } catch (error) {
    if (process.env.NODE_ENV === "production" || options.allowFallback === false) {
      throw error;
    }
    console.warn("Falling back to bundled Polymarket snapshot.", error);
    return POLYMARKET_FALLBACK_EVENTS.slice(0, options.limit ?? POLYMARKET_FALLBACK_EVENTS.length);
  }
}
