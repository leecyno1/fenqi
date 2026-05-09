import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type IntroMetaItem = {
  label: string;
  value: string;
};

export function ShellPanel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "secondary" | "soft";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[var(--color-glass-line)] bg-[var(--color-accent-deep)] text-white shadow-[0_22px_48px_rgba(31,39,55,0.18)]"
      : tone === "secondary"
        ? "border-[rgba(230,76,46,0.18)] bg-[rgba(230,76,46,0.08)] shadow-[0_18px_34px_rgba(230,76,46,0.08)]"
        : tone === "soft"
          ? "border-[var(--color-glass-line)] bg-[var(--color-surface-soft)] shadow-[var(--shadow-card)] backdrop-blur-xl"
          : "border-[var(--color-glass-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] backdrop-blur-xl";

  return (
    <div className={cn("overflow-hidden rounded-[1.75rem] border", toneClass, className)}>
      {children}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: IntroMetaItem[];
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <ShellPanel className={cn("px-5 py-5 md:px-6 md:py-6", className)} tone="soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-4xl space-y-3">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-[var(--color-accent)]">{eyebrow}</p>
          <div className="space-y-2">
            <h1 className="font-display text-[1.95rem] leading-[0.98] tracking-[-0.03em] text-[var(--color-ink)] md:text-[3.15rem]">
              {title}
            </h1>
            <p className="max-w-3xl text-[0.9rem] leading-7 text-[color:var(--color-muted-ink)] md:text-[0.98rem]">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      {meta && meta.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          {meta.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="rounded-full border border-[var(--color-glass-line)] bg-[var(--color-chip)] px-3 py-1.5 text-[0.74rem] text-[var(--color-ink)] shadow-[0_8px_18px_rgba(31,39,55,0.05)]"
            >
              <span className="text-[color:var(--color-muted-ink)]">{item.label}</span>
              <span className="mx-2 inline-block h-1 w-1 rounded-full bg-[rgba(11,31,77,0.16)] align-middle" />
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      ) : null}
    </ShellPanel>
  );
}

export function DocumentScaffold({
  title,
  eyebrow,
  description,
  meta,
  sidebar,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  meta?: IntroMetaItem[];
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <PageIntro eyebrow={eyebrow} title={title} description={description} meta={meta} />
      <div className={cn("grid gap-4", sidebar ? "xl:grid-cols-[18rem_minmax(0,1fr)]" : "")}>
        {sidebar ? <aside className="space-y-4">{sidebar}</aside> : null}
        <div className="space-y-4">{children}</div>
      </div>
    </section>
  );
}
