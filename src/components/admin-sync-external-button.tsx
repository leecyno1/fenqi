"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

type SyncResponse = {
  success?: boolean;
  inserted?: number;
  updated?: number;
  skipped?: number;
  catalog?: {
    ok: boolean;
    minEvents: number;
    minMarkets: number;
    eventCount: number;
    marketCount: number;
  };
  error?: string;
};

export function AdminSyncExternalButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function syncCatalog() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/sync-polymarket", {
      method: "POST",
    });
    const payload = (await response.json()) as SyncResponse;

    if (!response.ok) {
      setMessage(payload.error ?? "同步失败。");
      setIsSubmitting(false);
      return;
    }

    const catalog = payload.catalog;
    if (catalog) {
      setMessage(
        catalog.ok
          ? `同步完成：事件 ${catalog.eventCount} / 盘口 ${catalog.marketCount}。`
          : `同步完成但未达标：事件 ${catalog.eventCount}/${catalog.minEvents}，盘口 ${catalog.marketCount}/${catalog.minMarkets}。`,
      );
    } else {
      setMessage("同步完成。");
    }
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={syncCatalog}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-[0.82rem] font-medium text-[var(--color-ink)] hover:border-[rgba(29,78,216,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {isSubmitting ? "同步中" : "立即同步"}
      </button>
      {message ? <p className="max-w-[16rem] text-right text-[0.72rem] text-[color:var(--color-muted-ink)]">{message}</p> : null}
    </div>
  );
}
