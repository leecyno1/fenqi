import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { db } from "@/db/client";
import { markets, priceSnapshots } from "@/db/schema";
import { getDisplayProbability } from "@/lib/data/views";
import { createMarketState, getMarketProbabilities } from "@/lib/markets/lmsr";

export type SnapshotResult = {
  recorded: number;
  skipped: number;
  errors: string[];
};

/**
 * Records price snapshots for all live markets
 * Should be called periodically (e.g., every 1 hour) via cron
 */
export async function recordPriceSnapshots(): Promise<SnapshotResult> {
  const result: SnapshotResult = {
    recorded: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch all live markets
    const liveMarkets = await db
      .select({
        id: markets.id,
        liquidity: markets.liquidity,
        yesShares: markets.yesShares,
        noShares: markets.noShares,
        externalYesProbabilityBps: markets.externalYesProbabilityBps,
        externalNoProbabilityBps: markets.externalNoProbabilityBps,
        priceAnchorMode: markets.priceAnchorMode,
      })
      .from(markets)
      .where(eq(markets.status, "live"));

    if (liveMarkets.length === 0) {
      return result;
    }

    // Record snapshot for each market
    for (const market of liveMarkets) {
      try {
        const state = createMarketState({
          liquidity: market.liquidity,
          yesShares: market.yesShares,
          noShares: market.noShares,
        });

        const probabilities = getDisplayProbability({
          localProbability: getMarketProbabilities(state),
          externalYesProbabilityBps: market.externalYesProbabilityBps,
          externalNoProbabilityBps: market.externalNoProbabilityBps,
          priceAnchorMode: market.priceAnchorMode,
        });

        // Convert to basis points (0-10000)
        const yesProbabilityBps = Math.round(probabilities.yes * 10000);
        const noProbabilityBps = Math.round(probabilities.no * 10000);

        await db.insert(priceSnapshots).values({
          id: nanoid(),
          marketId: market.id,
          yesProbabilityBps,
          noProbabilityBps,
          recordedAt: new Date(),
        });

        result.recorded++;
      } catch (error) {
        result.errors.push(
          `Market ${market.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        result.skipped++;
      }
    }

    return result;
  } catch (error) {
    result.errors.push(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`,
    );
    return result;
  }
}
