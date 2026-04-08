import { cn } from "@/lib/utils";

export function ProbabilityBar({
  yes,
  no,
  className,
}: {
  yes: number;
  no: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-full border border-[var(--color-line)] bg-[color:var(--color-paper-soft)]",
        className,
      )}
    >
      <div className="flex h-3 w-full">
        <div className="bg-[var(--color-accent)] transition-all" style={{ width: `${yes * 100}%` }} />
        <div className="bg-[var(--color-secondary)] transition-all" style={{ width: `${no * 100}%` }} />
      </div>
    </div>
  );
}
