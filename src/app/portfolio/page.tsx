import { SiteShell } from "@/components/site-shell";
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
        <div className="rounded-[2.4rem] border border-black/10 bg-[var(--color-paper)] p-8 text-sm text-[color:var(--color-muted-ink)]">
          当前没有可展示的组合数据。
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell currentPath="/portfolio" hideHero>
      <section className="grid gap-4 md:grid-cols-5">
        {[
          ["账户总积分", formatPoints(portfolio.user.credits)],
          ["可用积分", formatPoints(portfolio.user.availableCredits)],
          ["持仓浮盈亏", `${portfolio.summary.openPnl >= 0 ? "+" : ""}${formatPoints(portfolio.summary.openPnl)}`],
          ["已实现收益", formatPoints(portfolio.summary.realizedPnl)],
          ["已结算收益", formatPoints(portfolio.summary.resolvedPnl)],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-[2rem] border border-black/10 bg-[var(--color-paper)] p-6">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[color:var(--color-muted-ink)]">{label as string}</p>
            <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-ink)]">{value as string}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 rounded-[2.4rem] border border-black/10 bg-[var(--color-paper)] p-6 md:p-8">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 text-[0.68rem] uppercase tracking-[0.28em] text-[color:var(--color-muted-ink)]">
              <tr>
                <th className="pb-4">市场</th>
                <th className="pb-4">方向</th>
                <th className="pb-4">份额</th>
                <th className="pb-4">成本</th>
                <th className="pb-4">当前概率</th>
                <th className="pb-4">市值</th>
                <th className="pb-4">浮盈亏</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.holdings.map((position) => (
                <tr key={`${position.marketSlug}-${position.side}`} className="border-b border-black/8 align-top last:border-b-0">
                  <td className="py-5 pr-4 font-medium text-[var(--color-ink)]">{position.marketQuestion}</td>
                  <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{position.side}</td>
                  <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{position.shares}</td>
                  <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{formatPoints(position.totalCost)}</td>
                  <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{formatPercent(position.probability)}</td>
                  <td className="py-5 pr-4 text-[color:var(--color-muted-ink)]">{formatPoints(position.currentValue)}</td>
                  <td className={`py-5 pr-4 font-medium ${position.pnl >= 0 ? "text-[var(--color-accent)]" : "text-[var(--color-secondary)]"}`}>
                    {position.pnl >= 0 ? "+" : ""}
                    {formatPoints(position.pnl)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </SiteShell>
  );
}
