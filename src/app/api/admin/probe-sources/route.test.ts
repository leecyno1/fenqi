import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const runPolymarketSourceProbe = vi.fn();
const runTrackedJob = vi.fn();
const getOptionalSession = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getOptionalSession,
}));

vi.mock("@/lib/auth/guards", () => ({
  canAccessAdmin: (session: { role?: string } | null) => session?.role === "admin",
}));

vi.mock("@/lib/integrations/probe-polymarket-sources", () => ({
  runPolymarketSourceProbe,
}));

vi.mock("@/lib/jobs", () => ({
  runTrackedJob,
}));

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/request-integrity", () => ({
  enforceTrustedWriteOrigin: () => null,
}));

describe("POST /api/admin/probe-sources", () => {
  beforeEach(() => {
    getOptionalSession.mockReset();
    runPolymarketSourceProbe.mockReset();
    runTrackedJob.mockReset();
    runTrackedJob.mockImplementation(async (_jobName, handler) => handler());
  });

  it("rejects anonymous requests", async () => {
    getOptionalSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/probe-sources", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("rejects non-admin sessions", async () => {
    getOptionalSession.mockResolvedValue({ userId: "u1", role: "user" });

    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/probe-sources", { method: "POST" }));

    expect(response.status).toBe(403);
  });

  it("returns source probe results for admins", async () => {
    getOptionalSession.mockResolvedValue({ userId: "admin_1", role: "admin" });
    runPolymarketSourceProbe.mockResolvedValue({
      ok: true,
      stale: false,
      timestamp: "2026-05-05T10:00:00.000Z",
      maxAgeMinutes: 10,
      sources: [
        {
          name: "polymarket-gamma",
          label: "Polymarket Gamma",
          role: "事件目录发现",
          url: "https://gamma-api.polymarket.com/events",
          status: "ok",
          checkedAt: "2026-05-05T10:00:00.000Z",
          latencyMs: 120,
          httpStatus: 200,
          error: null,
        },
        {
          name: "polymarket-clob",
          label: "Polymarket CLOB",
          role: "盘口价格读取",
          url: "https://clob.polymarket.com/ok",
          status: "ok",
          checkedAt: "2026-05-05T10:00:00.000Z",
          latencyMs: 132,
          httpStatus: 200,
          error: null,
        },
      ],
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/probe-sources", {
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      ok: true,
      sources: [{ status: "ok" }, { status: "ok" }],
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });
});
