import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDeleteMarketButton } from "@/components/admin-delete-market-button";
import { AdminMarketForm } from "@/components/admin-market-form";
import { SiteShell } from "@/components/site-shell";
import { buildAdminMarketFormValues } from "@/lib/admin/market-form";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminMarketById, getAdminMarketDeleteGuard } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminMarketEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const [market, deleteGuard] = await Promise.all([
    getAdminMarketById(id),
    getAdminMarketDeleteGuard(id),
  ]);

  if (!market || !deleteGuard) {
    notFound();
  }

  return (
    <SiteShell currentPath="/admin" hideHero>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-[2.4rem] border border-black/10 bg-black p-6 text-white md:p-8">
            <AdminMarketForm
              action={`/api/admin/markets/${market.id}`}
              method="PATCH"
              title="Edit Market"
              description="修改市场定义、时间和状态。"
              buttonLabel="保存修改"
              successPrefix="市场已更新"
              initialValues={buildAdminMarketFormValues(market)}
          />
        </div>

        <aside className="space-y-5">
          <div className="rounded-[2.4rem] border border-black/10 bg-[var(--color-paper)] p-6">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.35em] text-[var(--color-accent)]">
              Quick Context
            </p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--color-muted-ink)]">
              <p>当前 slug: {market.slug}</p>
              <p>当前状态: {market.status}</p>
              <p>盘口模式: {market.priceAnchorMode}</p>
              <p>外部 YES: {market.externalYesProbabilityBps === null ? "-" : `${(market.externalYesProbabilityBps / 100).toFixed(1)}%`}</p>
              <p>外部更新时间: {market.externalPriceUpdatedAt ? market.externalPriceUpdatedAt.toLocaleString("zh-CN") : "-"}</p>
              <p>外部价格状态: {market.externalPriceStale ? "需要复查" : "正常"}</p>
            </div>
          </div>

          <div className="rounded-[2.4rem] border border-black/10 bg-[var(--color-paper)] p-6">
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.35em] text-[var(--color-secondary)]">
              Dangerous Action
            </p>
            <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted-ink)]">
              只有没有持仓、成交、快照或结算记录的市场才允许删除。
            </p>
            <div className="mt-5">
              <AdminDeleteMarketButton
                marketId={market.id}
                canDelete={deleteGuard.canDelete}
                reason={deleteGuard.canDelete ? undefined : deleteGuard.reason}
              />
            </div>
          </div>

          <Link
            href="/admin"
            className="inline-flex rounded-full border border-black/10 bg-[var(--color-paper)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white"
          >
            返回运营台
          </Link>
        </aside>
      </div>
    </SiteShell>
  );
}
