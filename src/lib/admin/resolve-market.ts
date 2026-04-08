import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  markets,
  positions,
  priceSnapshots,
  resolutions,
  virtualWallets,
  walletLedger,
} from "@/db/schema";
import { getMarketProbabilities, settlePortfolioPayout } from "@/lib/markets/lmsr";
import { createMarketState } from "@/lib/markets/lmsr";

export async function resolveMarket(input: {
  marketId: string;
  resolvedBy: string;
  outcome: "YES" | "NO" | "VOID";
  sourceLabel: string;
  sourceUrl: string;
  rationale?: string;
}) {
  return db.transaction(async (tx) => {
    const now = new Date();

    const [market] = await tx
      .select({
        id: markets.id,
        status: markets.status,
        liquidity: markets.liquidity,
        yesShares: markets.yesShares,
        noShares: markets.noShares,
        closesAt: markets.closesAt,
      })
      .from(markets)
      .where(eq(markets.id, input.marketId))
      .limit(1);

    if (!market) {
      throw new Error("Market not found.");
    }

    if (market.status === "resolved" || market.status === "voided") {
      throw new Error("Market is already settled.");
    }

    if (market.status !== "live" && market.status !== "locked") {
      throw new Error("Only published markets can be settled.");
    }

    if (market.status !== "locked" && market.closesAt > now) {
      throw new Error("Market must be closed before settlement.");
    }

    const [existingResolution] = await tx
      .select({ marketId: resolutions.marketId })
      .from(resolutions)
      .where(eq(resolutions.marketId, input.marketId))
      .limit(1);

    if (existingResolution) {
      throw new Error("Market is already settled.");
    }

    const probabilities = getMarketProbabilities(
      createMarketState({
        liquidity: market.liquidity,
        yesShares: market.yesShares,
        noShares: market.noShares,
      }),
    );

    await tx.insert(priceSnapshots).values({
      id: nanoid(),
      marketId: input.marketId,
      yesProbabilityBps: Math.round(probabilities.yes * 10000),
      noProbabilityBps: Math.round(probabilities.no * 10000),
      recordedAt: now,
    });

    const positionRows = await tx
      .select({
        userId: positions.userId,
        side: positions.side,
        shareCount: positions.shareCount,
        totalCost: positions.totalCost,
        walletId: virtualWallets.id,
        walletBalance: virtualWallets.balance,
        walletLifetimePnl: virtualWallets.lifetimePnL,
      })
      .from(positions)
      .innerJoin(virtualWallets, eq(virtualWallets.userId, positions.userId))
      .where(eq(positions.marketId, input.marketId));

    const positionsByUser = new Map<
      string,
      {
        walletId: string;
        walletBalance: number;
        walletLifetimePnl: number;
        positions: Array<{
          side: "YES" | "NO";
          shareCount: number;
          totalCost: number;
        }>;
      }
    >();

    for (const row of positionRows) {
      const current = positionsByUser.get(row.userId) ?? {
        walletId: row.walletId,
        walletBalance: row.walletBalance,
        walletLifetimePnl: row.walletLifetimePnl,
        positions: [],
      };

      current.positions.push({
        side: row.side,
        shareCount: row.shareCount,
        totalCost: row.totalCost,
      });
      positionsByUser.set(row.userId, current);
    }

    for (const [userId, entry] of positionsByUser.entries()) {
      const payout = settlePortfolioPayout(entry.positions, input.outcome);
      const nextBalance = entry.walletBalance + payout.grossPayout;
      const nextLifetimePnl = entry.walletLifetimePnl + payout.netPayout;

      await tx
        .update(virtualWallets)
        .set({
          balance: nextBalance,
          lifetimePnL: nextLifetimePnl,
          updatedAt: now,
        })
        .where(eq(virtualWallets.userId, userId));

      if (payout.grossPayout > 0) {
        await tx.insert(walletLedger).values({
          id: nanoid(),
          walletId: entry.walletId,
          marketId: input.marketId,
          entryType: input.outcome === "VOID" ? "void_refund" : "resolution_payout",
          amount: payout.grossPayout,
          balanceAfter: nextBalance,
          memo:
            input.outcome === "VOID"
              ? "Market voided refund"
              : `Market resolved ${input.outcome}`,
          createdAt: now,
        });
      }
    }

    await tx.insert(resolutions).values({
      marketId: input.marketId,
      outcome: input.outcome,
      sourceLabel: input.sourceLabel,
      sourceUrl: input.sourceUrl,
      rationale: input.rationale,
      resolvedBy: input.resolvedBy,
      resolvedAt: now,
    });

    await tx
      .update(markets)
      .set({
        status: input.outcome === "VOID" ? "voided" : "resolved",
        updatedAt: now,
      })
      .where(eq(markets.id, input.marketId));

    await tx.delete(positions).where(eq(positions.marketId, input.marketId));

    return {
      success: true,
      marketId: input.marketId,
      outcome: input.outcome,
      settledPositions: positionRows.length,
      affectedWallets: positionsByUser.size,
    };
  });
}
