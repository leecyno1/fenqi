import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const canAccessAdmin = vi.fn();
const getOptionalSession = vi.fn();
const parseAdminResolutionInput = vi.fn();
const resolveMarket = vi.fn();
const applyRateLimit = vi.fn();

vi.mock("@/lib/auth/guards", () => ({
  canAccessAdmin,
}));

vi.mock("@/lib/auth/session", () => ({
  getOptionalSession,
}));

vi.mock("@/lib/admin/market-resolution", () => ({
  parseAdminResolutionInput,
}));

vi.mock("@/lib/admin/resolve-market", () => ({
  resolveMarket,
}));

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit,
}));

describe("POST /api/admin/markets/[id]/resolve", () => {
  beforeEach(() => {
    canAccessAdmin.mockReset();
    getOptionalSession.mockReset();
    parseAdminResolutionInput.mockReset();
    resolveMarket.mockReset();
    applyRateLimit.mockReset();
    applyRateLimit.mockResolvedValue(null);
  });

  it("returns 401 for anonymous requests", async () => {
    getOptionalSession.mockResolvedValue(null);

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/markets/mkt/resolve", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "mkt" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication required.",
    });
  });

  it("returns 403 for non-admin sessions", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "user_1",
      role: "user",
      name: "北岸观察",
      email: "analyst@pulse.local",
    });
    canAccessAdmin.mockReturnValue(false);

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/markets/mkt/resolve", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "mkt" }) },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Admin access required.",
    });
  });

  it("maps domain not found errors to 404", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "admin_1",
      role: "admin",
      name: "Admin",
      email: "admin@pulse.local",
    });
    canAccessAdmin.mockReturnValue(true);
    parseAdminResolutionInput.mockReturnValue({
      outcome: "YES",
      sourceLabel: "IDC",
      sourceUrl: "https://example.com/idc",
      rationale: "resolution source",
    });
    resolveMarket.mockRejectedValue(new Error("Market not found."));

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/markets/missing/resolve", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
  });

  it("maps settlement conflicts to 409", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "admin_1",
      role: "admin",
      name: "Admin",
      email: "admin@pulse.local",
    });
    canAccessAdmin.mockReturnValue(true);
    parseAdminResolutionInput.mockReturnValue({
      outcome: "VOID",
      sourceLabel: "IDC",
      sourceUrl: "https://example.com/idc",
      rationale: "resolution source",
    });
    resolveMarket.mockRejectedValue(new Error("Market is already settled."));

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/markets/mkt/resolve", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "mkt" }) },
    );

    expect(response.status).toBe(409);
  });

  it("returns the settlement payload on success", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "admin_1",
      role: "admin",
      name: "Admin",
      email: "admin@pulse.local",
    });
    canAccessAdmin.mockReturnValue(true);
    parseAdminResolutionInput.mockReturnValue({
      outcome: "NO",
      sourceLabel: "Counterpoint",
      sourceUrl: "https://example.com/counterpoint",
      rationale: "final result",
    });
    resolveMarket.mockResolvedValue({
      success: true,
      marketId: "mkt",
      outcome: "NO",
      settledPositions: 2,
      affectedWallets: 2,
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost:3000/api/admin/markets/mkt/resolve", {
        method: "POST",
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "mkt" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      marketId: "mkt",
      outcome: "NO",
      settledPositions: 2,
      affectedWallets: 2,
    });
    expect(resolveMarket).toHaveBeenCalledWith({
      marketId: "mkt",
      resolvedBy: "admin_1",
      outcome: "NO",
      sourceLabel: "Counterpoint",
      sourceUrl: "https://example.com/counterpoint",
      rationale: "final result",
    });
  });
});
