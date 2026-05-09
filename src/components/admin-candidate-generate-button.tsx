"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminCandidateGenerateButton() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function generateCandidates() {
    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/admin/candidates/generate", {
      method: "POST",
    });
    const payload = (await response.json()) as {
      success?: boolean;
      inserted?: number;
      updated?: number;
      error?: string;
    };

    if (!response.ok) {
      setMessage(payload.error ?? "生成失败。");
      setIsSubmitting(false);
      return;
    }

    setMessage(`已生成：新增 ${payload.inserted ?? 0}，更新 ${payload.updated ?? 0}`);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={generateCandidates}
        className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-[0.82rem] font-medium text-white hover:bg-[var(--color-accent-deep)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "生成中" : "从新闻生成候选"}
      </button>
      {message ? <p className="max-w-[16rem] text-right text-[0.72rem] text-[color:var(--color-muted-ink)]">{message}</p> : null}
    </div>
  );
}
