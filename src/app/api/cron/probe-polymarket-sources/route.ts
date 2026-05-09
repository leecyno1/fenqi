import { NextRequest, NextResponse } from "next/server";

import { ensureCronAuthorization } from "@/lib/cron";
import { runPolymarketSourceProbe } from "@/lib/integrations/probe-polymarket-sources";
import { runTrackedJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  const unauthorized = ensureCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runTrackedJob(
      "probe-polymarket-sources",
      () => runPolymarketSourceProbe(),
      (summary) => ({
        processedCount: summary.sources.filter((source) => source.status === "ok").length,
        summary,
      }),
    );

    return NextResponse.json({
      success: true,
      ok: result.ok,
      stale: result.stale,
      timestamp: result.timestamp,
      sources: result.sources,
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
