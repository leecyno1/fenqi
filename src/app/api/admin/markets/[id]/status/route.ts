import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { markets } from "@/db/schema";
import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { parseAdminMarketStatusInput } from "@/lib/admin/market-status";
import { applyRateLimit } from "@/lib/rate-limit";

export async function PATCH(
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
    scope: "admin-status",
    limit: 20,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { id } = await params;

  try {
    const payload = parseAdminMarketStatusInput(await request.json());

    const [market] = await db
      .update(markets)
      .set({
        status: payload.status,
        updatedAt: new Date(),
      })
      .where(eq(markets.id, id))
      .returning({
        id: markets.id,
        status: markets.status,
      });

    if (!market) {
      return NextResponse.json({ error: "Market not found." }, { status: 404 });
    }

    return NextResponse.json({ market });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
