import { ArrowUpRight, Gauge, Radar, Trophy } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { getLeaderboardEntries } from "@/lib/data/queries";
import { formatPercent, formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboardEntries();
  const topThree = leaderboard.slice(0, 3);
  const avgHitRate =
    leaderboard.length > 0
      ? leaderboard.reduce((sum, entry) => sum + entry.hitRate, 0) / leaderboard.length
      : 0;
  const totalScore = leaderboard.reduce((sum, entry) => sum + entry.score, 0);

  return (
    <SiteShell currentPath="/leaderboard" hideHero>
      <section className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-accent-deep)] p-5 text-white shadow-[0_18px_38px_rgba(11,31,77,0.18)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-white/60">榜单状态</p>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/8">
                <Radar className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 grid gap-2.5 md:grid-cols-3">
              {[
                ["上榜人数", `${leaderboard.length} 人`, Gauge],
                ["平均命中率", formatPercent(avgHitRate), Trophy],
                ["累计积分池", formatPoints(totalScore), Radar],
              ].map(([label, value, Icon]) => {
                const Component = Icon as typeof Gauge;

                return (
                  <div key={label as string} className="rounded-[1rem] border border-white/12 bg-white/8 px-3.5 py-3">
                    <Component className="h-4 w-4 text-[var(--color-gold)]" />
                    <p className="mt-3 text-[0.58rem] uppercase tracking-[0.24em] text-white/56">
                      {label as string}
                    </p>
                    <p className="mt-1.5 text-[1.2rem] font-semibold">{value as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
            {topThree.map((entry, index) => {
              const tone =
                index === 0
                  ? "bg-[var(--color-accent)] text-white border-[rgba(29,78,216,0.22)]"
                  : index === 1
                    ? "bg-white text-[var(--color-ink)] border-[rgba(198,40,40,0.28)]"
                    : "bg-white text-[var(--color-ink)] border-[var(--color-line)]";
              const muted = index === 0 ? "text-white/72" : "text-[color:var(--color-muted-ink)]";

              return (
                <div
                  key={entry.rank}
                  className={`rounded-[1.35rem] border px-4 py-4 shadow-[0_12px_26px_rgba(11,31,77,0.08)] ${tone}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-display text-[0.8rem] ${muted}`}>#{entry.rank}</p>
                      <p className="mt-1 text-[1.05rem] font-semibold leading-5">{entry.name}</p>
                    </div>
                    <div className="rounded-full border border-current/12 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.2em]">
                      Top {entry.rank}
                    </div>
                  </div>
                  <p className={`mt-2 text-[0.76rem] leading-5 ${muted}`}>{entry.title}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[0.72rem]">
                    <div>
                      <p className={muted}>命中率</p>
                      <p className="mt-1 font-semibold">{formatPercent(entry.hitRate)}</p>
                    </div>
                    <div>
                      <p className={muted}>月增量</p>
                      <p className="mt-1 font-semibold">+{formatPoints(entry.monthlyGain)}</p>
                    </div>
                    <div>
                      <p className={muted}>积分</p>
                      <p className="mt-1 font-semibold">{formatPoints(entry.score)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-black/10 text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">
                <tr>
                  <th className="pb-3 pr-3">排名</th>
                  <th className="pb-3 pr-3">名称</th>
                  <th className="pb-3 pr-3">风格</th>
                  <th className="pb-3 pr-3">累计积分</th>
                  <th className="pb-3 pr-3">命中率</th>
                  <th className="pb-3 pr-3">月度增长</th>
                  <th className="pb-3">信号</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-b border-black/8 last:border-b-0">
                    <td className="py-3.5 pr-3">
                      <span className="inline-flex rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--color-ink)]">
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <p className="text-[0.92rem] font-medium text-[var(--color-ink)]">{entry.name}</p>
                    </td>
                    <td className="py-3.5 pr-3 text-[0.8rem] text-[color:var(--color-muted-ink)]">{entry.title}</td>
                    <td className="py-3.5 pr-3 text-[0.82rem] text-[color:var(--color-muted-ink)]">{formatPoints(entry.score)}</td>
                    <td className="py-3.5 pr-3 text-[0.82rem] text-[color:var(--color-muted-ink)]">{formatPercent(entry.hitRate)}</td>
                    <td className="py-3.5 pr-3 text-[0.82rem] font-medium text-[var(--color-accent)]">+{formatPoints(entry.monthlyGain)}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(198,40,40,0.24)] bg-white px-2.5 py-1 text-[0.68rem] text-[var(--color-secondary-deep)]">
                        增量领先 <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
