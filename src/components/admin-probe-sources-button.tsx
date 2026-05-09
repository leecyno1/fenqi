"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function AdminProbeSourcesButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function probeSources() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/probe-sources", {
      method: "POST",
    });
    const payload = (await response.json()) as {
      success?: boolean;
      ok?: boolean;
      stale?: boolean;
      error?: string;
    };

    if (!response.ok) {
      setMessage(payload.error ?? "探测失败。");
      setIsSubmitting(false);
      return;
    }

    setMessage(payload.ok ? "源状态已更新。" : "源状态已更新，但仍存在异常。" );
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={probeSources}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-[0.82rem] font-medium text-[var(--color-ink)] hover:border-[rgba(29,78,216,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {isSubmitting ? "探测中" : "立即探测源"}
      </button>
      {message ? <p className="max-w-[16rem] text-right text-[0.72rem] text-[color:var(--color-muted-ink)]">{message}</p> : null}
    </div>
  );
}
