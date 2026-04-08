import Link from "next/link";

import { AdminMarketForm } from "@/components/admin-market-form";
import { AdminStatusActions } from "@/components/admin-status-actions";
import { SiteShell } from "@/components/site-shell";
import { requireAdminSession } from "@/lib/auth/session";
import {
  getAdminMarketListItems,
  getAdminSettlementListItems,
  getHomepageGovernanceSummary,
} from "@/lib/data/queries";
import { getReadinessReport } from "@/lib/health";
import { listLatestJobRuns } from "@/lib/jobs";
import { formatDateLabel, formatPoints } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdminSession();
  const [markets, queue, homepageSummary, readiness, jobRuns] = await Promise.all([
    getAdminMarketListItems(),
    getAdminSettlementListItems(),
    getHomepageGovernanceSummary(),
    getReadinessReport(),
    listLatestJobRuns(6),
  ]);
  const draftOrReviewCount = markets.filter((market) => market.status === "draft" || market.status === "review").length;
  const liveCount = markets.filter((market) => market.status === "live").length;

  return (
    <SiteShell currentPath="/admin" hideHero>
      <section className="space-y-4">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_20rem]">
          <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-accent-deep)] p-5 text-white shadow-[0_18px_36px_rgba(11,31,77,0.18)]">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.32em] text-white/58">运营状态</p>
            <div className="mt-4 grid gap-2.5 md:grid-cols-4">
              {[
                ["市场总数", `${markets.length}`, "个"],
                ["进行中", `${liveCount}`, "个"],
                ["待处理", `${draftOrReviewCount}`, "个"],
                ["待结算", `${queue.length}`, "个"],
              ].map(([label, value, unit]) => (
                <div key={label} className="rounded-[1rem] border border-white/12 bg-white/8 px-3.5 py-3">
                  <p className="text-[0.56rem] uppercase tracking-[0.24em] text-white/56">{label}</p>
                  <p className="mt-1.5 text-[1.2rem] font-semibold">
                    {value}
                    <span className="ml-1 text-[0.72rem] text-white/64">{unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_26px_rgba(11,31,77,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">待结算</p>
              <Link
                href="/admin/settlements"
                className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-[0.7rem] text-[var(--color-ink)] transition hover:border-black/20"
              >
                打开结算台
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {queue.slice(0, 4).map((market) => (
                <div key={market.id} className="rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                  <p className="text-[0.68rem] text-[color:var(--color-muted-ink)]">{market.statusLabel}</p>
                  <p className="mt-1 text-[0.88rem] font-medium leading-5 text-[var(--color-ink)]">{market.question}</p>
                  <p className="mt-1 text-[0.7rem] text-[color:var(--color-muted-ink)]">
                    未平仓 {formatPoints(market.openShareCount)} / {formatPoints(market.openPositionCount)} 持仓
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_26px_rgba(11,31,77,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">系统状态</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[0.68rem] ${
                  readiness.ok
                    ? "bg-[rgba(29,78,216,0.08)] text-[var(--color-accent-deep)]"
                    : "bg-[rgba(198,40,40,0.08)] text-[var(--color-secondary-deep)]"
                }`}
              >
                {readiness.ok ? "ready" : "attention"}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">首页可用</p>
                <p className="mt-1 text-[1.1rem] font-semibold text-[var(--color-ink)]">{homepageSummary.eligibleCount}</p>
              </div>
              <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[color:var(--color-muted-ink)]">Stale 外部</p>
                <p className="mt-1 text-[1.1rem] font-semibold text-[var(--color-ink)]">{homepageSummary.staleExternalCount}</p>
              </div>
            </div>
            <div className="mt-2 grid gap-2">
              <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2.5">
                <p className="text-[0.66rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">目录同步</p>
                <p className="mt-1 text-[0.74rem] text-[var(--color-ink)]">
                  {homepageSummary.lastCatalogSuccessAt
                    ? formatDateLabel(homepageSummary.lastCatalogSuccessAt.toISOString())
                    : "暂无成功记录"}
                </p>
              </div>
              <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2.5">
                <p className="text-[0.66rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">盘口同步</p>
                <p className="mt-1 text-[0.74rem] text-[var(--color-ink)]">
                  {homepageSummary.lastPriceSuccessAt
                    ? formatDateLabel(homepageSummary.lastPriceSuccessAt.toISOString())
                    : "暂无成功记录"}
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {readiness.checks.jobs.jobs.map((job) => (
                <div key={job.jobName} className="rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.76rem] font-medium text-[var(--color-ink)]">{job.jobName}</p>
                    <span className="text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.7rem] text-[color:var(--color-muted-ink)]">
                    {job.finishedAt ? formatDateLabel(job.finishedAt.toISOString()) : "暂无成功记录"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {jobRuns.map((job) => (
                <div key={job.id} className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[0.74rem] text-[var(--color-ink)]">{job.jobName}</p>
                    <span className="text-[0.66rem] uppercase tracking-[0.16em] text-[color:var(--color-muted-ink)]">
                      {job.status}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.68rem] text-[color:var(--color-muted-ink)]">
                    {job.finishedAt ? formatDateLabel(job.finishedAt.toISOString()) : "进行中"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-5">
            <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-black/10 text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">
                <tr>
                  <th className="pb-3 pr-3">市场</th>
                  <th className="pb-3 pr-3">状态</th>
                  <th className="pb-3 pr-3">锁盘时间</th>
                  <th className="pb-3 pr-3">积分量级</th>
                  <th className="pb-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((market) => (
                  <tr key={market.id} className="border-b border-black/8 last:border-b-0">
                    <td className="py-3.5 pr-3 font-medium text-[0.9rem] text-[var(--color-ink)]">{market.question}</td>
                    <td className="py-3.5 pr-3 text-[0.8rem] text-[color:var(--color-muted-ink)]">{market.statusLabel}</td>
                    <td className="py-3.5 pr-3 text-[0.8rem] text-[color:var(--color-muted-ink)]">{formatDateLabel(market.closesAt.toISOString())}</td>
                    <td className="py-3.5 pr-3 text-[0.8rem] text-[color:var(--color-muted-ink)]">{formatPoints(market.volumePoints)}</td>
                    <td className="py-3.5 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/admin/markets/${market.id}`}
                          className="inline-flex rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-[0.68rem] font-medium text-[var(--color-ink)] transition hover:border-black/20"
                        >
                          编辑
                        </Link>
                        <AdminStatusActions marketId={market.id} currentStatus={market.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.45rem] border border-black/10 bg-black p-4 text-white shadow-[0_16px_30px_rgba(11,31,77,0.18)]">
            <AdminMarketForm />
          </div>
            <div className="rounded-[1.45rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_26px_rgba(11,31,77,0.08)]">
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">操作提示</p>
              <div className="mt-3 space-y-2">
                {[
                  "先修订草稿与待审核市场，再发布。",
                  "锁盘后的市场统一在结算台处理。",
                  "题面、锁盘时间、结算来源需一致。",
                ].map((item) => (
                  <div key={item} className="rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5 text-[0.76rem] leading-5 text-[var(--color-ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
