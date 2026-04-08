import { redirect } from "next/navigation";

import { SignInForm } from "@/components/sign-in-form";
import { SiteShell } from "@/components/site-shell";
import { getAuthPolicy, getPublicSiteConfig } from "@/lib/env";
import { getOptionalSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string; notice?: string }>;
}) {
  const session = await getOptionalSession();
  const params = await searchParams;
  const authPolicy = getAuthPolicy();
  const siteConfig = getPublicSiteConfig();

  if (session) {
    redirect(params.next ?? "/");
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-md">
        <SignInForm
          nextPath={params.next ?? "/"}
          allowPublicSignup={authPolicy.allowPublicSignup}
          requireEmailVerification={authPolicy.requireEmailVerification}
          supportEmail={siteConfig.supportEmail}
          initialEmail={params.email ?? ""}
          initialNotice={
            params.notice === "password-reset"
              ? "密码已更新，请使用新密码重新登录。"
              : params.notice === "verify-sent"
                ? "验证邮件已发送，请先完成邮箱验证。"
                : ""
          }
        />
      </div>
    </SiteShell>
  );
}
