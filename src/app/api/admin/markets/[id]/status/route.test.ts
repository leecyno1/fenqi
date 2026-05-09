import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const canAccessAdmin = vi.fn();
const getOptionalSession = vi.fn();
const parseAdminMarketStatusInput = vi.fn();
const applyRateLimit = vi.fn();
const enforceTrustedWriteOrigin = vi.fn();
const selectLimit = vi.fn();
const updateEventWhere = vi.fn();
const updateMarketReturning = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/auth/guards", () => ({
  canAccessAdmin,
}));

vi.mock("@/lib/auth/session", () => ({
  getOptionalSession,
}));

vi.mock("@/lib/admin/market-status", () => ({
  parseAdminMarketStatusInput,
}));

vi.mock("@/lib/rate-limit", () => ({
  applyRateLimit,
}));

vi.mock("@/lib/request-integrity", () => ({
  enforceTrustedWriteOrigin,
}));

vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: selectLimit,
        }),
      }),
    }),
    transaction,
  },
}));

vi.mock("@/db/schema", () => ({
  marketEvents: {
    id: "market_event.id",
    externalSource: "market_event.external_source",
    updatedAt: "market_event.updated_at",
  },
  markets: {
    id: "market.id",
    eventId: "market.event_id",
    externalSource: "market.external_source",
    status: "market.status",
    updatedAt: "market.updated_at",
  },
}));

describe("PATCH /api/admin/markets/[id]/status", () => {
  beforeEach(() => {
    vi.resetModules();
    canAccessAdmin.mockReset();
    getOptionalSession.mockReset();
    parseAdminMarketStatusInput.mockReset();
    applyRateLimit.mockReset();
    enforceTrustedWriteOrigin.mockReset();
    selectLimit.mockReset();
    updateEventWhere.mockReset();
    updateMarketReturning.mockReset();
    transaction.mockReset();
    applyRateLimit.mockResolvedValue(null);
    enforceTrustedWriteOrigin.mockReturnValue(null);
  });

  it("publishes news report candidates as public cn_news events", async () => {
    getOptionalSession.mockResolvedValue({
      userId: "admin_1",
      role: "admin",
      name: "Admin",
      email: "admin@example.com",
    });
    canAccessAdmin.mockReturnValue(true);
    parseAdminMarketStatusInput.mockReturnValue({ status: "live" });
    selectLimit.mockResolvedValue([
      {
        id: "mkt_news",
        eventId: "evt_news",
        externalSource: "news_report",
        status: "review",
      },
    ]);
    updateMarketReturning.mockResolvedValue([
      {
        id: "mkt_news",
        status: "live",
        externalSource: "cn_news",
      },
    ]);
    transaction.mockImplementation(async (callback) => callback({
      update: (table: unknown) => ({
        set: (values: unknown) => ({
          where: (condition: unknown) => {
            if (table && String((table as { id?: unknown }).id).includes("market_event")) {
              updateEventWhere({ values, condition });
              return Promise.resolve([]);
            }
            return {
              returning: (fields: unknown) => {
                updateMarketReturning({ values, condition, fields });
                return updateMarketReturning();
              },
            };
          },
        }),
      }),
    }));

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new NextRequest("http://localhost:3000/api/admin/markets/mkt_news/status", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "live" }),
      }),
      { params: Promise.resolve({ id: "mkt_news" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      market: {
        id: "mkt_news",
        status: "live",
        externalSource: "cn_news",
      },
    });
    expect(updateEventWhere).toHaveBeenCalledWith(expect.objectContaining({
      values: expect.objectContaining({ externalSource: "cn_news" }),
    }));
    expect(updateMarketReturning).toHaveBeenCalledWith(expect.objectContaining({
      values: expect.objectContaining({
        status: "live",
        externalSource: "cn_news",
      }),
    }));
  });
});
