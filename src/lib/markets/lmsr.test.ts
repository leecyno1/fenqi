import { describe, expect, it } from "vitest";

import {
  createMarketState,
  getMarketProbabilities,
  quoteBuyOrder,
  quoteSellOrder,
  settlePortfolioPayout,
} from "./lmsr";

describe("LMSR market math", () => {
  it("keeps yes and no probabilities summing to one", () => {
    const state = createMarketState({
      liquidity: 120,
      yesShares: 50,
      noShares: 25,
    });

    const probabilities = getMarketProbabilities(state);

    expect(probabilities.yes + probabilities.no).toBeCloseTo(1, 6);
    expect(probabilities.yes).toBeGreaterThan(probabilities.no);
  });

  it("charges more for larger orders on the same side", () => {
    const state = createMarketState({
      liquidity: 90,
      yesShares: 40,
      noShares: 40,
    });

    const smallOrder = quoteBuyOrder(state, {
      side: "YES",
      shareCount: 10,
    });
    const largeOrder = quoteBuyOrder(state, {
      side: "YES",
      shareCount: 25,
    });

    expect(smallOrder.cost).toBeGreaterThan(0);
    expect(largeOrder.cost).toBeGreaterThan(smallOrder.cost);
    expect(largeOrder.averagePrice).toBeGreaterThan(smallOrder.averagePrice);
  });

  it("returns a refund when selling shares back into the market", () => {
    const state = createMarketState({
      liquidity: 100,
      yesShares: 70,
      noShares: 35,
    });

    const smallOrder = quoteSellOrder(state, {
      side: "YES",
      shareCount: 8,
    });
    const largeOrder = quoteSellOrder(state, {
      side: "YES",
      shareCount: 20,
    });

    expect(smallOrder.refund).toBeGreaterThan(0);
    expect(largeOrder.refund).toBeGreaterThan(smallOrder.refund);
    expect(largeOrder.averagePrice).toBeLessThan(smallOrder.averagePrice);
    expect(largeOrder.newState.yesShares).toBe(state.yesShares - 20);
  });

  it("settles winning and losing positions using 1-point payout units", () => {
    const payout = settlePortfolioPayout(
      [
        { side: "YES", shareCount: 18, totalCost: 9.342 },
        { side: "NO", shareCount: 7, totalCost: 2.918 },
      ],
      "YES",
    );

    expect(payout.grossPayout).toBe(18);
    expect(payout.netPayout).toBeCloseTo(5.74, 3);
    expect(payout.winningShares).toBe(18);
    expect(payout.losingShares).toBe(7);
  });

  it("refunds original cost when a market is voided", () => {
    const payout = settlePortfolioPayout(
      [
        { side: "YES", shareCount: 13, totalCost: 6.55 },
        { side: "NO", shareCount: 9, totalCost: 4.02 },
      ],
      "VOID",
    );

    expect(payout.grossPayout).toBe(10.57);
    expect(payout.netPayout).toBe(0);
    expect(payout.winningShares).toBe(0);
    expect(payout.losingShares).toBe(0);
  });
});
