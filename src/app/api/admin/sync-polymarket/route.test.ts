import { NextRequest } from "next/server";
import { describe, expect, it, beforeEach, vi } from "vitest";

const getOptionalSession = vi.fn();
const syncPolymarketCatalog = vi.fn();
const getPolymarketCatalogCoverage = vi.fn();
const runTrackedJob = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  getOptionalSession,
}));

vi.mock("@/lib/auth/guards", () => ({
  canAccessAdmin: (session: { role?: string } | null) => session?.role === "admin",
}));

vi.mock("@/lib/health", () => ({
  getPolymarketCatalogCoverage,
}));

vi.mock("@/lib/integrations/sync-polymarket", () => ({
  syncPolymarketCatalog,
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

describe("POST /api/admin/sync-polymarket", () => {
  beforeEach(() => {
    getOptionalSession.mockReset();
    syncPolymarketCatalog.mockReset();
    getPolymarketCatalogCoverage.mockReset();
    runTrackedJob.mockReset();
    runTrackedJob.mockImplementation(async (_jobName, handler) => handler());
    getPolymarketCatalogCoverage.mockResolvedValue({
      ok: true,
      minEvents: 100,
      minMarkets: 100,
      eventCount: 123,
      marketCount: 456,
    });
  });

  it("rejects anonymous requests", async () => {
    getOptionalSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/sync-polymarket", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("rejects non-admin sessions", async () => {
    getOptionalSession.mockResolvedValue({ userId: "u1", role: "user" });

    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/sync-polymarket", { method: "POST" }));

    expect(response.status).toBe(403);
  });

  it("syncs Polymarket catalog and returns coverage for admins", async () => {
    getOptionalSession.mockResolvedValue({ userId: "admin_1", role: "admin" });
    syncPolymarketCatalog.mockResolvedValue({ inserted: 100, updated: 23, skipped: 0 });

    const { POST } = await import("./route");
    const response = await POST(new NextRequest("http://localhost:3000/api/admin/sync-polymarket", { method: "POST" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      inserted: 100,
      updated: 23,
      skipped: 0,
      catalog: {
        ok: true,
        eventCount: 123,
        marketCount: 456,
      },
    });
  });
});
