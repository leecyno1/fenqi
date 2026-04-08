import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { db } from "@/db/client";
import { marketEvents, markets } from "@/db/schema";
import { canAccessAdmin } from "@/lib/auth/guards";
import { getOptionalSession } from "@/lib/auth/session";
import { parseAdminMarketInput } from "@/lib/admin/market-form";
import { buildStandaloneEventValues } from "@/lib/events/standalone-event";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!canAccessAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const rateLimited = await applyRateLimit({
    request,
    scope: "admin-create-market",
    limit: 10,
    windowMs: 60_000,
    keyParts: [session.userId],
  });

  if (rateLimited) {
    return rateLimited;
  }

  try {
    const payload = parseAdminMarketInput(await request.json());
    const marketId = randomUUID();
    const eventId = randomUUID();

    const market = await db.transaction(async (tx) => {
      await tx.insert(marketEvents).values(
        buildStandaloneEventValues({
          id: eventId,
          slug: payload.slug,
          title: payload.question,
          brief: payload.brief,
          tone: payload.tone,
          category: payload.category,
          sourceName: payload.sourceName,
          sourceUrl: payload.sourceUrl,
          image: payload.image,
          resolutionSources: payload.resolutionSources,
          evidence: payload.evidence,
        }),
      );

      const [createdMarket] = await tx
        .insert(markets)
        .values({
          id: marketId,
          eventId,
          slug: payload.slug,
          image: payload.image,
          externalMarketId: marketId,
          externalMarketSlug: payload.slug,
          answerLabel: "主市场",
          answerOrder: 1,
          sourceName: payload.sourceName,
          sourceUrl: payload.sourceUrl,
          newsImageSource: payload.newsImageSource,
          priceAnchorMode: payload.priceAnchorMode,
          question: payload.question,
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
          createdBy: session.userId,
        })
        .returning({
          id: markets.id,
          slug: markets.slug,
        });

      return createdMarket;
    });

    return NextResponse.json({ market }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }

    const message = error instanceof Error ? error.message : "Failed to create market.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
