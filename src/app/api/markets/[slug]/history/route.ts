import { NextRequest, NextResponse } from "next/server";

import { getMarketPriceHistory, type PriceHistoryPeriod } from "@/lib/data/queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get("period") || "7d") as PriceHistoryPeriod;

    // Validate period
    const validPeriods: PriceHistoryPeriod[] = ["24h", "7d", "30d", "all"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: "Invalid period. Must be one of: 24h, 7d, 30d, all" },
        { status: 400 },
      );
    }

    const history = await getMarketPriceHistory(slug, period);

    if (!history) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json({
      slug,
      period,
      data: history.map((point) => ({
        timestamp: point.timestamp.toISOString(),
        yesProbability: point.yesProbability,
        noProbability: point.noProbability,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch price history:", error);
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 },
    );
  }
}
