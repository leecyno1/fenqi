"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDeleteMarketButton({
  marketId,
  canDelete,
  reason,
}: {
  marketId: string;
  canDelete: boolean;
  reason?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    if (!canDelete) {
      setErrorMessage(reason ?? "当前市场暂时不能删除。");
      return;
    }

    const confirmed = window.confirm("删除后无法恢复。确认删除这个市场吗？");

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    const response = await fetch(`/api/admin/markets/${marketId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setErrorMessage(payload.error ?? "删除市场失败。");
      setIsSubmitting(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={handleDelete}
        className="rounded-full border border-[rgba(198,40,40,0.28)] bg-[rgba(198,40,40,0.08)] px-5 py-3 text-sm font-medium text-[var(--color-secondary)] transition hover:bg-[rgba(198,40,40,0.14)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "删除中..." : "删除市场"}
      </button>
      {reason && !errorMessage ? (
        <p className="text-sm leading-7 text-[color:var(--color-muted-ink)]">{reason}</p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm leading-7 text-[var(--color-secondary)]">{errorMessage}</p>
      ) : null}
    </div>
  );
}
