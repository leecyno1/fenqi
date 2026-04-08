import { describe, expect, it } from "vitest";

import { canAccessAdmin, canAccessPortfolio } from "./guards";

describe("access guards", () => {
  it("allows portfolio access only for authenticated users", () => {
    expect(canAccessPortfolio(null)).toBe(false);
    expect(
      canAccessPortfolio({ userId: "u1", role: "user", emailVerified: true }),
    ).toBe(true);
  });

  it("allows admin access only for admin role", () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(
      canAccessAdmin({ userId: "u1", role: "user", emailVerified: true }),
    ).toBe(false);
    expect(
      canAccessAdmin({ userId: "u2", role: "admin", emailVerified: true }),
    ).toBe(true);
  });
});
