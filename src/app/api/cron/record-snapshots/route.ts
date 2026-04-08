import { NextRequest, NextResponse } from "next/server";

import { recordPriceSnapshots } from "@/lib/cron/snapshot-recorder";
import { ensureCronAuthorization } from "@/lib/cron";
import { runTrackedJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  const unauthorized = ensureCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const result = await runTrackedJob(
      "record-snapshots",
      () => recordPriceSnapshots(),
      (summary) => ({
        processedCount: summary.recorded,
        summary,
      }),
    );

    return NextResponse.json({
      success: true,
      recorded: result.recorded,
      skipped: result.skipped,
      errors: result.errors,
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
