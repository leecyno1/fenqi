import { randomUUID } from "node:crypto";

export const INITIAL_CREDITS = 100;

export function buildInitialWalletArtifacts({
  userId,
  now = new Date(),
}: {
  userId: string;
  now?: Date;
}) {
  const walletId = randomUUID();

  return {
    wallet: {
      id: walletId,
      userId,
      balance: INITIAL_CREDITS,
      lifetimePnL: 0,
      createdAt: now,
      updatedAt: now,
    },
    ledger: {
      id: randomUUID(),
      walletId,
      marketId: null,
      entryType: "bootstrap_grant" as const,
      amount: INITIAL_CREDITS,
      balanceAfter: INITIAL_CREDITS,
      memo: "新用户初始积分发放",
      createdAt: now,
    },
  };
}
