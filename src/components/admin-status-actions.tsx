"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { quickStatusOptions } from "@/lib/admin/market-status";

const statusLabels = {
  draft: "草稿",
  review: "待审核",
  live: "进行中",
  locked: "锁盘中",
  resolved: "已结算",
  voided: "已作废",
} as const;

export function AdminStatusActions({
  marketId,
  currentStatus,
}: {
  marketId: string;
  currentStatus: keyof typeof statusLabels;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isTerminal = currentStatus === "resolved" || currentStatus === "voided";

  async function updateStatus(status: keyof typeof statusLabels) {
    if (status === currentStatus) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const response = await fetch(`/api/admin/markets/${marketId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "状态更新失败。");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {isTerminal ? (
        <p className="text-[11px] text-[color:var(--color-muted-ink)]">终态市场仅可通过结算记录查看</p>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          {quickStatusOptions.map((status) => (
            <button
              key={status}
              type="button"
              disabled={isSubmitting || status === currentStatus}
              onClick={() => updateStatus(status)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                status === currentStatus
                  ? "bg-black text-white"
                  : "border border-black/10 bg-white text-[var(--color-ink)] hover:border-black/20"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {statusLabels[status]}
            </button>
          ))}
        </div>
      )}
      {errorMessage ? (
        <p className="text-[11px] text-[var(--color-secondary)]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
