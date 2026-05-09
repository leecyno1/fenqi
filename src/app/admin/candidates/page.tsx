import Image from "next/image";
import Link from "next/link";

import { AdminCandidateActions } from "@/components/admin-candidate-actions";
import { AdminCandidateGenerateButton } from "@/components/admin-candidate-generate-button";
import { SiteShell } from "@/components/site-shell";
import { PageIntro, ShellPanel } from "@/components/shell-panel";
import { requireAdminSession } from "@/lib/auth/session";
import { getAdminCandidateEventListItems } from "@/lib/data/queries";
import { formatCompactNumber, formatDateLabel, formatPercent } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage() {
  await requireAdminSession();
  const candidates = await getAdminCandidateEventListItems();
  const hasReportsLlmKey = Boolean(process.env.REPORTS_LLM_API_KEY);
  const reportsBaseUrl = process.env.REPORTS_BASE_URL?.trim() || "未配置 REPORTS_BASE_URL";

  return (
    <SiteShell currentPath="/admin" hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Candidate Desk"
          title="候选事件"
          description="新闻生成与人工策展先进入候选池，审核通过后再公开。"
          meta={[{ label: "待审核", value: `${candidates.length} 个` }]}
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <AdminCandidateGenerateButton />
              <Link href="/admin" className="rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-[0.82rem] text-[var(--color-ink)] hover:border-[rgba(29,78,216,0.3)]">
                返回后台
              </Link>
            </div>
          }
        />

        <ShellPanel className="p-4 md:p-5">
          <div className="mb-4 rounded-[1.15rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3 text-[0.78rem] text-[color:var(--color-muted-ink)]">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <span>新闻源：{reportsBaseUrl}</span>
              <span className={hasReportsLlmKey ? "text-[var(--color-accent-deep)]" : "text-[var(--color-secondary-deep)]"}>
                {hasReportsLlmKey ? "LLM 已配置" : "缺少 REPORTS_LLM_API_KEY"}
              </span>
            </div>
          </div>
          {candidates.length === 0 ? (
            <div className="rounded-[1.2rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-5 py-10 text-center text-[0.9rem] text-[color:var(--color-muted-ink)]">
              当前没有新闻生成候选。运行同步任务后，`news_report` 事件会进入这里。
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((event) => (
                <div key={event.id} className="grid gap-3 rounded-[1.25rem] border border-[var(--color-line)] bg-white p-3 md:grid-cols-[9.5rem_minmax(0,1fr)_16rem] md:p-4">
                  <div className="relative min-h-[8rem] overflow-hidden rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)]">
                    <Image src={event.imageUrl} alt={event.question} fill sizes="152px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
                      <span className="rounded-full border border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.08)] px-2.5 py-1 text-[var(--color-accent-deep)]">{event.topicLabel}</span>
                      <span className="rounded-full border border-[rgba(198,40,40,0.28)] bg-white px-2.5 py-1 text-[var(--color-secondary-deep)]">{event.statusLabel}</span>
                      <span className="rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">{event.sourceName ?? "新闻候选"}</span>
                      <span className="rounded-full border border-[var(--color-line)] bg-white px-2.5 py-1">图源 {event.newsImageSource ?? "fallback"}</span>
                    </div>
                    <h2 className="mt-3 line-clamp-2 text-[1rem] font-semibold leading-6 text-[var(--color-ink)]">{event.question}</h2>
                    <p className="mt-2 line-clamp-2 text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">{event.brief}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[0.74rem] text-[color:var(--color-muted-ink)]">
                      <span>锁盘 {formatDateLabel(event.closesAt)}</span>
                      <span>成交 {formatCompactNumber(event.totalVolumePoints)}</span>
                      <span>热度 {event.heatScore}</span>
                      <span>争议 {event.controversyScore}</span>
                      {event.sourceUrl ? (
                        <Link href={event.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--color-accent-deep)] underline-offset-4 hover:underline">
                          原文来源
                        </Link>
                      ) : null}
                    </div>
                    {event.evidence.length > 0 ? (
                      <div className="mt-3 grid gap-1.5">
                        {event.evidence.slice(0, 3).map((item) => (
                          <p key={item} className="line-clamp-1 rounded-[0.75rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-2.5 py-1.5 text-[0.72rem] text-[var(--color-ink)]">
                            依据：{item}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-3">
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">主子市场</p>
                    <p className="mt-2 font-display text-[1.6rem] leading-none text-[var(--color-accent-deep)]">
                      {formatPercent(event.probability.yes)}
                    </p>
                    <p className="mt-1 text-[0.72rem] text-[color:var(--color-muted-ink)]">YES 当前概率</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[0.7rem] text-[color:var(--color-muted-ink)]">
                      <span>子市场 {event.activeChildCount}</span>
                      <span>更新 {event.lastUpdatedAt ? formatDateLabel(event.lastUpdatedAt) : "缺失"}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Link href={`/events/${event.slug}`} className="flex-1 rounded-full bg-[var(--color-accent)] px-3 py-2 text-center text-[0.74rem] font-medium text-white hover:bg-[var(--color-accent-deep)]">
                        预览
                      </Link>
                      <Link href={`/admin/markets/${event.primaryChildMarket.id}`} className="flex-1 rounded-full border border-[var(--color-line)] bg-white px-3 py-2 text-center text-[0.74rem] text-[var(--color-ink)] hover:border-[rgba(198,40,40,0.32)]">
                        编辑
                      </Link>
                    </div>
                    <AdminCandidateActions marketId={event.primaryChildMarket.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ShellPanel>
      </section>
    </SiteShell>
  );
}
