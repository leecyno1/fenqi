import { NextResponse } from "next/server";
import { count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { marketEvents, markets } from "@/db/schema";
import { parseAdminMarketInput } from "@/lib/admin/market-form";
import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { getAdminMarketDeleteGuard } from "@/lib/data/queries";
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
    scope: "admin-update-market",
    limit: 20,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { id } = await params;

  try {
    const payload = parseAdminMarketInput(await request.json());
    const [currentMarket] = await db
      .select({
        id: markets.id,
        eventId: markets.eventId,
      })
      .from(markets)
      .where(eq(markets.id, id))
      .limit(1);

    if (!currentMarket) {
      return NextResponse.json({ error: "Market not found." }, { status: 404 });
    }

    const [market] = await db.transaction(async (tx) => {
      await tx
        .update(marketEvents)
        .set({
          slug: payload.slug,
          image: payload.image,
          sourceName: payload.sourceName,
          sourceUrl: payload.sourceUrl,
          canonicalSourceUrl: payload.sourceUrl,
          title: payload.question,
          brief: payload.brief,
          tone: payload.tone,
          category: payload.category,
          resolutionSources: payload.resolutionSources,
          evidence: payload.evidence,
          updatedAt: new Date(),
        })
        .where(eq(marketEvents.id, currentMarket.eventId));

      return tx
        .update(markets)
        .set({
          slug: payload.slug,
          image: payload.image,
          externalMarketSlug: payload.slug,
          question: payload.question,
          sourceName: payload.sourceName,
          sourceUrl: payload.sourceUrl,
          newsImageSource: payload.newsImageSource,
          priceAnchorMode: payload.priceAnchorMode,
          brief: payload.brief,
          tone: payload.tone,
          category: payload.category,
          status: payload.status,
          liquidity: payload.liquidity,
          yesShares: payload.yesShares,
          noShares: payload.noShares,
          volumePoints: payload.volumePoints,
          activeTraders: payload.activeTraders,
          closesAt: payload.closesAt,
          resolvesAt: payload.resolvesAt,
          evidence: payload.evidence,
          resolutionSources: payload.resolutionSources,
          updatedAt: new Date(),
        })
        .where(eq(markets.id, id))
        .returning({
          id: markets.id,
          slug: markets.slug,
        });
    });

    if (!market) {
      return NextResponse.json({ error: "Market not found." }, { status: 404 });
    }

    return NextResponse.json({ market });
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Failed to update market.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
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
    scope: "admin-delete-market",
    limit: 10,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
  }

  const { id } = await params;
  const guard = await getAdminMarketDeleteGuard(id);

  if (!guard) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  if (!guard.canDelete) {
    return NextResponse.json({ error: guard.reason }, { status: 409 });
  }

  const [market] = await db
    .select({
      eventId: markets.eventId,
    })
    .from(markets)
    .where(eq(markets.id, id))
    .limit(1);

  if (!market) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  await db.delete(markets).where(eq(markets.id, id));

  const [remainingMarkets] = await db
    .select({ value: count() })
    .from(markets)
    .where(eq(markets.eventId, market.eventId));

  if ((remainingMarkets?.value ?? 0) === 0) {
    await db.delete(marketEvents).where(eq(marketEvents.id, market.eventId));
  }

  return NextResponse.json({ deleted: true });
}
