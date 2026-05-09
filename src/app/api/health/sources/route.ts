import { NextResponse } from "next/server";

import { probeSourceHealth } from "@/lib/integrations/source-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const report = await probeSourceHealth();

  return NextResponse.json(report, {
    status: report.ok ? 200 : 503,
  });
}
