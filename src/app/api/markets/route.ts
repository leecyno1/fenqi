import { NextResponse } from "next/server";

import { getMarketListItems } from "@/lib/data/queries";

export async function GET() {
  return NextResponse.json({ markets: await getMarketListItems() });
}
