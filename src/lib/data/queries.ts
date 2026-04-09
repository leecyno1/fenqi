import { and, count, desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { HOMEPAGE_EXTERNAL_CATALOG_MAX_AGE_MINUTES } from "@/config/content-governance";
import {
  marketEvents,
  markets,
  positions,
  priceSnapshots,
  resolutions,
  trades,
  users,
  virtualWallets,
} from "@/db/schema";
import { buildMarketDeleteGuard } from "@/lib/admin/market-delete";
import {
  buildHomeMarketSections,
  buildHomeEventSections,
  buildAdminSettlementListItem,
  buildAdminMarketListItem,
  buildEventDetailView,
  buildEventListItem,
  buildMarketDetailView,
  buildMarketListItem,
  buildPortfolioView,
  getDisplayProbability,
  type EventDetailView,
  type EventListItem,
  type HomeEventSection,
  type HomeMarketSection,
  type AdminSettlementListItem,
  type AdminMarketListItem,
  type LeaderboardEntryView,
  type MarketDetailView,
  type MarketListItem,
  type PortfolioView,
} from "@/lib/data/views";
import { buildVirtualMarketHistory } from "@/lib/data/virtual-history";
import { listLatestTrackedJobRuns } from "@/lib/jobs";
import {
  createMarketState,
  getMarketProbabilities,
  quoteBuyOrder,
  quoteSellOrder,
  settlePortfolioPayout,
  type MarketSide,
} from "@/lib/markets/lmsr";
import { scaleDownPositivePoints } from "@/lib/points";
import { reducePositionOnSell } from "@/lib/trading/position-accounting";

export type TradeAction = "buy" | "sell";

export type TradeQuoteView = {
  action: TradeAction;
  side: MarketSide;
  shareCount: number;
  amount: number;
  averagePrice: number;
};

export type PriceHistoryPoint = {
  timestamp: Date;
  yesProbability: number;
  noProbability: number;
};

export type PriceHistoryPeriod = "24h" | "7d" | "30d" | "all";

type ResolutionSource = {
  label: string;
  href: string;
};

function asEvidence(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function asResolutionSources(value: unknown): ResolutionSource[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is ResolutionSource =>
        typeof item === "object" &&
        item !== null &&
        "label" in item &&
        "href" in item &&
        typeof item.label === "string" &&
        typeof item.href === "string",
    )
    .map((item) => ({
      label: item.label,
      href: item.href,
    }));
}

type EventMarketRow = {
  eventId: string;
  eventSlug: string;
  eventCreatedAt: Date;
  eventImage: string | null;
  eventExternalImageUrl: string | null;
  eventNewsImageCachedUrl: string | null;
  eventNewsImageUrl: string | null;
  eventSourceName: string | null;
  eventSourceUrl: string | null;
  eventNewsImageSource: string | null;
  eventNewsReferences: unknown;
  eventExternalSource: string | null;
  eventHeatScore: number;
  eventControversyScore: number;
  eventIsFeatured: boolean;
  eventTitle: string;
  eventBrief: string;
  eventTone: string;
  eventCategory: "current_affairs" | "technology" | "finance";
  eventEvidence: unknown;
  eventResolutionSources: unknown;
  marketId: string;
  marketSlug: string;
  marketQuestion: string;
  marketBrief: string;
  marketStatus: "draft" | "review" | "live" | "locked" | "resolved" | "voided";
  marketClosesAt: Date;
  marketResolvesAt: Date;
  marketLiquidity: number;
  marketYesShares: number;
  marketNoShares: number;
  marketVolumePoints: number;
  marketActiveTraders: number;
  answerLabel: string;
  answerOrder: number;
  marketExternalSource: string | null;
  externalYesProbabilityBps: number | null;
  externalNoProbabilityBps: number | null;
  externalPriceUpdatedAt: Date | null;
  externalPriceStale: boolean;
  priceAnchorMode: "external" | "hybrid" | "local";
  resolutionOutcome: "YES" | "NO" | "VOID" | null;
  resolutionSourceLabel: string | null;
  resolutionSourceUrl: string | null;
  resolutionRationale: string | null;
  resolutionResolvedAt: Date | null;
};

function asNewsReferences(value: unknown): NonNullable<EventDetailView["newsReferences"]> {
  return Array.isArray(value)
    ? value.filter(
        (item): item is NonNullable<EventDetailView["newsReferences"]>[number] =>
          typeof item === "object" &&
          item !== null &&
          "sourceName" in item &&
          "articleUrl" in item &&
          typeof item.sourceName === "string" &&
          typeof item.articleUrl === "string",
      )
    : [];
}

function buildEventItemsFromRows(rows: EventMarketRow[]) {
  const grouped = new Map<
    string,
    {
      event: Omit<Parameters<typeof buildEventListItem>[0], "childMarkets">;
      childMarkets: Parameters<typeof buildEventListItem>[0]["childMarkets"];
    }
  >();

  for (const row of rows) {
    const group =
      grouped.get(row.eventId) ??
      (() => {
        const next = {
          event: {
            id: row.eventId,
            slug: row.eventSlug,
            createdAt: row.eventCreatedAt,
            image: row.eventImage,
            externalImageUrl: row.eventExternalImageUrl,
            newsImageCachedUrl: row.eventNewsImageCachedUrl,
            newsImageUrl: row.eventNewsImageUrl,
            sourceName: row.eventSourceName,
            sourceUrl: row.eventSourceUrl,
            newsImageSource: row.eventNewsImageSource,
            externalSource: row.eventExternalSource,
            heatScore: row.eventHeatScore,
            controversyScore: row.eventControversyScore,
            isFeatured: row.eventIsFeatured,
            title: row.eventTitle,
            brief: row.eventBrief,
            category: row.eventCategory,
          },
          childMarkets: [] as Parameters<typeof buildEventListItem>[0]["childMarkets"],
        };
        grouped.set(row.eventId, next);
        return next;
      })();

    group.childMarkets.push({
      id: row.marketId,
      slug: row.marketSlug,
      question: row.marketQuestion,
      brief: row.marketBrief,
      answerLabel: row.answerLabel,
      answerOrder: row.answerOrder,
      category: row.eventCategory,
      status: row.marketStatus,
      closesAt: row.marketClosesAt,
      resolvesAt: row.marketResolvesAt,
      liquidity: row.marketLiquidity,
      yesShares: row.marketYesShares,
      noShares: row.marketNoShares,
      volumePoints: row.marketVolumePoints,
      activeTraders: row.marketActiveTraders,
      externalSource: row.marketExternalSource,
      externalYesProbabilityBps: row.externalYesProbabilityBps,
      externalNoProbabilityBps: row.externalNoProbabilityBps,
      externalPriceUpdatedAt: row.externalPriceUpdatedAt,
      externalPriceStale: row.externalPriceStale,
      priceAnchorMode: row.priceAnchorMode,
      resolution:
        row.resolutionOutcome && row.resolutionSourceLabel && row.resolutionSourceUrl && row.resolutionResolvedAt
          ? {
              outcome: row.resolutionOutcome,
              sourceLabel: row.resolutionSourceLabel,
              sourceUrl: row.resolutionSourceUrl,
              rationale: row.resolutionRationale,
              resolvedAt: row.resolutionResolvedAt,
            }
          : null,
    });
  }

  return [...grouped.values()];
}

function buildMarketProbability(side: MarketSide, market: {
  liquidity: number;
  yesShares: number;
  noShares: number;
  externalYesProbabilityBps?: number | null;
  externalNoProbabilityBps?: number | null;
  priceAnchorMode?: "external" | "hybrid" | "local" | null;
}) {
  const localProbability = getMarketProbabilities(
    createMarketState({
      liquidity: market.liquidity,
      yesShares: market.yesShares,
      noShares: market.noShares,
    }),
  );
  const probabilities = getDisplayProbability({
    localProbability,
    externalYesProbabilityBps: market.externalYesProbabilityBps,
    externalNoProbabilityBps: market.externalNoProbabilityBps,
    priceAnchorMode: market.priceAnchorMode,
  });

  return side === "YES" ? probabilities.yes : probabilities.no;
}

export async function getMarketListItems(): Promise<MarketListItem[]> {
  const rows = await db
    .select({
      id: markets.id,
      slug: markets.slug,
      createdAt: markets.createdAt,
      image: markets.image,
      externalImageUrl: markets.externalImageUrl,
      newsImageCachedUrl: markets.newsImageCachedUrl,
      newsImageUrl: markets.newsImageUrl,
      sourceName: markets.sourceName,
      sourceUrl: markets.sourceUrl,
      externalSource: markets.externalSource,
      newsImageSource: markets.newsImageSource,
      heatScore: markets.heatScore,
      controversyScore: markets.controversyScore,
      isFeatured: markets.isFeatured,
      externalYesProbabilityBps: markets.externalYesProbabilityBps,
      externalNoProbabilityBps: markets.externalNoProbabilityBps,
      externalPriceUpdatedAt: markets.externalPriceUpdatedAt,
      externalPriceStale: markets.externalPriceStale,
      priceAnchorMode: markets.priceAnchorMode,
      question: markets.question,
      brief: markets.brief,
      category: markets.category,
      status: markets.status,
      closesAt: markets.closesAt,
      resolvesAt: markets.resolvesAt,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      volumePoints: markets.volumePoints,
      activeTraders: markets.activeTraders,
    })
    .from(markets)
    .where(inArray(markets.status, ["live", "review", "locked", "resolved", "voided"]))
    .orderBy(desc(markets.isFeatured), desc(markets.heatScore), desc(markets.controversyScore), desc(markets.volumePoints));

  return rows.map((row) => buildMarketListItem(row));
}

export async function getHomeMarketSections(): Promise<HomeMarketSection[]> {
  const markets = await getMarketListItems();
  return buildHomeMarketSections(markets);
}

async function getEventMarketRowsByFilter(where?: ReturnType<typeof and>) {
  return db
    .select({
      eventId: marketEvents.id,
      eventSlug: marketEvents.slug,
      eventCreatedAt: marketEvents.createdAt,
      eventImage: marketEvents.image,
      eventExternalImageUrl: marketEvents.externalImageUrl,
      eventNewsImageCachedUrl: marketEvents.newsImageCachedUrl,
      eventNewsImageUrl: marketEvents.newsImageUrl,
      eventSourceName: marketEvents.sourceName,
      eventSourceUrl: marketEvents.sourceUrl,
      eventNewsImageSource: marketEvents.newsImageSource,
      eventNewsReferences: marketEvents.newsReferences,
      eventExternalSource: marketEvents.externalSource,
      eventHeatScore: marketEvents.heatScore,
      eventControversyScore: marketEvents.controversyScore,
      eventIsFeatured: marketEvents.isFeatured,
      eventTitle: marketEvents.title,
      eventBrief: marketEvents.brief,
      eventTone: marketEvents.tone,
      eventCategory: marketEvents.category,
      eventEvidence: marketEvents.evidence,
      eventResolutionSources: marketEvents.resolutionSources,
      marketId: markets.id,
      marketSlug: markets.slug,
      marketQuestion: markets.question,
      marketBrief: markets.brief,
      marketStatus: markets.status,
      marketClosesAt: markets.closesAt,
      marketResolvesAt: markets.resolvesAt,
      marketLiquidity: markets.liquidity,
      marketYesShares: markets.yesShares,
      marketNoShares: markets.noShares,
      marketVolumePoints: markets.volumePoints,
      marketActiveTraders: markets.activeTraders,
      answerLabel: markets.answerLabel,
      answerOrder: markets.answerOrder,
      marketExternalSource: markets.externalSource,
      externalYesProbabilityBps: markets.externalYesProbabilityBps,
      externalNoProbabilityBps: markets.externalNoProbabilityBps,
      externalPriceUpdatedAt: markets.externalPriceUpdatedAt,
      externalPriceStale: markets.externalPriceStale,
      priceAnchorMode: markets.priceAnchorMode,
      resolutionOutcome: resolutions.outcome,
      resolutionSourceLabel: resolutions.sourceLabel,
      resolutionSourceUrl: resolutions.sourceUrl,
      resolutionRationale: resolutions.rationale,
      resolutionResolvedAt: resolutions.resolvedAt,
    })
    .from(marketEvents)
    .innerJoin(markets, eq(markets.eventId, marketEvents.id))
    .leftJoin(resolutions, eq(resolutions.marketId, markets.id))
    .where(where)
    .orderBy(
      desc(marketEvents.isFeatured),
      desc(marketEvents.heatScore),
      desc(marketEvents.controversyScore),
      desc(markets.volumePoints),
      markets.answerOrder,
    );
}

export async function getEventListItems(): Promise<EventListItem[]> {
  const rows = await getEventMarketRowsByFilter(
    inArray(markets.status, ["live", "review", "locked", "resolved", "voided"]),
  );

  return buildEventItemsFromRows(rows).map(({ event, childMarkets }) =>
    buildEventListItem({
      ...event,
      childMarkets,
    }),
  );
}

function filterEventsForHomepage(
  events: EventListItem[],
) {
  return events.filter((event) => event.homepageEligible);
}

export async function getHomeEventSections(): Promise<HomeEventSection[]> {
  const events = await getEventListItems();
  const homepageEvents = filterEventsForHomepage(events);

  return buildHomeEventSections(homepageEvents);
}

export async function getHomepageGovernanceSummary(now = new Date()) {
  const [events, jobRuns] = await Promise.all([
    getEventListItems(),
    listLatestTrackedJobRuns(),
  ]);
  const homepageEvents = filterEventsForHomepage(events);
  const latestSuccessfulRuns = new Map<string, Date>();

  for (const run of jobRuns) {
    if (run.status === "success" && run.finishedAt && !latestSuccessfulRuns.has(run.jobName)) {
      latestSuccessfulRuns.set(run.jobName, run.finishedAt);
    }
  }

  const staleExternalCount = events.filter(
    (event) =>
      event.contentOrigin === "external_live" &&
      event.freshnessStatus !== "fresh",
  ).length;
  const missingCatalogCount = events.filter(
    (event) =>
      event.contentOrigin === "external_live" &&
      (!event.lastUpdatedAt ||
        (now.getTime() - event.lastUpdatedAt.getTime()) / 60_000 >
          HOMEPAGE_EXTERNAL_CATALOG_MAX_AGE_MINUTES),
  ).length;

  return {
    eligibleCount: homepageEvents.length,
    staleExternalCount,
    missingCatalogCount,
    lastCatalogSuccessAt: latestSuccessfulRuns.get("sync-polymarket-catalog") ?? null,
    lastPriceSuccessAt: latestSuccessfulRuns.get("sync-polymarket-prices") ?? null,
  };
}

export async function getMarketDetailViewBySlug(
  slug: string,
): Promise<MarketDetailView | null> {
  const [row] = await db
    .select({
      id: markets.id,
      eventId: markets.eventId,
      slug: markets.slug,
      createdAt: markets.createdAt,
      image: markets.image,
      externalImageUrl: markets.externalImageUrl,
      newsImageCachedUrl: markets.newsImageCachedUrl,
      newsImageUrl: markets.newsImageUrl,
      sourceName: markets.sourceName,
      sourceUrl: markets.sourceUrl,
      externalSource: markets.externalSource,
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
      question: markets.question,
      brief: markets.brief,
      category: markets.category,
      status: markets.status,
      closesAt: markets.closesAt,
      resolvesAt: markets.resolvesAt,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      volumePoints: markets.volumePoints,
      activeTraders: markets.activeTraders,
      tone: markets.tone,
      evidence: markets.evidence,
      resolutionSources: markets.resolutionSources,
      eventSlug: marketEvents.slug,
      eventTitle: marketEvents.title,
    })
    .from(markets)
    .innerJoin(marketEvents, eq(marketEvents.id, markets.eventId))
    .where(eq(markets.slug, slug))
    .limit(1);

  if (!row) {
    return null;
  }

  const [resolution] = await db
    .select({
      outcome: resolutions.outcome,
      sourceLabel: resolutions.sourceLabel,
      sourceUrl: resolutions.sourceUrl,
      rationale: resolutions.rationale,
      resolvedAt: resolutions.resolvedAt,
    })
    .from(resolutions)
    .where(eq(resolutions.marketId, row.id))
    .limit(1);

  const [{ childCount }] = await db
    .select({ childCount: count() })
    .from(markets)
    .where(eq(markets.eventId, row.eventId));

  return buildMarketDetailView({
    ...row,
    evidence: asEvidence(row.evidence),
    newsReferences: Array.isArray(row.newsReferences)
      ? row.newsReferences.filter(
          (item): item is NonNullable<MarketDetailView["newsReferences"]>[number] =>
            typeof item === "object" &&
            item !== null &&
            "sourceName" in item &&
            "articleUrl" in item &&
            typeof item.sourceName === "string" &&
            typeof item.articleUrl === "string",
        )
      : [],
    resolutionSource: asResolutionSources(row.resolutionSources),
    resolution: resolution ?? null,
    parentEvent:
      row.eventSlug && row.eventTitle
        ? {
            slug: row.eventSlug,
            title: row.eventTitle,
            childCount,
          }
        : null,
  });
}

export async function getEventDetailViewBySlug(
  slug: string,
  userId?: string,
  selectedChildSlug?: string,
): Promise<EventDetailView | null> {
  const rows = await getEventMarketRowsByFilter(eq(marketEvents.slug, slug));

  if (rows.length === 0) {
    return null;
  }

  const [{ event, childMarkets }] = buildEventItemsFromRows(rows);
  if (!event) {
    return null;
  }

  const eventId = rows[0]?.eventId;
  const positionRows =
    userId && eventId
      ? await db
          .select({
            marketSlug: markets.slug,
            side: positions.side,
            shareCount: positions.shareCount,
          })
          .from(positions)
          .innerJoin(markets, eq(markets.id, positions.marketId))
          .where(and(eq(positions.userId, userId), eq(markets.eventId, eventId)))
      : [];

  const byMarketSlug = positionRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.marketSlug] = (acc[row.marketSlug] ?? 0) + row.shareCount;
    return acc;
  }, {});
  const positionsByMarketSlug = positionRows.reduce<Record<string, { YES: number; NO: number }>>(
    (acc, row) => {
      const current = acc[row.marketSlug] ?? { YES: 0, NO: 0 };
      current[row.side] = row.shareCount;
      acc[row.marketSlug] = current;
      return acc;
    },
    {},
  );
  const fallbackSelectedChildSlug = childMarkets
    .slice()
    .sort((left, right) => right.volumePoints - left.volumePoints || left.answerOrder - right.answerOrder)[0]?.slug;
  const resolvedSelectedChildSlug = selectedChildSlug ?? fallbackSelectedChildSlug ?? childMarkets[0]?.slug;

  return buildEventDetailView({
    ...event,
    childMarkets,
    selectedChildSlug: resolvedSelectedChildSlug,
    tone: rows[0]?.eventTone ?? "",
    evidence: asEvidence(rows[0]?.eventEvidence),
    newsReferences: asNewsReferences(rows[0]?.eventNewsReferences),
    resolutionSource: asResolutionSources(rows[0]?.eventResolutionSources),
    resolution: null,
    holdings: {
      totalShares: positionRows.reduce((sum, row) => sum + row.shareCount, 0),
      selectedShares: resolvedSelectedChildSlug ? byMarketSlug[resolvedSelectedChildSlug] ?? 0 : 0,
      byMarketSlug,
      positionsByMarketSlug,
    },
  });
}

export async function getPortfolioView(userId: string): Promise<PortfolioView | null> {
  const [wallet] = await db
    .select({
      userName: users.name,
      balance: virtualWallets.balance,
      lifetimePnL: virtualWallets.lifetimePnL,
    })
    .from(virtualWallets)
    .innerJoin(users, eq(users.id, virtualWallets.userId))
    .where(eq(virtualWallets.userId, userId))
    .limit(1);

  if (!wallet) {
    return null;
  }

  const holdingRows = await db
    .select({
      marketSlug: markets.slug,
      marketQuestion: markets.question,
      side: positions.side,
      shareCount: positions.shareCount,
      totalCost: positions.totalCost,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      externalYesProbabilityBps: markets.externalYesProbabilityBps,
      externalNoProbabilityBps: markets.externalNoProbabilityBps,
      priceAnchorMode: markets.priceAnchorMode,
    })
    .from(positions)
    .innerJoin(markets, eq(markets.id, positions.marketId))
    .where(eq(positions.userId, userId));

  const tradeRows = await db
    .select({
      marketId: trades.marketId,
      side: trades.side,
      action: trades.action,
      shareCount: trades.shareCount,
      totalCost: trades.totalCost,
      outcome: resolutions.outcome,
    })
    .from(trades)
    .leftJoin(resolutions, eq(resolutions.marketId, trades.marketId))
    .where(eq(trades.userId, userId))
    .orderBy(trades.executedAt);

  const costBasisByMarketSide = new Map<string, { shareCount: number; totalCost: number }>();
  const resolvedOutcomes = new Map<string, "YES" | "NO" | "VOID">();
  let realizedPnl = 0;

  for (const trade of tradeRows) {
    const key = `${trade.marketId}:${trade.side}`;
    const current = costBasisByMarketSide.get(key) ?? {
      shareCount: 0,
      totalCost: 0,
    };

    if (trade.action === "buy") {
      costBasisByMarketSide.set(key, {
        shareCount: current.shareCount + trade.shareCount,
        totalCost: current.totalCost + trade.totalCost,
      });
    } else {
      const reduction = reducePositionOnSell(current, {
        sellShareCount: trade.shareCount,
        proceeds: trade.totalCost,
      });

      realizedPnl += reduction.realizedPnl;
      costBasisByMarketSide.set(key, reduction.remaining);
    }

    if (trade.outcome) {
      resolvedOutcomes.set(trade.marketId, trade.outcome);
    }
  }

  let settledPnl = 0;
  for (const [marketId, outcome] of resolvedOutcomes.entries()) {
    const marketPositions = (["YES", "NO"] as const)
      .map((side) => costBasisByMarketSide.get(`${marketId}:${side}`))
      .map((position, index) =>
        position && position.shareCount > 0
          ? {
              side: index === 0 ? "YES" : "NO",
              shareCount: position.shareCount,
              totalCost: position.totalCost,
            }
          : null,
      )
      .filter((position): position is { side: "YES" | "NO"; shareCount: number; totalCost: number } => Boolean(position));

    if (marketPositions.length > 0) {
      settledPnl += settlePortfolioPayout(marketPositions, outcome).netPayout;
    }
  }

  return buildPortfolioView({
    wallet,
    holdings: holdingRows.map((row) => ({
      marketSlug: row.marketSlug,
      marketQuestion: row.marketQuestion,
      side: row.side,
      shareCount: row.shareCount,
      totalCost: row.totalCost,
      currentProbability: buildMarketProbability(row.side, row),
    })),
    realizedPnl,
    settledPnl,
  });
}

export async function getLeaderboardEntries(): Promise<LeaderboardEntryView[]> {
  const rows = await db
    .select({
      name: users.name,
      score: virtualWallets.balance,
      lifetimePnL: virtualWallets.lifetimePnL,
    })
    .from(virtualWallets)
    .innerJoin(users, eq(users.id, virtualWallets.userId))
    .orderBy(desc(virtualWallets.balance))
    .limit(10);

  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.name,
    title: index === 0 ? "当前净值领先" : "活跃参与者",
    score: row.score,
    hitRate: 0.5,
    monthlyGain: row.lifetimePnL,
  }));
}

export async function getAdminMarketListItems(): Promise<AdminMarketListItem[]> {
  const rows = await db
    .select({
      id: markets.id,
      slug: markets.slug,
      question: markets.question,
      category: markets.category,
      status: markets.status,
      closesAt: markets.closesAt,
      volumePoints: markets.volumePoints,
    })
    .from(markets)
    .orderBy(desc(markets.createdAt));

  return rows.map((row) => buildAdminMarketListItem(row));
}

export async function getAdminSettlementListItems(): Promise<AdminSettlementListItem[]> {
  const rows = await db
    .select({
      id: markets.id,
      slug: markets.slug,
      question: markets.question,
      status: markets.status,
      closesAt: markets.closesAt,
      resolvesAt: markets.resolvesAt,
    })
    .from(markets)
    .where(inArray(markets.status, ["live", "locked"]))
    .orderBy(markets.resolvesAt);

  const positionRows = await db
    .select({
      marketId: positions.marketId,
      openPositionCount: count(),
      openShareCount: sql<number>`coalesce(sum(${positions.shareCount}), 0)`,
    })
    .from(positions)
    .groupBy(positions.marketId);

  const counts = new Map(
    positionRows.map((row) => [
      row.marketId,
      {
        openPositionCount: Number(row.openPositionCount ?? 0),
        openShareCount: Number(row.openShareCount ?? 0),
      },
    ]),
  );

  return rows
    .filter((row) => row.closesAt <= new Date())
    .map((row) =>
      buildAdminSettlementListItem({
        id: row.id,
        slug: row.slug,
        question: row.question,
        status: row.status,
        statusLabel: row.status === "locked" ? "锁盘中" : "进行中",
        closesAt: row.closesAt,
        resolvesAt: row.resolvesAt,
        openPositionCount: counts.get(row.id)?.openPositionCount ?? 0,
        openShareCount: counts.get(row.id)?.openShareCount ?? 0,
      }),
    );
}

export async function getAdminMarketById(id: string) {
  const [market] = await db
    .select({
      id: markets.id,
      question: markets.question,
      slug: markets.slug,
      image: markets.image,
      sourceName: markets.sourceName,
      sourceUrl: markets.sourceUrl,
      newsImageSource: markets.newsImageSource,
      externalYesProbabilityBps: markets.externalYesProbabilityBps,
      externalNoProbabilityBps: markets.externalNoProbabilityBps,
      externalPriceUpdatedAt: markets.externalPriceUpdatedAt,
      externalPriceStale: markets.externalPriceStale,
      priceAnchorMode: markets.priceAnchorMode,
      brief: markets.brief,
      tone: markets.tone,
      category: markets.category,
      status: markets.status,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      volumePoints: markets.volumePoints,
      activeTraders: markets.activeTraders,
      closesAt: markets.closesAt,
      resolvesAt: markets.resolvesAt,
      evidence: markets.evidence,
      resolutionSources: markets.resolutionSources,
    })
    .from(markets)
    .where(eq(markets.id, id))
    .limit(1);

  if (!market) {
    return null;
  }

  return {
    ...market,
    evidence: asEvidence(market.evidence),
    resolutionSources: asResolutionSources(market.resolutionSources),
  };
}

export async function getAdminMarketDeleteGuard(id: string) {
  const [market] = await db
    .select({
      id: markets.id,
    })
    .from(markets)
    .where(eq(markets.id, id))
    .limit(1);

  if (!market) {
    return null;
  }

  const [positionRow, tradeRow, snapshotRow, resolutionRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(positions)
      .where(eq(positions.marketId, id)),
    db
      .select({ value: count() })
      .from(trades)
      .where(eq(trades.marketId, id)),
    db
      .select({ value: count() })
      .from(priceSnapshots)
      .where(eq(priceSnapshots.marketId, id)),
    db
      .select({ value: count() })
      .from(resolutions)
      .where(eq(resolutions.marketId, id)),
  ]);

  return buildMarketDeleteGuard({
    positionCount: positionRow[0]?.value ?? 0,
    tradeCount: tradeRow[0]?.value ?? 0,
    snapshotCount: snapshotRow[0]?.value ?? 0,
    resolutionCount: resolutionRow[0]?.value ?? 0,
  });
}

export async function getQuoteForMarketSlug(
  slug: string,
  action: TradeAction,
  side: MarketSide,
  shareCount: number,
): Promise<TradeQuoteView | null> {
  const [market] = await db
    .select({
      id: markets.id,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      status: markets.status,
      closesAt: markets.closesAt,
    })
    .from(markets)
    .where(eq(markets.slug, slug))
    .limit(1);

  if (!market || market.status !== "live" || market.closesAt <= new Date()) {
    return null;
  }

  const state = createMarketState({
    liquidity: market.liquidity,
    yesShares: market.yesShares,
    noShares: market.noShares,
  });
  const quote =
    action === "buy"
      ? (() => {
          const nextQuote = quoteBuyOrder(state, {
            side,
            shareCount,
          });

          return {
            amount: scaleDownPositivePoints(nextQuote.cost),
            averagePrice: scaleDownPositivePoints(nextQuote.averagePrice),
          };
        })()
      : (() => {
          const nextQuote = quoteSellOrder(state, {
            side,
            shareCount,
          });

          return {
            amount: scaleDownPositivePoints(nextQuote.refund),
            averagePrice: scaleDownPositivePoints(nextQuote.averagePrice),
          };
        })();

  return {
    action,
    side,
    shareCount,
    amount: quote.amount,
    averagePrice: quote.averagePrice,
  };
}

export async function getMarketPriceHistory(
  slug: string,
  period: PriceHistoryPeriod = "7d",
): Promise<PriceHistoryPoint[] | null> {
  const [market] = await db
    .select({
      id: markets.id,
      slug: markets.slug,
      status: markets.status,
      closesAt: markets.closesAt,
      resolvesAt: markets.resolvesAt,
      liquidity: markets.liquidity,
      yesShares: markets.yesShares,
      noShares: markets.noShares,
      externalYesProbabilityBps: markets.externalYesProbabilityBps,
      externalNoProbabilityBps: markets.externalNoProbabilityBps,
      priceAnchorMode: markets.priceAnchorMode,
    })
    .from(markets)
    .where(eq(markets.slug, slug))
    .limit(1);

  if (!market) {
    return null;
  }

  const now = new Date();
  let startTime: Date | null = null;

  switch (period) {
    case "24h":
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      startTime = null;
      break;
  }

  const snapshots = await db
    .select({
      recordedAt: priceSnapshots.recordedAt,
      yesProbabilityBps: priceSnapshots.yesProbabilityBps,
      noProbabilityBps: priceSnapshots.noProbabilityBps,
    })
    .from(priceSnapshots)
    .where(
      startTime
        ? and(
            eq(priceSnapshots.marketId, market.id),
            gte(priceSnapshots.recordedAt, startTime),
          )
        : eq(priceSnapshots.marketId, market.id),
    )
    .orderBy(priceSnapshots.recordedAt);

  const recordedHistory = snapshots.map((snapshot) => ({
    timestamp: snapshot.recordedAt,
    yesProbability: snapshot.yesProbabilityBps / 10000,
    noProbability: snapshot.noProbabilityBps / 10000,
  }));

  const [resolution] = await db
    .select({
      outcome: resolutions.outcome,
    })
    .from(resolutions)
    .where(eq(resolutions.marketId, market.id))
    .limit(1);

  if (recordedHistory.length >= 8) {
    return recordedHistory;
  }

  const probabilities = getDisplayProbability({
    localProbability: getMarketProbabilities(
      createMarketState({
        liquidity: market.liquidity,
        yesShares: market.yesShares,
        noShares: market.noShares,
      }),
    ),
    externalYesProbabilityBps: market.externalYesProbabilityBps,
    externalNoProbabilityBps: market.externalNoProbabilityBps,
    priceAnchorMode: market.priceAnchorMode,
  });

  return buildVirtualMarketHistory(
    {
      slug: market.slug,
      status: market.status,
      closesAt: market.closesAt,
      resolvesAt: market.resolvesAt,
      currentYesProbability: probabilities.yes,
      resolutionOutcome: resolution?.outcome ?? null,
    },
    period,
    now,
  );
}

export async function getUserMarketPositions(userId: string, slug: string) {
  const rows = await db
    .select({
      side: positions.side,
      shareCount: positions.shareCount,
      totalCost: positions.totalCost,
    })
    .from(positions)
    .innerJoin(markets, eq(markets.id, positions.marketId))
    .where(and(eq(positions.userId, userId), eq(markets.slug, slug)));

  return rows;
}
