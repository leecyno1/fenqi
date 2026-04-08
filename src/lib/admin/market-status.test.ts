import { describe, expect, it } from "vitest";

import { parseAdminMarketStatusInput } from "./market-status";

describe("parseAdminMarketStatusInput", () => {
  it("accepts valid market status updates", () => {
    expect(parseAdminMarketStatusInput({ status: "live" })).toEqual({ status: "live" });
    expect(parseAdminMarketStatusInput({ status: "locked" })).toEqual({ status: "locked" });
  });

  it("rejects invalid market status values", () => {
    expect(() => parseAdminMarketStatusInput({ status: "archived" })).toThrow(/invalid/i);
    expect(() => parseAdminMarketStatusInput({ status: "resolved" })).toThrow(/invalid/i);
  });
});
