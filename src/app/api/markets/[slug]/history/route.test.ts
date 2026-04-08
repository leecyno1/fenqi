import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMarketPriceHistory = vi.fn();

vi.mock("@/lib/data/queries", () => ({
  getMarketPriceHistory,
}));

describe("GET /api/markets/[slug]/history", () => {
  beforeEach(() => {
    getMarketPriceHistory.mockReset();
  });

  it("returns a 404 when the market slug does not exist", async () => {
    getMarketPriceHistory.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/markets/missing/history?period=7d"),
      { params: Promise.resolve({ slug: "missing" }) },
    );

    expect(response.status).toBe(404);
  });

  it("returns serialized history points for valid markets", async () => {
    getMarketPriceHistory.mockResolvedValue([
      {
        timestamp: new Date("2026-04-05T00:00:00.000Z"),
        yesProbability: 0.61,
        noProbability: 0.39,
      },
    ]);

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost:3000/api/markets/valid/history?period=7d"),
      { params: Promise.resolve({ slug: "valid" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      slug: "valid",
      period: "7d",
      data: [
        {
          timestamp: "2026-04-05T00:00:00.000Z",
          yesProbability: 0.61,
          noProbability: 0.39,
        },
      ],
    });
  });
});
