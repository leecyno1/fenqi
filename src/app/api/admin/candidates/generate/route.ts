import { NextResponse } from "next/server";

import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { syncReportGeneratedCandidates } from "@/lib/integrations/sync-reports";
import { runTrackedJob } from "@/lib/jobs";
import { applyRateLimit } from "@/lib/rate-limit";
import { enforceTrustedWriteOrigin } from "@/lib/request-integrity";

export async function POST(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canAccessAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const untrustedOrigin = enforceTrustedWriteOrigin(request);
  if (untrustedOrigin) {
    return untrustedOrigin;
  }

  const rateLimited = await applyRateLimit({
    request,
    scope: "admin-candidates-generate",
    limit: 5,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
  }

  if (!process.env.REPORTS_LLM_API_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: "缺少 REPORTS_LLM_API_KEY，无法从新闻生成候选。",
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate candidates.",
      },
      { status: 500 },
    );
  }
}
