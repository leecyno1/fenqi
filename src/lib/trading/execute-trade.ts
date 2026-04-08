import { nanoid } from "nanoid";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { markets, positions, trades, virtualWallets, walletLedger } from "@/db/schema";
import type { TradeAction } from "@/lib/data/queries";
import {
  createMarketState,
  quoteBuyOrder,
  quoteSellOrder,
  type MarketSide,
} from "@/lib/markets/lmsr";
import { scaleDownPositivePoints } from "@/lib/points";
import { reducePositionOnSell } from "@/lib/trading/position-accounting";

export type TradeExecutionInput = {
  userId: string;
  marketId: string;
  action: TradeAction;
  side: MarketSide;
  shareCount: number;
};

export type TradeExecutionResult = {
  success: true;
  trade: {
    id: string;
    action: TradeAction;
    side: MarketSide;
    shareCount: number;
    totalCost: number;
    averagePrice: number;
  };
  wallet: {
    balance: number;
    lifetimePnL: number;
  };
  position: {
    side: MarketSide;
    shareCount: number;
    totalCost: number;
  };
};

export type TradeExecutionError = {
  success: false;
  error: string;
};

export async function executeTrade(
  input: TradeExecutionInput,
): Promise<TradeExecutionResult | TradeExecutionError> {
  return db.transaction(async (tx) => {
    const now = new Date();

    const [market] = await tx
      .select({
        id: markets.id,
        status: markets.status,
        liquidity: markets.liquidity,
        yesShares: markets.yesShares,
        noShares: markets.noShares,
        volumePoints: markets.volumePoints,
        closesAt: markets.closesAt,
      })
      .from(markets)
      .where(eq(markets.id, input.marketId))
      .limit(1);

    if (!market) {
      return { success: false, error: "Market not found" };
    }

    if (market.status !== "live") {
      return { success: false, error: "Market is not open for trading" };
    }

    if (market.closesAt <= now) {
      return { success: false, error: "Market is closed for trading" };
    }

    const [wallet] = await tx
      .select({
        id: virtualWallets.id,
        balance: virtualWallets.balance,
        lifetimePnL: virtualWallets.lifetimePnL,
      })
      .from(virtualWallets)
      .where(eq(virtualWallets.userId, input.userId))
      .limit(1);

    if (!wallet) {
      return { success: false, error: "Wallet not found" };
    }

    const [existingPosition] = await tx
      .select({
        shareCount: positions.shareCount,
        totalCost: positions.totalCost,
      })
      .from(positions)
      .where(
        and(
          eq(positions.userId, input.userId),
          eq(positions.marketId, input.marketId),
          eq(positions.side, input.side),
        ),
      )
      .limit(1);

    if (
      input.action === "sell" &&
      (!existingPosition || existingPosition.shareCount < input.shareCount)
    ) {
      return { success: false, error: "Insufficient shares to sell" };
    }

    const quote =
      input.action === "buy"
        ? (() => {
            const nextQuote = quoteBuyOrder(
              createMarketState({
                liquidity: market.liquidity,
                yesShares: market.yesShares,
                noShares: market.noShares,
              }),
              {
                side: input.side,
                shareCount: input.shareCount,
              },
            );

            return {
              amount: scaleDownPositivePoints(nextQuote.cost),
              averagePrice: scaleDownPositivePoints(nextQuote.averagePrice),
            };
          })()
        : (() => {
            const nextQuote = quoteSellOrder(
              createMarketState({
                liquidity: market.liquidity,
                yesShares: market.yesShares,
                noShares: market.noShares,
              }),
              {
                side: input.side,
                shareCount: input.shareCount,
              },
            );

            return {
              amount: scaleDownPositivePoints(nextQuote.refund),
              averagePrice: scaleDownPositivePoints(nextQuote.averagePrice),
            };
          })();

    const amount = quote.amount;
    const averagePrice = quote.averagePrice;

    if (input.action === "buy" && wallet.balance < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    const shareDelta = input.action === "buy" ? input.shareCount : -input.shareCount;
    const nextYesShares =
      input.side === "YES" ? market.yesShares + shareDelta : market.yesShares;
    const nextNoShares =
      input.side === "NO" ? market.noShares + shareDelta : market.noShares;

    await tx
      .update(markets)
      .set({
        yesShares: nextYesShares,
        noShares: nextNoShares,
        volumePoints: market.volumePoints + amount,
        updatedAt: now,
      })
      .where(eq(markets.id, input.marketId));

    const walletDelta = input.action === "buy" ? -amount : amount;
    const nextBalance = wallet.balance + walletDelta;
    let nextLifetimePnl = wallet.lifetimePnL;
    let nextPosition = {
      side: input.side,
      shareCount: (existingPosition?.shareCount ?? 0) + input.shareCount,
      totalCost: (existingPosition?.totalCost ?? 0) + amount,
    };

    if (input.action === "sell" && existingPosition) {
      const reduction = reducePositionOnSell(
        {
          shareCount: existingPosition.shareCount,
          totalCost: existingPosition.totalCost,
        },
        {
          sellShareCount: input.shareCount,
          proceeds: amount,
        },
      );

      nextPosition = {
        side: input.side,
        shareCount: reduction.remaining.shareCount,
        totalCost: reduction.remaining.totalCost,
      };
      nextLifetimePnl += reduction.realizedPnl;
    }

    await tx
      .update(virtualWallets)
      .set({
        balance: nextBalance,
        lifetimePnL: nextLifetimePnl,
        updatedAt: now,
      })
      .where(eq(virtualWallets.id, wallet.id));

    const tradeId = nanoid();
    await tx.insert(trades).values({
      id: tradeId,
      marketId: input.marketId,
      userId: input.userId,
      action: input.action,
      side: input.side,
      shareCount: input.shareCount,
      totalCost: amount,
      averagePrice,
      executedAt: now,
    });

    if (input.action === "buy" && existingPosition) {
      await tx
        .update(positions)
        .set({
          shareCount: nextPosition.shareCount,
          totalCost: nextPosition.totalCost,
          updatedAt: now,
        })
        .where(
          and(
            eq(positions.userId, input.userId),
            eq(positions.marketId, input.marketId),
            eq(positions.side, input.side),
          ),
        );
    } else if (input.action === "buy") {
      await tx.insert(positions).values({
        userId: input.userId,
        marketId: input.marketId,
        side: input.side,
        shareCount: nextPosition.shareCount,
        totalCost: nextPosition.totalCost,
        updatedAt: now,
      });
    } else if (nextPosition.shareCount === 0) {
      await tx
        .delete(positions)
        .where(
          and(
            eq(positions.userId, input.userId),
            eq(positions.marketId, input.marketId),
            eq(positions.side, input.side),
          ),
        );
    } else {
      await tx
        .update(positions)
        .set({
          shareCount: nextPosition.shareCount,
          totalCost: nextPosition.totalCost,
          updatedAt: now,
        })
        .where(
          and(
            eq(positions.userId, input.userId),
            eq(positions.marketId, input.marketId),
            eq(positions.side, input.side),
          ),
        );
    }

    await tx.insert(walletLedger).values({
      id: nanoid(),
      walletId: wallet.id,
      marketId: input.marketId,
      entryType: input.action === "buy" ? "trade_debit" : "trade_credit",
      amount: walletDelta,
      balanceAfter: nextBalance,
      memo: `Trade ${input.action}: ${input.side} ${input.shareCount} shares`,
      createdAt: now,
    });

    const [activeTraderSummary] = await tx
      .select({
        value: sql<number>`count(distinct ${trades.userId})`,
      })
      .from(trades)
      .where(eq(trades.marketId, input.marketId));

    await tx
      .update(markets)
      .set({
        activeTraders: Number(activeTraderSummary?.value ?? 0),
        updatedAt: now,
      })
      .where(eq(markets.id, input.marketId));

    return {
      success: true,
      trade: {
        id: tradeId,
        action: input.action,
        side: input.side,
        shareCount: input.shareCount,
        totalCost: amount,
        averagePrice,
      },
      wallet: {
        balance: nextBalance,
        lifetimePnL: nextLifetimePnl,
      },
      position: nextPosition,
    };
  });
}
