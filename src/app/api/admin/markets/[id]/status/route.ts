import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { marketEvents, markets } from "@/db/schema";
import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { parseAdminMarketStatusInput } from "@/lib/admin/market-status";
import { isInvalidJsonBodyError, readJsonBody } from "@/lib/http-json";
import { applyRateLimit } from "@/lib/rate-limit";
import { enforceTrustedWriteOrigin } from "@/lib/request-integrity";

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

  const untrustedOrigin = enforceTrustedWriteOrigin(request);
  if (untrustedOrigin) {
    return untrustedOrigin;
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
    const payload = parseAdminMarketStatusInput(await readJsonBody(request));

    const now = new Date();
    const [market] = await db
      .select({
        id: markets.id,
        eventId: markets.eventId,
        externalSource: markets.externalSource,
        status: markets.status,
      })
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    if (!market) {
      return NextResponse.json({ error: "Market not found." }, { status: 404 });
    }

    const publishedExternalSource = market.externalSource === "news_report" && payload.status === "live" ? "cn_news" : market.externalSource;

    const [updatedMarket] = await db.transaction(async (tx) => {
      if (publishedExternalSource !== market.externalSource) {
        await tx
          .update(marketEvents)
          .set({
            externalSource: publishedExternalSource,
            updatedAt: now,
          })
          .where(eq(marketEvents.id, market.eventId));
      }

      return tx
        .update(markets)
        .set({
          status: payload.status,
          externalSource: publishedExternalSource,
          updatedAt: now,
        })
        .where(eq(markets.id, id))
        .returning({
          id: markets.id,
          status: markets.status,
          externalSource: markets.externalSource,
        });
    });

    return NextResponse.json({ market: updatedMarket });
  } catch (error) {
    if (isInvalidJsonBodyError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Failed to update status.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
