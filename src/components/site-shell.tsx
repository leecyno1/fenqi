import Link from "next/link";
import type { ReactNode } from "react";

import { PageIntro } from "@/components/shell-panel";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getOptionalSession } from "@/lib/auth/session";
import { getPublicSiteConfig } from "@/lib/env";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "事件" },
  { href: "/search", label: "搜索" },
  { href: "/activity", label: "动态" },
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
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] px-3 py-4 text-[var(--color-ink)] sm:px-6 sm:py-8 lg:px-10">
      <div className="pointer-events-none absolute left-[8%] top-[8%] h-64 w-64 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[6%] right-[10%] h-80 w-80 rounded-full bg-[rgba(35,45,67,0.16)] blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[var(--radius-shell)] border border-[var(--color-glass-line)] bg-[var(--color-shell)] px-4 pb-8 pt-4 shadow-[var(--shadow-soft)] backdrop-blur-2xl sm:px-6 lg:px-8">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--color-accent-deep)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-[0_14px_28px_rgba(11,31,77,0.24)]"
        >
          跳到主要内容
        </a>
        <div className="overflow-hidden rounded-[1.35rem] border border-[var(--color-glass-line)] bg-[var(--color-surface-soft)] shadow-[0_10px_28px_rgba(31,39,55,0.06)]">
          <div className="ticker-track flex items-center gap-0 whitespace-nowrap py-1.5">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-2.5 border-r border-[rgba(32,40,58,0.06)] px-4 text-[0.62rem] uppercase tracking-[0.18em] text-[var(--color-muted-ink)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]/80" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <header className="mt-3 rounded-[1.6rem] border border-[var(--color-glass-line)] bg-[var(--color-surface-soft)] px-4 py-3 shadow-[0_12px_30px_rgba(31,39,55,0.07)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="group flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent)] text-[1rem] font-semibold tracking-[0.12em] text-white shadow-[0_12px_24px_rgba(230,76,46,0.28)]">
                  分
                </div>
                <div>
                  <p className="font-display text-[1.25rem] leading-none tracking-[0.04em] text-[var(--color-ink)]">分歧</p>
                </div>
              </Link>
            </div>

            <nav aria-label="主导航" className="flex flex-wrap items-center gap-2 text-sm">
              {navLinks.map((item) => {
                const active = currentPath === item.href || (item.href !== "/" && currentPath?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-4 py-2 transition",
                      active
                        ? "bg-[var(--color-surface-raised)] text-[var(--color-ink)] shadow-[0_8px_18px_rgba(31,39,55,0.08)]"
                        : "text-[color:var(--color-muted-ink)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <ThemeToggle />
              {session ? (
                <>
                  <div className="rounded-full border border-[var(--color-glass-line)] bg-[var(--color-surface)] px-4 py-2 text-[var(--color-ink)] shadow-[0_8px_18px_rgba(31,39,55,0.06)]">{session.name}</div>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="rounded-full bg-[var(--color-accent-deep)] px-4 py-2 text-white shadow-[0_10px_22px_rgba(35,45,67,0.18)] transition hover:bg-[var(--color-accent)]"
                >
                  登录
                </Link>
              )}
            </nav>
          </div>
        </header>

        {shouldShowHero ? (
          <section className="pt-7">
            <PageIntro
              eyebrow="Site Brief"
              title={headline ?? ""}
              description={deck ?? ""}
              meta={[
                { label: "模式", value: "积分预测" },
                { label: "结算", value: "公开来源" },
                { label: "支付", value: "严格禁用" },
              ]}
            />
          </section>
        ) : null}

        <main id="main-content" className={cn("flex-1", shouldShowHero ? "pt-7" : "pt-4")}>{children}</main>

        <footer className="mt-12 overflow-hidden rounded-[1.8rem] border border-[var(--color-glass-line)] bg-[var(--color-surface-soft)] shadow-[var(--shadow-card)] backdrop-blur-xl">
          <div className="grid gap-0 border-b border-[var(--color-line)] md:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-[var(--color-accent-deep)] px-6 py-5 text-white">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-white/70">运行规则</p>
              <p className="mt-2 text-[0.88rem] leading-7">事件定义、锁盘时间、结算来源必须可复核。异常内容可被下架、纠错或作废。</p>
            </div>
            <div className="bg-[var(--color-accent)] px-6 py-5 text-white">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.32em] text-white/70">联系与投诉</p>
              <p className="mt-2 text-[0.88rem] leading-7">
                {siteConfig.supportEmail ? `联系邮箱：${siteConfig.supportEmail}` : "规则页提供纠错与处理说明。"}
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
