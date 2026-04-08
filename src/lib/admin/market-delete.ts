export type MarketDeleteCounts = {
  positionCount: number;
  tradeCount: number;
  snapshotCount: number;
  resolutionCount: number;
};

export function buildMarketDeleteGuard(counts: MarketDeleteCounts):
  | { canDelete: true }
  | { canDelete: false; reason: string } {
  const blockers: string[] = [];

  if (counts.positionCount > 0) {
    blockers.push(`positions(${counts.positionCount})`);
  }

  if (counts.tradeCount > 0) {
    blockers.push(`trades(${counts.tradeCount})`);
  }

  if (counts.snapshotCount > 0) {
    blockers.push(`snapshots(${counts.snapshotCount})`);
  }

  if (counts.resolutionCount > 0) {
    blockers.push(`resolutions(${counts.resolutionCount})`);
  }

  if (blockers.length === 0) {
    return { canDelete: true };
  }

  return {
    canDelete: false,
    reason: `Market cannot be deleted because related records exist: ${blockers.join(", ")}.`,
  };
}
