import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/image-proxy", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("rejects unsupported image sources", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/api/image-proxy?url=https%3A%2F%2Fevil.example%2Fimage.jpg"),
    );

    expect(response.status).toBe(400);
  });

  it("returns 502 instead of throwing when upstream fetch fails", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("timeout");
    }) as typeof fetch;

    const response = await GET(
      new NextRequest("http://localhost:3000/api/image-proxy?url=https%3A%2F%2Fstatic.reuters.com%2Fimage.jpg"),
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ error: "Image source unavailable." });
  });

  it("streams allowed image responses", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/jpeg", "content-length": "3" },
      }),
    ) as typeof fetch;

    const response = await GET(
      new NextRequest("http://localhost:3000/api/image-proxy?url=https%3A%2F%2Fstatic.reuters.com%2Fimage.jpg"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
});
