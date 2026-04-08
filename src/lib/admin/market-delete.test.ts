import { describe, expect, it } from "vitest";

import { buildMarketDeleteGuard } from "./market-delete";

describe("buildMarketDeleteGuard", () => {
  it("allows deleting markets with no related records", () => {
    expect(
      buildMarketDeleteGuard({
        positionCount: 0,
        tradeCount: 0,
        snapshotCount: 0,
        resolutionCount: 0,
      }),
    ).toEqual({ canDelete: true });
  });

  it("blocks deleting markets with related records and explains why", () => {
    const result = buildMarketDeleteGuard({
      positionCount: 2,
      tradeCount: 0,
      snapshotCount: 1,
      resolutionCount: 0,
    });

    expect(result.canDelete).toBe(false);
    if (result.canDelete) {
      throw new Error("Expected delete guard to block deletion.");
    }
    expect(result.reason).toMatch(/position/i);
    expect(result.reason).toMatch(/snapshot/i);
  });
});
