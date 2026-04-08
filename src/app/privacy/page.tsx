import { SiteShell } from "@/components/site-shell";
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
      <section className="space-y-4 rounded-[1.6rem] border border-[var(--color-line)] bg-white p-5 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-6">
        <div className="space-y-2">
          <h1 className="font-display text-[1.6rem] leading-none tracking-tight text-[var(--color-ink)]">隐私政策</h1>
          <p className="text-[0.82rem] leading-6 text-[color:var(--color-muted-ink)]">
            生效日期：2026-04-07。联系邮箱：{siteConfig.supportEmail ?? "待配置"}。
          </p>
        </div>
        <div className="grid gap-3">
          {sections.map((section) => (
            <div key={section.title} className="rounded-[1.1rem] border border-[var(--color-line)] bg-[var(--color-paper-soft)] p-4">
              <h2 className="text-[1rem] font-semibold text-[var(--color-ink)]">{section.title}</h2>
              <ul className="mt-2 space-y-1.5 text-[0.84rem] leading-6 text-[color:var(--color-muted-ink)]">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
