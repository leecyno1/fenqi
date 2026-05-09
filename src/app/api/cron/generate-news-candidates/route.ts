import { NextRequest, NextResponse } from "next/server";

import { ensureCronAuthorization } from "@/lib/cron";
import { syncReportGeneratedCandidates } from "@/lib/integrations/sync-reports";
import { runTrackedJob } from "@/lib/jobs";

export async function POST(request: NextRequest) {
  const unauthorized = ensureCronAuthorization(request);
  if (unauthorized) {
    return unauthorized;
  }

  if (!process.env.REPORTS_LLM_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "Missing REPORTS_LLM_API_KEY.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runTrackedJob(
      "generate-news-candidates",
      () => syncReportGeneratedCandidates(),
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
