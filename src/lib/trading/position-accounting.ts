export function reducePositionOnSell(
  position: {
    shareCount: number;
    totalCost: number;
  },
  input: {
    sellShareCount: number;
    proceeds: number;
  },
) {
  if (input.sellShareCount <= 0) {
    throw new Error("sellShareCount must be greater than zero.");
  }

  if (input.sellShareCount > position.shareCount) {
    throw new Error("sellShareCount exceeds current position.");
  }

  const averageCost = position.totalCost / position.shareCount;
  const releasedCost = Math.round(averageCost * input.sellShareCount);
  const remainingShareCount = position.shareCount - input.sellShareCount;
  const remainingTotalCost =
    remainingShareCount === 0 ? 0 : position.totalCost - releasedCost;

  return {
    releasedCost,
    realizedPnl: input.proceeds - releasedCost,
    remaining: {
      shareCount: remainingShareCount,
      totalCost: remainingTotalCost,
    },
  };
}
