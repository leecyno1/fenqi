import { NextRequest, NextResponse } from "next/server";

import { searchEventListItems } from "@/lib/data/queries";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json({ events: await searchEventListItems(query) });
}
