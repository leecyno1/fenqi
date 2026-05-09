import { getServerEnv } from "@/lib/env";
import {
  evaluateJobFreshness,
  listLatestTrackedJobRuns,
  type TrackedJobName,
} from "@/lib/jobs";
import { getLatestSourceHealthReport, getMissingSourceHealthReport } from "@/lib/integrations/source-health";

const MIN_POLYMARKET_SYNCED_EVENTS = 100;
const MIN_POLYMARKET_SYNCED_MARKETS = 100;

export type PolymarketCatalogCoverage = {
  ok: boolean;
  minEvents: number;
  minMarkets: number;
  eventCount: number;
  marketCount: number;
};

export async function getPolymarketCatalogCoverage(): Promise<PolymarketCatalogCoverage> {
  const { count, eq } = await import("drizzle-orm");
  const { db } = await import("@/db/client");
  const { marketEvents, markets } = await import("@/db/schema");

  const [eventRows, marketRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(marketEvents)
      .where(eq(marketEvents.externalSource, "polymarket")),
    db
      .select({ value: count() })
      .from(markets)
      .where(eq(markets.externalSource, "polymarket")),
  ]);

  const eventCount = eventRows[0]?.value ?? 0;
  const marketCount = marketRows[0]?.value ?? 0;

  return {
    ok: eventCount >= MIN_POLYMARKET_SYNCED_EVENTS && marketCount >= MIN_POLYMARKET_SYNCED_MARKETS,
    minEvents: MIN_POLYMARKET_SYNCED_EVENTS,
    minMarkets: MIN_POLYMARKET_SYNCED_MARKETS,
    eventCount,
    marketCount,
  };
}

export async function getReadinessReport(now = new Date()) {
  let envOk = true;
  let envError: string | null = null;

  try {
    getServerEnv();
  } catch (error) {
    envOk = false;
    envError = error instanceof Error ? error.message : "Invalid environment";
  }

  let databaseOk = true;
  let databaseError: string | null = null;

  try {
    const { sql } = await import("drizzle-orm");
    const { db } = await import("@/db/client");
    await db.execute(sql`select 1`);
  } catch (error) {
    databaseOk = false;
    databaseError = error instanceof Error ? error.message : "Database unavailable";
  }

  const requiredJobs: TrackedJobName[] = [
    "record-snapshots",
    "probe-polymarket-sources",
    "sync-polymarket-catalog",
    "sync-polymarket-prices",
  ];

  const jobRuns = databaseOk ? await listLatestTrackedJobRuns() : [];
  const jobs = evaluateJobFreshness(jobRuns, now, requiredJobs);
  const sources = databaseOk ? await getLatestSourceHealthReport(now) : getMissingSourceHealthReport(now);
  const catalog = databaseOk
    ? await getPolymarketCatalogCoverage()
    : {
        ok: false,
        minEvents: MIN_POLYMARKET_SYNCED_EVENTS,
        minMarkets: MIN_POLYMARKET_SYNCED_MARKETS,
        eventCount: 0,
        marketCount: 0,
      };

  return {
    ok: envOk && databaseOk && jobs.ok && sources.ok && catalog.ok,
    timestamp: now.toISOString(),
    checks: {
      env: {
        ok: envOk,
        ...(envError ? { error: envError } : {}),
      },
      database: {
        ok: databaseOk,
        ...(databaseError ? { error: databaseError } : {}),
      },
      jobs,
      sources,
      catalog,
    },
  };
}
