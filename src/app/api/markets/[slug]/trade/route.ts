import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { canAccessPortfolio } from "@/lib/auth/guards";
import type { TradeAction } from "@/lib/data/queries";
import { isInvalidJsonBodyError, readJsonBody } from "@/lib/http-json";
import { applyRateLimit } from "@/lib/rate-limit";
import { enforceTrustedWriteOrigin } from "@/lib/request-integrity";
import { executeTrade } from "@/lib/trading/execute-trade";
import { db } from "@/db/client";
import { markets, users } from "@/db/schema";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    const accessUser = user
      ? {
          userId: user.id,
          role: user.role,
          emailVerified: user.emailVerified,
        }
      : null;

    if (!canAccessPortfolio(accessUser)) {
      return NextResponse.json(
        { error: "Verified account required." },
        { status: 403 },
      );
    }

    const untrustedOrigin = enforceTrustedWriteOrigin(request);
    if (untrustedOrigin) {
      return untrustedOrigin;
    }

    const rateLimited = await applyRateLimit({
      request,
      scope: "trade",
      limit: 12,
      windowMs: 60_000,
      keyParts: [session.user.id],
    });

    if (rateLimited) {
      return rateLimited;
    }

    const { slug } = await params;
    const body = await readJsonBody(request);

    if (!isRecord(body)) {
      return NextResponse.json({ error: "Invalid trade payload." }, { status: 400 });
    }

    // Validate request body
    const action = body.action as TradeAction | undefined;
    const side = body.side as "YES" | "NO" | undefined;
    const shareCount = body.shareCount;

    if (!action || (action !== "buy" && action !== "sell")) {
      return NextResponse.json(
        { error: "Invalid action. Must be buy or sell" },
        { status: 400 },
      );
    }

    if (!side || (side !== "YES" && side !== "NO")) {
      return NextResponse.json(
        { error: "Invalid side. Must be YES or NO" },
        { status: 400 },
      );
    }

    if (typeof shareCount !== "number" || !Number.isFinite(shareCount) || shareCount <= 0) {
      return NextResponse.json(
        { error: "Invalid shareCount. Must be a positive number" },
        { status: 400 },
      );
    }

    const [market] = await db
      .select({ id: markets.id })
      .from(markets)
      .where(eq(markets.slug, slug))
      .limit(1);

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    const result = await executeTrade({
      userId: session.user.id,
      marketId: market.id,
      action,
      side,
      shareCount,
    });

    if (!result.success) {
      const status =
        /not found/i.test(result.error) ? 404 :
        /unauthorized/i.test(result.error) ? 401 :
        /not open|closed/i.test(result.error) ? 409 :
        /insufficient/i.test(result.error) ? 409 :
        400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      trade: result.trade,
      wallet: result.wallet,
      position: result.position,
    });
  } catch (error) {
    if (isInvalidJsonBodyError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to execute trade" },
      { status: 500 },
    );
  }
}
