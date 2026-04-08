import { SiteShell } from "@/components/site-shell";

const notices = [
  "概率展示来自外部锚定或站内模型，可能存在延迟、跳变或过期状态。",
  "积分不具备现金价值，不可充值、提现、兑换或转让。",
  "热点事件可能因信息不足、争议升级或来源失效而被锁盘、作废或下架。",
  "请勿把页面概率、榜单或仓位表现当作财务、投资、法律或医疗建议。",
] as const;

export default function RiskPage() {
  return (
    <SiteShell currentPath="/risk" hideHero>
      <section className="space-y-4 rounded-[1.6rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-6">
        <div className="space-y-2">
          <h1 className="font-display text-[1.6rem] leading-none tracking-tight text-[var(--color-ink)]">风险提示</h1>
          <p className="text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">站点面向公开信息复核与事件研判，不提供任何真实支付或收益能力。</p>
        </div>
        <div className="grid gap-3">
          {notices.map((item) => (
            <div key={item} className="rounded-[1rem] border border-[rgba(198,40,40,0.22)] bg-white px-4 py-3 text-[0.84rem] leading-6 text-[var(--color-ink)]">
              {item}
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
