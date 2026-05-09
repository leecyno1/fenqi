import { probeSourceHealth } from "./source-health";

export async function runPolymarketSourceProbe() {
  return probeSourceHealth();
}
