import { describe, expect, it } from "vitest";

import { parseAdminResolutionInput } from "./market-resolution";

describe("parseAdminResolutionInput", () => {
  it("accepts a valid resolution payload", () => {
    expect(
      parseAdminResolutionInput({
        outcome: "YES",
        sourceLabel: "国家统计局",
        sourceUrl: "https://example.com/source",
        rationale: "依据公开披露数据完成结算。",
      }),
    ).toEqual({
      outcome: "YES",
      sourceLabel: "国家统计局",
      sourceUrl: "https://example.com/source",
      rationale: "依据公开披露数据完成结算。",
    });
  });

  it("rejects unsupported outcomes", () => {
    expect(() =>
      parseAdminResolutionInput({
        outcome: "MAYBE",
        sourceLabel: "国家统计局",
        sourceUrl: "https://example.com/source",
      }),
    ).toThrow(/invalid/i);
  });

  it("rejects invalid source urls", () => {
    expect(() =>
      parseAdminResolutionInput({
        outcome: "VOID",
        sourceLabel: "国家统计局",
        sourceUrl: "not-a-url",
      }),
    ).toThrow(/url/i);
  });
});
