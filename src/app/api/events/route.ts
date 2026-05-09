import { NextResponse } from "next/server";

import { searchEventListItems } from "@/lib/data/queries";

export async function GET() {
  return NextResponse.json({ events: await searchEventListItems("") });
}
