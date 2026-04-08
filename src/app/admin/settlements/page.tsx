import Link from "next/link";

import { AdminResolutionForm } from "@/components/admin-resolution-form";
import { SiteShell } from "@/components/site-shell";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminSettlementListItems } from "@/lib/data/queries";
import { formatDateLabel, formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSettlementsPage() {
  await requireAdminSession();
  const queue = await getAdminSettlementListItems();
  const totalOpenPositions = queue.reduce((sum, market) => sum + market.openPositionCount, 0);
  const totalOpenShares = queue.reduce((sum, market) => sum + market.openShareCount, 0);

  return (
    <SiteShell currentPath="/admin" hideHero>
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--color-paper)] p-4">
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">待结算市场</p>
              <p className="mt-2 text-[2rem] font-semibold tracking-tight text-[var(--color-ink)]">{queue.length}</p>
            </div>
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--color-paper)] p-4">
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">待处理持仓</p>
              <p className="mt-2 text-[2rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(totalOpenPositions)}</p>
            </div>
            <div className="rounded-[1.25rem] border border-black/10 bg-[var(--color-paper)] p-4">
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">待处理份额</p>
              <p className="mt-2 text-[2rem] font-semibold tracking-tight text-[var(--color-ink)]">{formatPoints(totalOpenShares)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex rounded-full border border-black/10 bg-[var(--color-paper)] px-4 py-2.5 text-[0.82rem] font-medium text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white"
            >
              返回运营台
            </Link>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="rounded-[1.6rem] border border-black/10 bg-[var(--color-paper)] p-6 text-[0.82rem] text-[color:var(--color-muted-ink)]">
            当前没有待结算市场。
          </div>
        ) : (
          <div className="grid gap-4">
            {queue.map((market) => (
              <div key={market.id} className="rounded-[1.6rem] border border-black/10 bg-[var(--color-paper)] p-4 md:p-5">
                <div className="mb-4 grid gap-3 md:grid-cols-4">
                  <div>
                    <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">状态</p>
                    <p className="mt-1.5 text-[1rem] font-semibold text-[var(--color-ink)]">{market.statusLabel}</p>
                  </div>
                  <div>
                    <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">收盘</p>
                    <p className="mt-1.5 text-[1rem] font-semibold text-[var(--color-ink)]">{formatDateLabel(market.closesAt)}</p>
                  </div>
                  <div>
                    <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">结算时间</p>
                    <p className="mt-1.5 text-[1rem] font-semibold text-[var(--color-ink)]">{formatDateLabel(market.resolvesAt)}</p>
                  </div>
                  <div>
                    <p className="text-[0.58rem] uppercase tracking-[0.22em] text-[color:var(--color-muted-ink)]">未平仓份额</p>
                    <p className="mt-1.5 text-[1rem] font-semibold text-[var(--color-ink)]">
                      {formatPoints(market.openShareCount)} / {formatPoints(market.openPositionCount)} 持仓
                    </p>
                  </div>
                </div>

                <AdminResolutionForm
                  marketId={market.id}
                  marketQuestion={market.question}
                  openShareCount={market.openShareCount}
                  openPositionCount={market.openPositionCount}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteShell>
  );
}
