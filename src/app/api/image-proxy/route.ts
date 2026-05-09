import { NextRequest, NextResponse } from "next/server";

import { isAllowedImageProxyUrl } from "@/lib/image-proxy";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function unavailableResponse() {
  return NextResponse.json({ error: "Image source unavailable." }, { status: 502 });
}

export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get("url")?.trim();

  if (!imageUrl || !isAllowedImageProxyUrl(imageUrl)) {
    return NextResponse.json({ error: "Invalid image URL." }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(imageUrl, {
      headers: { "user-agent": "fenqi-image-proxy/1.0" },
      cache: "force-cache",
      next: { revalidate: 6 * 60 * 60 },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return unavailableResponse();
  }

  if (!response.ok) {
    return unavailableResponse();
  }

  const contentType = response.headers.get("content-type")?.split(";")[0]?.toLowerCase() ?? "";
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 415 });
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large." }, { status: 413 });
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await response.arrayBuffer();
  } catch {
    return unavailableResponse();
  }

  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "Image too large." }, { status: 413 });
  }

  return new Response(buffer, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=21600, stale-while-revalidate=86400",
    },
  });
}
