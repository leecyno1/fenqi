import Link from "next/link";

import { SiteShell } from "@/components/site-shell";
import { PageIntro, ShellPanel } from "@/components/shell-panel";

export default function ForbiddenPage() {
  return (
    <SiteShell hideHero>
      <section className="space-y-4">
        <PageIntro
          eyebrow="Access"
          title="当前账户没有后台权限。"
          description="禁止页也收敛进统一模板：先说明当前状态，再给出回首页和切换账号两个确定动作。"
          meta={[
            { label: "当前页面", value: "后台入口" },
            { label: "问题类型", value: "权限不足" },
            { label: "建议动作", value: "切换管理员账号" },
          ]}
        />

        <ShellPanel className="p-6 md:p-8" tone="secondary">
          <p className="text-sm leading-7 text-[var(--color-ink)]">
            当前账户缺少后台权限。若你是运营成员，请切换管理员账号；若并非后台角色，直接返回首页继续浏览事件与市场即可。
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-[var(--color-accent-deep)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-92"
            >
              返回首页
            </Link>
            <Link
              href="/sign-in?next=/admin"
              className="rounded-full border border-[var(--color-line)] bg-white px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-[rgba(198,40,40,0.3)] hover:bg-white"
            >
              切换账号
            </Link>
          </div>
        </ShellPanel>
      </section>
    </SiteShell>
  );
}
