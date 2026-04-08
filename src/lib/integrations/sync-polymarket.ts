import { randomUUID } from "node:crypto";

import { and, desc, eq, inArray, notInArray } from "drizzle-orm";

import { db } from "@/db/client";
import { marketEvents, markets, priceSnapshots } from "@/db/schema";

import {
  buildAnchoredLmsrState,
  fetchClobTokenPrice,
  fetchPolymarketEvents,
  filterBinaryPolymarketEvents,
  normalizePolymarketEvent,
  type NormalizedChildMarketCandidate,
  type NormalizedEventBundleCandidate,
  type NormalizedEventCandidate,
  type NormalizedMarketEventCandidate,
} from "./polymarket";
import { getCnEntertainmentCandidates } from "./cn-entertainment";
import { enrichCandidateWithNews } from "./enrich-news";

export type SyncPolymarketOptions = {
  limit?: number;
  active?: boolean;
  includeLocalCandidates?: boolean;
  candidates?: NormalizedEventBundleCandidate[];
  cacheImage?: (imageUrl: string) => Promise<string | null>;
  skipNewsEnrichment?: boolean;
};

export type SyncPolymarketResult = {
  inserted: number;
  updated: number;
  skipped: number;
};

export type SyncPolymarketPricesResult = {
  updated: number;
  stale: number;
  skipped: number;
};

function wrapStandaloneCandidate(candidate: NormalizedEventCandidate): NormalizedEventBundleCandidate {
  return {
    event: {
      externalSource: candidate.externalSource,
      externalEventId: candidate.externalId,
      externalEventSlug: candidate.externalSlug,
      slug: candidate.externalSlug,
      title: candidate.question,
      brief: candidate.brief,
      tone: candidate.tone,
      category: candidate.category,
      sourceName: candidate.sourceName,
      sourceUrl: candidate.sourceUrl,
      canonicalSourceUrl: candidate.canonicalSourceUrl,
      externalImageUrl: candidate.externalImageUrl,
      newsImageUrl: candidate.newsImageUrl,
      newsImageCachedUrl: candidate.newsImageCachedUrl,
      newsImageSource: candidate.newsImageSource,
      newsReferences: candidate.newsReferences,
      heatScore: candidate.heatScore,
      controversyScore: candidate.controversyScore,
      isFeatured: candidate.isFeatured,
      resolutionSources: candidate.resolutionSources,
      evidence: candidate.evidence,
      tags: candidate.tags,
      lastSyncedAt: candidate.lastSyncedAt,
    },
    childMarkets: [
      {
        externalSource: candidate.externalSource,
        externalEventId: candidate.externalId,
        externalEventSlug: candidate.externalSlug,
        externalMarketId: candidate.externalId,
        externalMarketSlug: candidate.externalSlug,
        answerLabel: "主市场",
        answerOrder: 1,
        question: candidate.question,
        brief: candidate.brief,
        tone: candidate.tone,
        category: candidate.category,
        status: candidate.status,
        closesAt: candidate.closesAt,
        resolvesAt: candidate.resolvesAt,
        liquidity: candidate.liquidity,
        yesShares: candidate.yesShares,
        noShares: candidate.noShares,
        volumePoints: candidate.volumePoints,
        activeTraders: candidate.activeTraders,
        probability: candidate.probability,
        externalYesProbabilityBps: candidate.externalYesProbabilityBps,
        externalNoProbabilityBps: candidate.externalNoProbabilityBps,
        externalPriceUpdatedAt: candidate.externalPriceUpdatedAt,
        externalPriceStale: candidate.externalPriceStale,
        priceAnchorMode: candidate.priceAnchorMode,
        clobTokenIds: candidate.clobTokenIds,
        externalImageUrl: candidate.externalImageUrl,
        lastSyncedAt: candidate.lastSyncedAt,
      },
    ],
  };
}

function toEventEnrichmentCandidate(event: NormalizedMarketEventCandidate): NormalizedEventCandidate {
  return {
    externalSource: event.externalSource,
    externalId: event.externalEventId,
    externalSlug: event.externalEventSlug,
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    canonicalSourceUrl: event.canonicalSourceUrl,
    question: event.title,
    brief: event.brief,
    tone: event.tone,
    category: event.category,
    status: "live",
    closesAt: new Date(),
    resolvesAt: new Date(),
    liquidity: 100,
    yesShares: 0,
    noShares: 0,
    volumePoints: 0,
    activeTraders: 0,
    probability: { yes: 0.5, no: 0.5 },
    externalYesProbabilityBps: null,
    externalNoProbabilityBps: null,
    externalPriceUpdatedAt: null,
    externalPriceStale: false,
    priceAnchorMode: "external",
    clobTokenIds: [],
    externalImageUrl: event.externalImageUrl,
    newsImageUrl: event.newsImageUrl,
    newsImageCachedUrl: event.newsImageCachedUrl,
    newsImageSource: event.newsImageSource,
    newsReferences: event.newsReferences,
    heatScore: event.heatScore,
    controversyScore: event.controversyScore,
    isFeatured: event.isFeatured,
    resolutionSources: event.resolutionSources,
    evidence: event.evidence,
    tags: event.tags,
    lastSyncedAt: event.lastSyncedAt,
  };
}

function mergeEnrichedEvent(
  bundle: NormalizedEventBundleCandidate,
  enriched: NormalizedEventCandidate,
): NormalizedEventBundleCandidate {
  return {
    ...bundle,
    event: {
      ...bundle.event,
      externalImageUrl: enriched.externalImageUrl,
      newsImageUrl: enriched.newsImageUrl,
      newsImageCachedUrl: enriched.newsImageCachedUrl,
      newsImageSource: enriched.newsImageSource,
      newsReferences: enriched.newsReferences,
      heatScore: enriched.heatScore,
      controversyScore: enriched.controversyScore,
      isFeatured: enriched.isFeatured,
      lastSyncedAt: enriched.lastSyncedAt,
    },
  };
}

function toEventValues(id: string, event: NormalizedMarketEventCandidate) {
  return {
    id,
    slug: event.slug,
    image: null,
    externalSource: event.externalSource,
    externalEventId: event.externalEventId,
    externalEventSlug: event.externalEventSlug,
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    canonicalSourceUrl: event.canonicalSourceUrl,
    externalImageUrl: event.externalImageUrl,
    newsImageUrl: event.newsImageUrl,
    newsImageCachedUrl: event.newsImageCachedUrl,
    newsImageSource: event.newsImageSource,
    newsReferences: event.newsReferences,
    heatScore: event.heatScore,
    controversyScore: event.controversyScore,
    isFeatured: event.isFeatured,
    lastSyncedAt: event.lastSyncedAt,
    title: event.title,
    brief: event.brief,
    tone: event.tone,
    category: event.category,
    resolutionSources: event.resolutionSources,
    evidence: event.evidence,
    updatedAt: new Date(),
  };
}

function toMarketValues(
  id: string,
  eventId: string,
  event: NormalizedMarketEventCandidate,
  child: NormalizedChildMarketCandidate,
) {
  return {
    id,
    eventId,
    slug: child.externalMarketSlug,
    image: null,
    externalSource: child.externalSource,
    externalId: child.externalMarketId,
    externalSlug: child.externalMarketSlug,
    externalMarketId: child.externalMarketId,
    externalMarketSlug: child.externalMarketSlug,
    answerLabel: child.answerLabel,
    answerOrder: child.answerOrder,
    sourceName: event.sourceName,
    sourceUrl: event.sourceUrl,
    canonicalSourceUrl: event.canonicalSourceUrl,
    externalImageUrl: child.externalImageUrl ?? event.externalImageUrl,
    newsImageUrl: event.newsImageUrl,
    newsImageCachedUrl: event.newsImageCachedUrl,
    newsImageSource: event.newsImageSource,
    newsReferences: event.newsReferences,
    heatScore: event.heatScore,
    controversyScore: event.controversyScore,
    isFeatured: event.isFeatured,
    lastSyncedAt: child.lastSyncedAt,
    externalYesProbabilityBps: child.externalYesProbabilityBps,
    externalNoProbabilityBps: child.externalNoProbabilityBps,
    externalPriceUpdatedAt: child.externalPriceUpdatedAt,
    externalPriceStale: child.externalPriceStale,
    priceAnchorMode: child.priceAnchorMode,
    clobTokenIds: child.clobTokenIds,
    question: child.question,
    brief: child.brief,
    tone: child.tone,
    category: child.category,
    status: child.status,
    liquidity: child.liquidity,
    yesShares: child.yesShares,
    noShares: child.noShares,
    volumePoints: child.volumePoints,
    activeTraders: child.activeTraders,
    closesAt: child.closesAt,
    resolvesAt: child.resolvesAt,
    resolutionSources: event.resolutionSources,
    evidence: event.evidence,
    updatedAt: new Date(),
  };
}

function chooseAnchorMode(input: {
  currentMode: "external" | "hybrid" | "local";
  activeTraders: number;
  volumePoints: number;
}) {
  if (input.currentMode === "local") {
    return "local";
  }

  if (input.activeTraders >= 20 || input.volumePoints >= 500) {
    return "hybrid";
  }

  return "external";
}

async function getEventBundles(options: SyncPolymarketOptions = {}) {
  const polymarketBundles =
    options.candidates ??
    filterBinaryPolymarketEvents(
      await fetchPolymarketEvents({
        limit: options.limit ?? 100,
        active: options.active ?? true,
        allowFallback: false,
      }),
    ).map(normalizePolymarketEvent);

  if (options.candidates) {
    return polymarketBundles;
  }

  const localBundles =
    options.includeLocalCandidates === false
      ? []
      : getCnEntertainmentCandidates().map(wrapStandaloneCandidate);

  return [...polymarketBundles.slice(0, 60), ...localBundles];
}

export async function syncPolymarketEvents(
  options: SyncPolymarketOptions = {},
): Promise<SyncPolymarketResult> {
  const bundles = await getEventBundles(options);
  const dedupedBundles = Array.from(
    new Map(
      bundles.map((bundle) => [
        `${bundle.event.externalSource}:${bundle.event.externalEventId}`,
        bundle,
      ]),
    ).values(),
  );
  const enrichedBundles = options.skipNewsEnrichment
    ? dedupedBundles
    : await Promise.all(
        dedupedBundles.map(async (bundle) => {
          const enrichedEvent = await enrichCandidateWithNews(toEventEnrichmentCandidate(bundle.event), {
            cacheImage: options.cacheImage,
          });
          return mergeEnrichedEvent(bundle, enrichedEvent);
        }),
      );

  if (enrichedBundles.length === 0) {
    return { inserted: 0, updated: 0, skipped: 0 };
  }

  const eventIds = enrichedBundles.map((bundle) => bundle.event.externalEventId);
  const eventSources = Array.from(new Set(enrichedBundles.map((bundle) => bundle.event.externalSource)));
  const existingEvents = await db
    .select({
      id: marketEvents.id,
      externalSource: marketEvents.externalSource,
      externalEventId: marketEvents.externalEventId,
    })
    .from(marketEvents)
    .where(
      and(
        inArray(marketEvents.externalSource, eventSources),
        inArray(marketEvents.externalEventId, eventIds),
      ),
    );
  const existingEventMap = new Map(
    existingEvents
      .filter(
        (row): row is { id: string; externalSource: string; externalEventId: string } =>
          Boolean(row.id && row.externalSource && row.externalEventId),
      )
      .map((row) => [`${row.externalSource}:${row.externalEventId}`, row]),
  );

  const childIds = enrichedBundles.flatMap((bundle) =>
    bundle.childMarkets.map((child) => child.externalMarketId),
  );
  const childSources = Array.from(
    new Set(enrichedBundles.flatMap((bundle) => bundle.childMarkets.map((child) => child.externalSource))),
  );
  const existingMarkets = childIds.length
    ? await db
        .select({
          id: markets.id,
          externalSource: markets.externalSource,
          externalMarketId: markets.externalMarketId,
        })
        .from(markets)
        .where(
          and(
            inArray(markets.externalSource, childSources),
            inArray(markets.externalMarketId, childIds),
          ),
        )
    : [];
  const existingMarketMap = new Map(
    existingMarkets
      .filter(
        (row): row is { id: string; externalSource: string; externalMarketId: string } =>
          Boolean(row.id && row.externalSource && row.externalMarketId),
      )
      .map((row) => [`${row.externalSource}:${row.externalMarketId}`, row]),
  );

  let inserted = 0;
  let updated = 0;

  for (const bundle of enrichedBundles) {
    const eventKey = `${bundle.event.externalSource}:${bundle.event.externalEventId}`;
    const existingEvent = existingEventMap.get(eventKey);
    const eventId = existingEvent?.id ?? randomUUID();

    await db
      .insert(marketEvents)
      .values(toEventValues(eventId, bundle.event))
      .onConflictDoUpdate({
        target: [marketEvents.externalSource, marketEvents.externalEventId],
        set: {
          slug: bundle.event.slug,
          sourceName: bundle.event.sourceName,
          sourceUrl: bundle.event.sourceUrl,
          canonicalSourceUrl: bundle.event.canonicalSourceUrl,
          externalEventSlug: bundle.event.externalEventSlug,
          externalImageUrl: bundle.event.externalImageUrl,
          newsImageUrl: bundle.event.newsImageUrl,
          newsImageCachedUrl: bundle.event.newsImageCachedUrl,
          newsImageSource: bundle.event.newsImageSource,
          newsReferences: bundle.event.newsReferences,
          heatScore: bundle.event.heatScore,
          controversyScore: bundle.event.controversyScore,
          isFeatured: bundle.event.isFeatured,
          lastSyncedAt: bundle.event.lastSyncedAt,
          title: bundle.event.title,
          brief: bundle.event.brief,
          tone: bundle.event.tone,
          category: bundle.event.category,
          resolutionSources: bundle.event.resolutionSources,
          evidence: bundle.event.evidence,
          updatedAt: new Date(),
        },
      });

    if (existingEvent) {
      updated += 1;
    } else {
      inserted += 1;
    }

    for (const child of bundle.childMarkets) {
      const marketKey = `${child.externalSource}:${child.externalMarketId}`;
      const existingMarket = existingMarketMap.get(marketKey);
      const marketId = existingMarket?.id ?? randomUUID();

      await db
        .insert(markets)
        .values(toMarketValues(marketId, eventId, bundle.event, child))
        .onConflictDoUpdate({
          target: [markets.externalSource, markets.externalMarketId],
          set: {
            eventId,
            slug: child.externalMarketSlug,
            externalId: child.externalMarketId,
            externalSlug: child.externalMarketSlug,
            externalMarketSlug: child.externalMarketSlug,
            answerLabel: child.answerLabel,
            answerOrder: child.answerOrder,
            sourceName: bundle.event.sourceName,
            sourceUrl: bundle.event.sourceUrl,
            canonicalSourceUrl: bundle.event.canonicalSourceUrl,
            externalImageUrl: child.externalImageUrl ?? bundle.event.externalImageUrl,
            newsImageUrl: bundle.event.newsImageUrl,
            newsImageCachedUrl: bundle.event.newsImageCachedUrl,
            newsImageSource: bundle.event.newsImageSource,
            newsReferences: bundle.event.newsReferences,
            heatScore: bundle.event.heatScore,
            controversyScore: bundle.event.controversyScore,
            isFeatured: bundle.event.isFeatured,
            lastSyncedAt: child.lastSyncedAt,
            externalYesProbabilityBps: child.externalYesProbabilityBps,
            externalNoProbabilityBps: child.externalNoProbabilityBps,
            externalPriceUpdatedAt: child.externalPriceUpdatedAt,
            externalPriceStale: child.externalPriceStale,
            priceAnchorMode: child.priceAnchorMode,
            clobTokenIds: child.clobTokenIds,
            question: child.question,
            brief: child.brief,
            tone: child.tone,
            category: child.category,
            status: child.status,
            liquidity: child.liquidity,
            yesShares: child.yesShares,
            noShares: child.noShares,
            volumePoints: child.volumePoints,
            activeTraders: child.activeTraders,
            closesAt: child.closesAt,
            resolvesAt: child.resolvesAt,
            resolutionSources: bundle.event.resolutionSources,
            evidence: bundle.event.evidence,
            updatedAt: new Date(),
          },
        });
    }

    const liveChildIds = bundle.childMarkets.map((child) => child.externalMarketId);
    await db
      .delete(markets)
      .where(
        and(
          eq(markets.eventId, eventId),
          eq(markets.externalSource, bundle.event.externalSource),
          notInArray(markets.externalMarketId, liveChildIds),
        ),
      );
  }

  return {
    inserted,
    updated,
    skipped: 0,
  };
}

export async function syncPolymarketCatalog(options: SyncPolymarketOptions = {}) {
  return syncPolymarketEvents({
    ...options,
    limit: options.limit ?? 200,
  });
}

export async function syncPolymarketPrices(
  options: { limit?: number } = {},
): Promise<SyncPolymarketPricesResult> {
  const bundles = filterBinaryPolymarketEvents(
    await fetchPolymarketEvents({
      limit: options.limit ?? 100,
      active: true,
      allowFallback: false,
    }),
  )
    .slice(0, options.limit ?? 60)
    .map(normalizePolymarketEvent);
  const children = bundles.flatMap((bundle) => bundle.childMarkets);

  if (children.length === 0) {
    return { updated: 0, stale: 0, skipped: 0 };
  }

  const rows = await db
    .select({
      id: markets.id,
      externalMarketId: markets.externalMarketId,
      priceAnchorMode: markets.priceAnchorMode,
      activeTraders: markets.activeTraders,
      volumePoints: markets.volumePoints,
    })
    .from(markets)
    .where(
      and(
        eq(markets.externalSource, "polymarket"),
        inArray(
          markets.externalMarketId,
          children.map((child) => child.externalMarketId),
        ),
      ),
    )
    .orderBy(desc(markets.isFeatured), desc(markets.heatScore), desc(markets.volumePoints));

  const rowsByExternalMarketId = new Map(
    rows
      .filter((row): row is typeof row & { externalMarketId: string } => Boolean(row.externalMarketId))
      .map((row) => [row.externalMarketId, row]),
  );
  let updated = 0;
  let stale = 0;
  let skipped = 0;

  for (const child of children) {
    const row = rowsByExternalMarketId.get(child.externalMarketId);
    if (!row) {
      skipped += 1;
      continue;
    }

    const clobTokenId = child.clobTokenIds[0];
    const clobPrice = clobTokenId
      ? await fetchClobTokenPrice(clobTokenId, [
          String(child.probability.yes),
          String(child.probability.no),
        ])
      : null;
    const yesProbability = clobPrice?.yesProbability ?? child.probability.yes;
    const anchorMode = chooseAnchorMode({
      currentMode: row.priceAnchorMode,
      activeTraders: row.activeTraders,
      volumePoints: row.volumePoints,
    });
    const anchoredState = buildAnchoredLmsrState({
      yesProbability,
      liquidity: child.liquidity,
    });
    const shouldResetLocalState = anchorMode === "external";
    const yesProbabilityBps = Math.round(yesProbability * 10000);
    const noProbabilityBps = 10000 - yesProbabilityBps;
    const priceUpdatedAt = new Date();

    await db
      .update(markets)
      .set({
        externalYesProbabilityBps: yesProbabilityBps,
        externalNoProbabilityBps: noProbabilityBps,
        externalPriceUpdatedAt: priceUpdatedAt,
        externalPriceStale: Boolean(clobPrice?.stale),
        priceAnchorMode: anchorMode,
        liquidity: shouldResetLocalState ? child.liquidity : undefined,
        yesShares: shouldResetLocalState ? anchoredState.yesShares : undefined,
        noShares: shouldResetLocalState ? anchoredState.noShares : undefined,
        volumePoints: child.volumePoints,
        lastSyncedAt: priceUpdatedAt,
        updatedAt: priceUpdatedAt,
      })
      .where(eq(markets.id, row.id));

    await db.insert(priceSnapshots).values({
      id: randomUUID(),
      marketId: row.id,
      yesProbabilityBps,
      noProbabilityBps,
      recordedAt: priceUpdatedAt,
    });

    updated += 1;
    if (clobPrice?.stale) {
      stale += 1;
    }
  }

  return { updated, stale, skipped };
}
