import { SiteShell } from "@/components/site-shell";
import { DocumentScaffold, ShellPanel } from "@/components/shell-panel";
import { getPublicSiteConfig } from "@/lib/env";

const sections = [
  {
    title: "收集范围",
    items: [
      "账户信息：邮箱、昵称、登录会话与角色权限。",
      "交易记录：事件、仓位、积分变化、结算结果与操作时间。",
      "运行日志：IP、设备标识、接口状态与安全审计字段。",
    ],
  },
  {
    title: "使用目的",
    items: [
      "完成账户登录、权限控制、积分记账与事件结算。",
      "识别异常访问、限流、防刷与安全排查。",
      "处理投诉、纠错、合规协查与运营通知。",
    ],
  },
  {
    title: "用户权利",
    items: [
      "可通过联系邮箱申请更正账户资料与处理异常记录。",
      "法律或监管要求之外，不向无关第三方出售个人信息。",
      "站点发生主体或政策变化时，会在本页更新并标记生效时间。",
    ],
  },
] as const;

export default function PrivacyPage() {
  const siteConfig = getPublicSiteConfig();

  return (
    <SiteShell currentPath="/privacy" hideHero>
      <DocumentScaffold
        title="隐私政策"
        eyebrow="Privacy"
        description="本页说明平台在账户登录、积分记账、事件结算与安全审计过程中会处理哪些数据，以及这些数据被使用到什么范围。"
        meta={[
          { label: "生效日期", value: "2026-04-07" },
          { label: "联系邮箱", value: siteConfig.supportEmail ?? "待配置" },
          { label: "适用范围", value: "站点与账户服务" },
        ]}
        sidebar={
          <ShellPanel className="p-4" tone="soft">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[var(--color-accent)]">摘要</p>
            <div className="mt-3 space-y-2">
              {[
                ["收集原则", "最小必要"],
                ["使用场景", "登录 / 记账 / 安全"],
                ["对外提供", "法律或监管要求除外"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[0.95rem] border border-[var(--color-line)] bg-white px-3 py-2.5">
                  <span className="text-[0.76rem] text-[color:var(--color-muted-ink)]">{label}</span>
                  <span className="text-[0.78rem] font-medium text-[var(--color-ink)]">{value}</span>
                </div>
              ))}
            </div>
          </ShellPanel>
        }
      >
        {sections.map((section) => (
          <ShellPanel key={section.title} className="p-4 md:p-5">
            <h2 className="text-[1rem] font-semibold text-[var(--color-ink)]">{section.title}</h2>
            <ul className="mt-3 space-y-2 text-[0.84rem] leading-6 text-[color:var(--color-muted-ink)]">
              {section.items.map((item) => (
                <li key={item} className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </ShellPanel>
        ))}
      </DocumentScaffold>
    </SiteShell>
  );
}
