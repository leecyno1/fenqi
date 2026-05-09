import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const runPolymarketSourceProbe = vi.fn();
const runTrackedJob = vi.fn();

vi.mock("@/lib/integrations/probe-polymarket-sources", () => ({
  runPolymarketSourceProbe,
}));

vi.mock("@/lib/jobs", () => ({
  runTrackedJob,
}));

describe("POST /api/cron/probe-polymarket-sources", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
    runPolymarketSourceProbe.mockReset();
    runTrackedJob.mockReset();
    runTrackedJob.mockImplementation(async (_jobName, handler) => handler());
  });

  it("rejects unauthorized requests", async () => {
    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/cron/probe-polymarket-sources", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("records source probe summaries", async () => {
    runPolymarketSourceProbe.mockResolvedValue({
      ok: false,
      stale: false,
      maxAgeMinutes: 10,
      timestamp: "2026-05-05T09:00:00.000Z",
      sources: [
        {
          name: "polymarket-gamma",
          label: "Polymarket Gamma",
          role: "事件目录发现",
          url: "https://gamma-api.polymarket.com/events",
          status: "error",
          checkedAt: "2026-05-05T09:00:00.000Z",
          latencyMs: 3000,
          httpStatus: null,
          error: "timeout",
        },
        {
          name: "polymarket-clob",
          label: "Polymarket CLOB",
          role: "盘口价格读取",
          url: "https://clob.polymarket.com/ok",
          status: "ok",
          checkedAt: "2026-05-05T09:00:00.000Z",
          latencyMs: 120,
          httpStatus: 200,
          error: null,
        },
      ],
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/cron/probe-polymarket-sources", {
        method: "POST",
        headers: { authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(runTrackedJob).toHaveBeenCalledWith("probe-polymarket-sources", expect.any(Function), expect.any(Function));
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      ok: false,
      stale: false,
      sources: [{ name: "polymarket-gamma", status: "error" }, { name: "polymarket-clob", status: "ok" }],
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalSecret;
  });
});
