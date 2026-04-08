import { formatNumber } from "@/lib/format";

type MarketDepthBarProps = {
  yesShares: number;
  noShares: number;
};

export function MarketDepthBar({ yesShares, noShares }: MarketDepthBarProps) {
  const total = yesShares + noShares;
  const yesPercent = total > 0 ? (yesShares / total) * 100 : 50;
  const noPercent = total > 0 ? (noShares / total) * 100 : 50;

  return (
    <div className="space-y-2">
      <div className="flex h-12 overflow-hidden rounded-lg">
        <div
          className="flex items-center justify-end bg-[var(--color-accent)] px-3 transition-all"
          style={{ width: `${yesPercent}%` }}
        >
          <span className="text-sm font-medium text-white">YES</span>
        </div>
        <div
          className="flex items-center justify-start bg-[var(--color-secondary)] px-3 transition-all"
          style={{ width: `${noPercent}%` }}
        >
          <span className="text-sm font-medium text-white">NO</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--color-muted-ink)]">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
          <span>
            {formatNumber(yesShares)} 份 ({yesPercent.toFixed(1)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            {formatNumber(noShares)} 份 ({noPercent.toFixed(1)}%)
          </span>
          <div className="h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
        </div>
      </div>
    </div>
  );
}
