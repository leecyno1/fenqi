import { SiteShell } from "@/components/site-shell";

const terms = [
  "本平台展示的事件、仓位与积分仅用于信息展示和产品交互，不构成投资、博彩或收益承诺。",
  "用户必须使用真实、可联系的邮箱开设账户，不得冒用他人身份或批量注册。",
  "平台有权对违规内容、异常交易、刷量、滥用接口和恶意传播行为采取限流、冻结、下架或封禁措施。",
  "事件终局以平台记录的公开来源和结算结果为准；发现错误可通过投诉入口申请复核。",
  "因外部数据源中断、网络波动、第三方接口故障导致的延迟、过期或显示异常，平台会尽快修复，但不对间接损失负责。",
] as const;

export default function TermsPage() {
  return (
    <SiteShell currentPath="/terms" hideHero>
      <section className="space-y-4 rounded-[1.6rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-6">
        <div className="space-y-2">
          <h1 className="font-display text-[1.6rem] leading-none tracking-tight text-[var(--color-ink)]">服务条款</h1>
          <p className="text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">以下条款适用于站点访问、账户使用、事件参与与后台运营。</p>
        </div>
        <ol className="space-y-2 text-[0.84rem] leading-6 text-[color:var(--color-muted-ink)]">
          {terms.map((item, index) => (
            <li key={item} className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3">
              <span className="mr-2 font-medium text-[var(--color-ink)]">{index + 1}.</span>
              {item}
            </li>
          ))}
        </ol>
      </section>
    </SiteShell>
  );
}
