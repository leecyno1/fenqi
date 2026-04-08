import { NextRequest, NextResponse } from "next/server";

import { ensureCronAuthorization } from "@/lib/cron";
import { syncPolymarketCatalog } from "@/lib/integrations/sync-polymarket";
import { runTrackedJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  const unauthorized = ensureCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runTrackedJob(
      "sync-polymarket-catalog",
      () => syncPolymarketCatalog(),
      (summary) => ({
        processedCount: summary.inserted + summary.updated,
        summary,
      }),
    );

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      updated: result.updated,
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
