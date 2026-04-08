import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getQuoteForMarketSlug = vi.fn();

vi.mock("@/lib/data/queries", () => ({
  getQuoteForMarketSlug,
}));

describe("GET /api/markets/[slug]/quote", () => {
  beforeEach(() => {
    getQuoteForMarketSlug.mockReset();
  });

  it("returns a flattened quote contract for buy orders", async () => {
    getQuoteForMarketSlug.mockResolvedValue({
      action: "buy",
      side: "YES",
      shareCount: 12,
      amount: 641,
      averagePrice: 53.4,
    });

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/markets/test/quote?action=buy&side=YES&shareCount=12"),
      { params: Promise.resolve({ slug: "test" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      action: "buy",
      side: "YES",
      shareCount: 12,
      amount: 641,
      averagePrice: 53.4,
    });
    expect(getQuoteForMarketSlug).toHaveBeenCalledWith("test", "buy", "YES", 12);
  });

  it("rejects unsupported quote actions", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/markets/test/quote?action=hold&side=YES&shareCount=12"),
      { params: Promise.resolve({ slug: "test" }) },
    );

    expect(response.status).toBe(400);
  });
});
