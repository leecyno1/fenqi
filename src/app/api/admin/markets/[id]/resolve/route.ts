import { NextResponse } from "next/server";

import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { parseAdminResolutionInput } from "@/lib/admin/market-resolution";
import { resolveMarket } from "@/lib/admin/resolve-market";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canAccessAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const rateLimited = await applyRateLimit({
    request,
    scope: "admin-resolve",
    limit: 8,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { id } = await params;

  try {
    const payload = parseAdminResolutionInput(await request.json());
    const result = await resolveMarket({
      marketId: id,
      resolvedBy: session.userId,
      ...payload,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve market.";
    const status =
      /not found/i.test(message) ? 404 : /already settled|closed before settlement|published markets/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
