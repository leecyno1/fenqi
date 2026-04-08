import { NextRequest, NextResponse } from "next/server";

import { ensureCronAuthorization } from "@/lib/cron";
import { syncPolymarketPrices } from "@/lib/integrations/sync-polymarket";
import { runTrackedJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  const unauthorized = ensureCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runTrackedJob(
      "sync-polymarket-prices",
      () => syncPolymarketPrices(),
      (summary) => ({
        processedCount: summary.updated,
        summary,
      }),
    );

    return NextResponse.json({
      success: true,
      updated: result.updated,
      stale: result.stale,
      skipped: result.skipped,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
