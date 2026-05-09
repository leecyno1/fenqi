import type { SyncPolymarketOptions } from "./sync-polymarket";
import { getReportsGeneratedCandidates } from "./reports-generated";
import { syncPolymarketEvents, wrapStandaloneCandidate } from "./sync-polymarket";

export async function syncReportGeneratedCandidates(options: Omit<SyncPolymarketOptions, "candidates"> = {}) {
  const candidates = await getReportsGeneratedCandidates();
  return syncPolymarketEvents({
    ...options,
    candidates: candidates.map(wrapStandaloneCandidate),
    skipNewsEnrichment: true,
  });
}
