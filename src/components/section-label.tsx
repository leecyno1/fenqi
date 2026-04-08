import { cn } from "@/lib/utils";

export function SectionLabel({
  kicker,
  title,
  description,
  className,
}: {
  kicker: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-accent)]">
        {kicker}
      </p>
      <div className="space-y-2">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted-ink)] md:text-base">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
