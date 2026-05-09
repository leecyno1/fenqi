import { NextRequest, NextResponse } from "next/server";

import { getTopicEventListItems } from "@/lib/data/queries";
import type { MarketTopicKey } from "@/lib/data/views";

const topicKeys = new Set(["politics", "world", "sports", "crypto", "finance", "tech", "culture"]);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!topicKeys.has(slug)) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  }

  return NextResponse.json({ events: await getTopicEventListItems(slug as MarketTopicKey) });
}
