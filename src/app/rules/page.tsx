import { FileCheck2, Waypoints } from "lucide-react";

import { SiteShell } from "@/components/site-shell";

const rules = [
  {
    title: "只用模拟积分",
    description: "不支持充值、提现或法币兑换。所有数值仅用于积分记账与结果展示。",
    tone: "blue",
  },
  {
    title: "只做可验证事件",
    description: "每个事件都必须写明时间边界、结算条件与公开来源，避免模糊题面和口径漂移。",
    tone: "neutral",
  },
  {
    title: "锁盘后立即停止交易",
    description: "到达锁盘时间后禁止继续下单，只保留历史、证据与终局结果展示。",
    tone: "red",
  },
  {
    title: "结算必须留痕",
    description: "每次结算都必须记录来源链接、时间戳与操作理由，保证后续可以复核。",
    tone: "neutral",
  },
] as const;

const guardrails = [
  { label: "题面边界", value: "必须具体" },
  { label: "锁盘纪律", value: "到点即停" },
  { label: "结算证据", value: "必须公开" },
  { label: "支付语义", value: "严格禁用" },
] as const;

export default function RulesPage() {
  return (
    <SiteShell currentPath="/rules" hideHero>
      <section className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="rounded-[1.45rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_26px_rgba(11,31,77,0.08)]">
            <div className="flex items-center gap-2">
              <FileCheck2 className="h-4.5 w-4.5 text-[var(--color-accent)]" />
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">规则摘要</p>
            </div>
            <div className="mt-3 space-y-2">
              {[
                ["核心规则", `${rules.length} 条`],
                ["锁盘机制", "强制执行"],
                ["结算标准", "公开可核验"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                  <span className="text-[0.76rem] text-[color:var(--color-muted-ink)]">{label}</span>
                  <span className="text-[0.78rem] font-medium text-[var(--color-ink)]">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_12px_26px_rgba(11,31,77,0.08)]">
            <div className="flex items-center gap-2">
              <Waypoints className="h-4.5 w-4.5 text-[var(--color-accent)]" />
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">边界条件</p>
            </div>
            <div className="mt-3 space-y-2">
              {guardrails.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[0.95rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-3 py-2.5">
                  <span className="text-[0.76rem] text-[color:var(--color-muted-ink)]">{item.label}</span>
                  <span className="text-[0.78rem] font-medium text-[var(--color-ink)]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-white p-4 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-5">
          <div className="space-y-2.5">
            {rules.map((rule, index) => {
              const toneClass =
                rule.tone === "blue"
                  ? "border-[rgba(29,78,216,0.24)] bg-[rgba(29,78,216,0.06)]"
                  : rule.tone === "red"
                    ? "border-[rgba(198,40,40,0.28)] bg-white"
                    : "border-[var(--color-line)] bg-white";

              return (
                <div
                  key={rule.title}
                  className={`grid gap-3 rounded-[1.15rem] border px-3.5 py-3.5 md:grid-cols-[4.5rem_minmax(0,1fr)] ${toneClass}`}
                >
                  <div className="flex items-center gap-2 md:block">
                    <span className="inline-flex rounded-full border border-current/10 bg-black/4 px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
                      规则
                    </span>
                    <p className="font-display text-[1.45rem] leading-none text-[var(--color-ink)]">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[1rem] font-semibold leading-6 text-[var(--color-ink)]">
                      {rule.title}
                    </p>
                    <p className="mt-1.5 max-w-3xl text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">
                      {rule.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
