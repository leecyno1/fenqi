import { NextResponse } from "next/server";

import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { getPolymarketCatalogCoverage } from "@/lib/health";
import { syncPolymarketCatalog } from "@/lib/integrations/sync-polymarket";
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
    scope: "admin-sync-polymarket",
    limit: 3,
    windowMs: 10 * 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
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
    const catalog = await getPolymarketCatalogCoverage();

    return NextResponse.json({
      success: true,
      inserted: result.inserted,
      updated: result.updated,
      skipped: result.skipped,
      catalog,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to sync Polymarket catalog.",
      },
      { status: 500 },
    );
  }
}
