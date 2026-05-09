"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCandidateActions({ marketId }: { marketId: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function updateStatus(status: "draft" | "live") {
    setIsSubmitting(true);
    setErrorMessage("");

    const response = await fetch(`/api/admin/markets/${marketId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "操作失败。");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => updateStatus("live")}
          className="rounded-full bg-[var(--color-accent)] px-3 py-2 text-[0.74rem] font-medium text-white hover:bg-[var(--color-accent-deep)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          发布
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => updateStatus("draft")}
          className="rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-[0.74rem] text-[var(--color-ink)] hover:border-[rgba(198,40,40,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          退回
        </button>
      </div>
      {errorMessage ? <p className="text-[0.7rem] text-[var(--color-secondary)]">{errorMessage}</p> : null}
    </div>
  );
}
