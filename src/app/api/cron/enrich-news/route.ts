import { NextRequest, NextResponse } from "next/server";

import { ensureCronAuthorization } from "@/lib/cron";
import { enrichMarketsWithNews } from "@/lib/integrations/enrich-news";
import { runTrackedJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  const unauthorized = ensureCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runTrackedJob(
      "enrich-news",
      () => enrichMarketsWithNews(),
      (summary) => ({
        processedCount: summary.updated,
        summary,
      }),
    );

    return NextResponse.json({
      success: true,
      updated: result.updated,
      skipped: result.skipped,
      matched: result.matched,
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
