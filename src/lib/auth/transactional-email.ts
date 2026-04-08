import { getPublicSiteConfig } from "@/lib/env";
import { sendTransactionalEmail } from "@/lib/email";

function wrapEmailHtml(title: string, body: string) {
  const site = getPublicSiteConfig();

  return `
    <div style="background:#f6f8fc;padding:32px 16px;font-family:'Noto Sans SC',system-ui,sans-serif;color:#0f172a;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid rgba(11,31,77,0.08);border-radius:18px;overflow:hidden;">
        <div style="padding:20px 24px;border-bottom:1px solid rgba(11,31,77,0.08);background:#0b1f4d;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.72;">${site.name}</div>
          <div style="margin-top:8px;font-size:28px;font-weight:700;line-height:1;">${title}</div>
        </div>
        <div style="padding:24px;">
          ${body}
        </div>
      </div>
    </div>
  `;
}

function buildActionHtml(copy: {
  intro: string;
  actionLabel: string;
  actionUrl: string;
  footnote: string;
}) {
  return `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.8;">${copy.intro}</p>
    <p style="margin:0 0 20px;">
      <a href="${copy.actionUrl}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:600;">
        ${copy.actionLabel}
      </a>
    </p>
    <p style="margin:0 0 12px;font-size:13px;line-height:1.8;color:#475569;">${copy.footnote}</p>
    <p style="margin:0;font-size:12px;line-height:1.7;color:#64748b;word-break:break-all;">
      ${copy.actionUrl}
    </p>
  `;
}

export async function sendVerificationEmailMessage(input: {
  email: string;
  url: string;
}) {
  await sendTransactionalEmail({
    to: input.email,
    subject: "分歧 | 验证你的邮箱",
    text: `请打开这个链接验证邮箱：${input.url}`,
    html: wrapEmailHtml(
      "验证邮箱",
      buildActionHtml({
        intro: "请先完成邮箱验证。验证成功后，账户才能进入仓位与交易相关页面。",
        actionLabel: "验证邮箱",
        actionUrl: input.url,
        footnote: "如果不是你本人发起，可忽略这封邮件。",
      }),
    ),
  });
}

export async function sendPasswordResetEmailMessage(input: {
  email: string;
  url: string;
}) {
  await sendTransactionalEmail({
    to: input.email,
    subject: "分歧 | 重置你的密码",
    text: `请打开这个链接重置密码：${input.url}`,
    html: wrapEmailHtml(
      "重置密码",
      buildActionHtml({
        intro: "我们收到了重置密码请求。打开下面的链接后，可以设置新的登录密码。",
        actionLabel: "设置新密码",
        actionUrl: input.url,
        footnote: "如果不是你本人操作，可忽略这封邮件，原密码不会被修改。",
      }),
    ),
  });
}
