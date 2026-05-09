import { SiteShell } from "@/components/site-shell";
import { DocumentScaffold, ShellPanel } from "@/components/shell-panel";

const notices = [
  "概率展示来自外部锚定或站内模型，可能存在延迟、跳变或过期状态。",
  "积分不具备现金价值，不可充值、提现、兑换或转让。",
  "热点事件可能因信息不足、争议升级或来源失效而被锁盘、作废或下架。",
  "请勿把页面概率、榜单或仓位表现当作财务、投资、法律或医疗建议。",
] as const;

export default function RiskPage() {
  return (
    <SiteShell currentPath="/risk" hideHero>
      <DocumentScaffold
        title="风险提示"
        eyebrow="Risk"
        description="站点面向公开信息复核与事件研判，不提供任何真实支付或收益能力。页面展示的是带噪音的信息信号，而不是确定性的承诺。"
        meta={[
          { label: "支付属性", value: "无现金价值" },
          { label: "建议性质", value: "不构成建议" },
          { label: "争议处理", value: "可锁盘 / 作废 / 下架" },
        ]}
        sidebar={
          <ShellPanel className="p-4" tone="secondary">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-secondary-deep)]">高风险环节</p>
            <div className="mt-3 space-y-2">
              {[
                ["数据时效", "可能延迟"],
                ["事件争议", "可能锁盘"],
                ["外部来源", "可能失效"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[0.95rem] border border-[rgba(198,40,40,0.18)] bg-white px-3 py-2.5">
                  <span className="text-[0.76rem] text-[color:var(--color-muted-ink)]">{label}</span>
                  <span className="text-[0.78rem] font-medium text-[var(--color-ink)]">{value}</span>
                </div>
              ))}
            </div>
          </ShellPanel>
        }
      >
        <ShellPanel className="p-4 md:p-5">
          <div className="grid gap-3">
            {notices.map((item, index) => (
              <div key={item} className="rounded-[1rem] border border-[rgba(198,40,40,0.22)] bg-[rgba(198,40,40,0.05)] px-4 py-3 text-[0.84rem] leading-6 text-[var(--color-ink)]">
                <span className="mr-2 font-medium text-[var(--color-secondary-deep)]">{index + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        </ShellPanel>
      </DocumentScaffold>
    </SiteShell>
  );
}
