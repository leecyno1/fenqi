"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const toneClasses = {
  error: "border-[rgba(230,76,46,0.24)] bg-[rgba(230,76,46,0.1)] text-[var(--color-accent)]",
  success: "border-[rgba(108,159,204,0.28)] bg-[rgba(108,159,204,0.12)] text-[var(--color-secondary-deep)]",
  info: "border-white/70 bg-white/60 text-[var(--color-muted-ink)]",
} as const;

export function Alert({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.05rem] border px-3.5 py-2.5 text-[0.78rem] shadow-[0_8px_18px_rgba(31,39,55,0.04)] backdrop-blur-xl",
        toneClasses[tone],
        className,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
