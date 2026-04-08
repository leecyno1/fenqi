import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { getOptionalSession } from "@/lib/auth/session";
import { getPublicSiteConfig } from "@/lib/env";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "事件" },
  { href: "/leaderboard", label: "榜单" },
  { href: "/rules", label: "规则" },
];

const tickerItems = [
  "仅使用积分，不接真实支付",
  "事件必须写明时间边界",
  "锁盘后立即停止交易",
  "结算必须附公开来源",
  "运营方保留纠错与下架权",
  "高概率不代表高确定性",
  "异常盘口会被标记为过期",
  "投诉与纠错请走公开入口",
];

export async function SiteShell({
  children,
  currentPath,
  headline,
  deck,
  hideHero = false,
}: {
  children: ReactNode;
  currentPath?: string;
  headline?: string;
  deck?: string;
  hideHero?: boolean;
}) {
  const [session, siteConfig] = await Promise.all([getOptionalSession(), Promise.resolve(getPublicSiteConfig())]);
  const navLinks = [
    ...navItems,
    ...(session ? [{ href: "/portfolio", label: "组合" }] : []),
    ...(session?.role === "admin" ? [{ href: "/admin", label: "后台" }] : []),
  ];

  const shouldShowHero = !hideHero && Boolean(headline || deck);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-ink)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 border-b border-[rgba(11,31,77,0.08)] bg-white" />
      <div className="pointer-events-none absolute left-0 top-0 h-[18rem] w-[min(44vw,30rem)] border-r border-b border-[rgba(29,78,216,0.14)] bg-[rgba(29,78,216,0.08)]" />
      <div className="pointer-events-none absolute right-0 top-16 h-[20rem] w-[min(36vw,24rem)] border-l border-b border-[rgba(198,40,40,0.16)] bg-[rgba(198,40,40,0.08)]" />
      <div className="pointer-events-none absolute right-[min(36vw,24rem)] top-16 h-[20rem] w-5 bg-[var(--color-secondary)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[0.95rem] border border-[var(--color-line)] bg-white shadow-[0_8px_18px_rgba(11,31,77,0.08)]">
          <div className="ticker-track flex items-center gap-0 whitespace-nowrap py-1.5">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-2.5 border-r border-[rgba(11,31,77,0.06)] px-4 text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-muted-ink)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]/75" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <header className="mt-2.5 rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.96)] px-4 py-2.5 shadow-[0_10px_24px_rgba(11,31,77,0.1)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="group flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(29,78,216,0.28)] bg-[rgba(29,78,216,0.1)] text-[1rem] font-semibold tracking-[0.12em] text-[var(--color-accent-deep)] shadow-[0_8px_18px_rgba(11,31,77,0.12)]">
                  分
                </div>
                <div>
                  <p className="font-display text-[1.25rem] leading-none tracking-[0.04em] text-[var(--color-ink)]">
                    分歧
                  </p>
                </div>
              </Link>
            </div>

            <nav className="flex flex-wrap items-center gap-2 text-sm">
              {navLinks.map((item) => {
                const active = currentPath === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-4 py-2 transition",
                      active
                        ? "bg-[var(--color-accent)] text-white shadow-[0_10px_20px_rgba(11,31,77,0.16)]"
                        : "text-[color:var(--color-muted-ink)] hover:bg-[rgba(29,78,216,0.1)] hover:text-[var(--color-ink)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {session ? (
                <>
                  <div className="rounded-full border border-[var(--color-line)] bg-[rgba(255,255,255,0.82)] px-4 py-2 text-[var(--color-ink)]">
                    {session.name}
                  </div>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="rounded-full border border-[rgba(198,40,40,0.3)] bg-[rgba(198,40,40,0.08)] px-4 py-2 text-[var(--color-ink)] transition hover:border-[rgba(198,40,40,0.45)] hover:bg-[rgba(198,40,40,0.16)]"
                >
                  登录
                </Link>
              )}
            </nav>
          </div>
        </header>

        {shouldShowHero ? (
          <section className="pt-7">
            <div className="space-y-2.5">
              {headline ? <h1 className="max-w-5xl font-display text-[2.2rem] leading-[0.96] tracking-[0.01em] md:text-[4rem]">{headline}</h1> : null}
              {deck ? <p className="max-w-4xl text-[0.86rem] leading-6 text-[color:var(--color-muted-ink)] md:text-[0.95rem]">{deck}</p> : null}
            </div>
          </section>
        ) : null}

        <main className={cn("flex-1", shouldShowHero ? "pt-7" : "pt-4")}>{children}</main>

        <footer className="mt-14 overflow-hidden rounded-[1.8rem] border border-[var(--color-line)] bg-white shadow-[0_12px_28px_rgba(11,31,77,0.08)]">
          <div className="grid gap-0 border-b border-[var(--color-line)] md:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-[var(--color-accent-deep)] px-6 py-5 text-white">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-white/70">运行规则</p>
              <p className="mt-2 text-[0.88rem] leading-7">事件定义、锁盘时间、结算来源必须可复核。异常内容可被下架、纠错或作废。</p>
            </div>
            <div className="bg-[var(--color-secondary)] px-6 py-5 text-white">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-white/70">联系与投诉</p>
              <p className="mt-2 text-[0.88rem] leading-7">
                {siteConfig.supportEmail ? `联系邮箱：${siteConfig.supportEmail}` : "联系邮箱待配置"}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-4 px-6 py-4 text-[0.78rem] text-[color:var(--color-muted-ink)] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/rules" className="transition hover:text-[var(--color-ink)]">规则</Link>
              <Link href="/privacy" className="transition hover:text-[var(--color-ink)]">隐私政策</Link>
              <Link href="/terms" className="transition hover:text-[var(--color-ink)]">服务条款</Link>
              <Link href="/risk" className="transition hover:text-[var(--color-ink)]">风险提示</Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-right">
              {siteConfig.organizationName ? <span>{siteConfig.organizationName}</span> : null}
              {siteConfig.icpLicense ? <span>{siteConfig.icpLicense}</span> : null}
              {siteConfig.publicSecurityLicense ? <span>{siteConfig.publicSecurityLicense}</span> : null}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
