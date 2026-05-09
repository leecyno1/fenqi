import { SiteShell } from "@/components/site-shell";
import { DocumentScaffold, ShellPanel } from "@/components/shell-panel";

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
      <DocumentScaffold
        title="服务条款"
        eyebrow="Terms"
        description="以下条款适用于站点访问、账户使用、事件参与与后台运营。文档模板统一后，条款页只做约束表达，不再混入产品介绍。"
        meta={[
          { label: "适用范围", value: "访问 / 账户 / 参与 / 运营" },
          { label: "支付能力", value: "严格禁用" },
          { label: "争议处理", value: "允许复核" },
        ]}
        sidebar={
          <ShellPanel className="p-4" tone="soft">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">阅读提示</p>
            <div className="mt-3 space-y-2 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
              <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2.5">先看平台边界，再看账户义务和争议处理。</div>
              <div className="rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2.5">任何涉及真实收益、充值或提现的理解都不适用于本产品。</div>
            </div>
          </ShellPanel>
        }
      >
        <ShellPanel className="p-4 md:p-5">
          <ol className="space-y-3 text-[0.84rem] leading-6 text-[color:var(--color-muted-ink)]">
            {terms.map((item, index) => (
              <li key={item} className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3">
                <span className="mr-2 font-medium text-[var(--color-ink)]">{index + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </ShellPanel>
      </DocumentScaffold>
    </SiteShell>
  );
}
