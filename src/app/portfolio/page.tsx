import { SiteShell } from "@/components/site-shell";
import { PageIntro, ShellPanel } from "@/components/shell-panel";
import { requirePortfolioSession } from "@/lib/auth/session";
import { getPortfolioView } from "@/lib/data/queries";
import { formatPercent, formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const session = await requirePortfolioSession();
  const portfolio = await getPortfolioView(session.userId);

  if (!portfolio) {
    return (
      <SiteShell currentPath="/portfolio" hideHero>
        <ShellPanel className="p-8 text-sm text-[color:var(--color-muted-ink)]" tone="soft">
          当前没有可展示的组合数据。
        </ShellPanel>
      </SiteShell>
    );
  }

  const winningPositions = portfolio.holdings.filter((position) => position.pnl >= 0).length;
  const trackedMarkets = new Set(portfolio.holdings.map((position) => position.marketSlug)).size;

  return (
    <SiteShell currentPath="/portfolio" hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Portfolio"
          title="组合面板"
          description="组合页不再只是余额和一张表，而是把账户体量、持仓分布、浮盈亏状态与当前暴露统一放到一个完成度更高的视图里。"
          meta={[
            { label: "持仓行数", value: `${portfolio.holdings.length} 条` },
            { label: "覆盖市场", value: `${trackedMarkets} 个` },
            { label: "盈利持仓", value: `${winningPositions} 条` },
          ]}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ["账户总积分", formatPoints(portfolio.user.credits), "accent"],
            ["可用积分", formatPoints(portfolio.user.availableCredits), "default"],
            [
              "持仓浮盈亏",
              `${portfolio.summary.openPnl >= 0 ? "+" : ""}${formatPoints(portfolio.summary.openPnl)}`,
              portfolio.summary.openPnl >= 0 ? "default" : "secondary",
            ],
            ["已实现收益", formatPoints(portfolio.summary.realizedPnl), "default"],
            ["已结算收益", formatPoints(portfolio.summary.resolvedPnl), "default"],
          ].map(([label, value, tone]) => (
            <ShellPanel
              key={label as string}
              className="p-5"
              tone={tone === "accent" ? "accent" : tone === "secondary" ? "secondary" : "default"}
            >
              <p className={tone === "accent" ? "text-[0.68rem] uppercase tracking-[0.28em] text-white/70" : "text-[0.68rem] uppercase tracking-[0.28em] text-[color:var(--color-muted-ink)]"}>
                {label as string}
              </p>
              <p className={tone === "accent" ? "mt-4 text-[2rem] font-semibold tracking-tight text-white" : "mt-4 text-[2rem] font-semibold tracking-tight text-[var(--color-ink)]"}>
                {value as string}
              </p>
            </ShellPanel>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="space-y-4">
            <ShellPanel className="p-4" tone="soft">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">组合说明</p>
              <div className="mt-3 space-y-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
                <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-3.5 py-3">
                  积分只用于模拟仓位记账，不构成真实支付、收益承诺或可提现资产。
                </div>
                <div className="rounded-[1rem] border border-[var(--color-line)] bg-white px-3.5 py-3">
                  单市场深链页只负责执行，具体定义、时间边界和新闻依据统一回到事件页复核。
                </div>
              </div>
            </ShellPanel>

            <ShellPanel className="p-4">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">当前结构</p>
              <div className="mt-3 space-y-2">
                {[
                  ["持仓总数", `${portfolio.holdings.length} 条`],
                  ["盈利持仓", `${winningPositions} 条`],
                  ["可用积分", formatPoints(portfolio.user.availableCredits)],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex items-center justify-between rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                    <span className="text-[0.76rem] text-[color:var(--color-muted-ink)]">{label as string}</span>
                    <span className="text-[0.8rem] font-medium text-[var(--color-ink)]">{value as string}</span>
                  </div>
                ))}
              </div>
            </ShellPanel>
          </aside>

          <ShellPanel className="p-5 md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="font-mono text-[0.66rem] uppercase tracking-[0.3em] text-[var(--color-accent)]">持仓明细</p>
                <p className="mt-1 text-[0.82rem] text-[color:var(--color-muted-ink)]">
                  重点观察成本、当前概率和浮盈亏的组合关系，而不是只盯单个绝对收益数字。
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-black/10 text-[0.68rem] uppercase tracking-[0.28em] text-[color:var(--color-muted-ink)]">
                  <tr>
                    <th className="pb-4 pr-4">市场</th>
                    <th className="pb-4 pr-4">方向</th>
                    <th className="pb-4 pr-4">份额</th>
                    <th className="pb-4 pr-4">成本</th>
                    <th className="pb-4 pr-4">当前概率</th>
                    <th className="pb-4 pr-4">市值</th>
                    <th className="pb-4">浮盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.holdings.map((position) => (
                    <tr key={`${position.marketSlug}-${position.side}`} className="border-b border-black/8 align-top last:border-b-0">
                      <td className="py-5 pr-4">
                        <p className="font-medium text-[var(--color-ink)]">{position.marketQuestion}</p>
                      </td>
                      <td className="py-5 pr-4">
                        <span
                          className={
                            position.side === "YES"
                              ? "inline-flex rounded-full border border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.08)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--color-accent-deep)]"
                              : "inline-flex rounded-full border border-[rgba(198,40,40,0.22)] bg-[rgba(198,40,40,0.08)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--color-secondary-deep)]"
                          }
                        >
                          {position.side}
                        </span>
                      </td>
                      <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{position.shares}</td>
                      <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{formatPoints(position.totalCost)}</td>
                      <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{formatPercent(position.probability)}</td>
                      <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{formatPoints(position.currentValue)}</td>
                      <td className={`py-5 font-medium ${position.pnl >= 0 ? "text-[var(--color-accent)]" : "text-[var(--color-secondary)]"}`}>
                        {position.pnl >= 0 ? "+" : ""}
                        {formatPoints(position.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ShellPanel>
        </div>
      </section>
    </SiteShell>
  );
}
