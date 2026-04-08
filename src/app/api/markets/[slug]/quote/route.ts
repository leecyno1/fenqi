import { NextRequest, NextResponse } from "next/server";

import { getQuoteForMarketSlug } from "@/lib/data/queries";
import type { MarketSide } from "@/lib/markets/lmsr";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action") ?? "buy";
  const side = (searchParams.get("side") ?? "YES") as MarketSide;
  const shareCount = Number(searchParams.get("shareCount") ?? 12);

  if (
    (action !== "buy" && action !== "sell") ||
    (side !== "YES" && side !== "NO") ||
    Number.isNaN(shareCount) ||
    shareCount <= 0
  ) {
    return NextResponse.json({ error: "Invalid quote params." }, { status: 400 });
  }

  const quote = await getQuoteForMarketSlug(slug, action, side, shareCount);

  if (!quote) {
    return NextResponse.json({ error: "Market not found." }, { status: 404 });
  }

  return NextResponse.json(quote);
}
