import { describe, expect, it } from "vitest";

import { reducePositionOnSell } from "./position-accounting";

describe("reducePositionOnSell", () => {
  it("releases average cost basis and computes realized pnl on partial sells", () => {
    const result = reducePositionOnSell(
      {
        shareCount: 9,
        totalCost: 945,
      },
      {
        sellShareCount: 4,
        proceeds: 468,
      },
    );

    expect(result.releasedCost).toBe(420);
    expect(result.realizedPnl).toBe(48);
    expect(result.remaining.shareCount).toBe(5);
    expect(result.remaining.totalCost).toBe(525);
  });

  it("zeros the position when the user sells every remaining share", () => {
    const result = reducePositionOnSell(
      {
        shareCount: 6,
        totalCost: 540,
      },
      {
        sellShareCount: 6,
        proceeds: 612,
      },
    );

    expect(result.releasedCost).toBe(540);
    expect(result.realizedPnl).toBe(72);
    expect(result.remaining.shareCount).toBe(0);
    expect(result.remaining.totalCost).toBe(0);
  });

  it("rejects attempts to sell more shares than the position holds", () => {
    expect(() =>
      reducePositionOnSell(
        {
          shareCount: 3,
          totalCost: 270,
        },
        {
          sellShareCount: 4,
          proceeds: 320,
        },
      ),
    ).toThrow(/exceeds/i);
  });
});
