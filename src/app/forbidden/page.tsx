import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export default function ForbiddenPage() {
  return (
    <SiteShell hideHero>
      <div className="rounded-[2.4rem] border border-[color:rgba(198,40,40,0.25)] bg-[rgba(198,40,40,0.08)] p-8">
        <p className="text-sm leading-7 text-[var(--color-ink)]">
          当前账户缺少后台权限。若你是运营成员，请切换管理员账号。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-full bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            返回首页
          </Link>
          <Link
            href="/sign-in?next=/admin"
            className="rounded-full border border-black/10 bg-[var(--color-paper)] px-5 py-3 text-sm font-medium text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white"
          >
            切换账号
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
