import { NextResponse } from "next/server";

import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { runPolymarketSourceProbe } from "@/lib/integrations/probe-polymarket-sources";
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
    scope: "admin-probe-sources",
    limit: 6,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
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
        error: error instanceof Error ? error.message : "Failed to probe sources.",
      },
      { status: 500 },
    );
  }
}
