import { describe, expect, it } from "vitest";

import { buildInitialWalletArtifacts, INITIAL_CREDITS } from "./bootstrap";

describe("wallet bootstrap artifacts", () => {
  it("creates a wallet and bootstrap ledger entry for new users", () => {
    const now = new Date("2026-04-04T10:00:00.000Z");

    const artifacts = buildInitialWalletArtifacts({
      userId: "user_123",
      now,
    });

    expect(artifacts.wallet.userId).toBe("user_123");
    expect(artifacts.wallet.balance).toBe(INITIAL_CREDITS);
    expect(artifacts.wallet.lifetimePnL).toBe(0);
    expect(artifacts.ledger.amount).toBe(INITIAL_CREDITS);
    expect(artifacts.ledger.balanceAfter).toBe(INITIAL_CREDITS);
    expect(artifacts.ledger.entryType).toBe("bootstrap_grant");
    expect(artifacts.ledger.memo).toContain("初始积分");
    expect(artifacts.wallet.createdAt).toEqual(now);
    expect(artifacts.ledger.createdAt).toEqual(now);
  });
});
