import { ResetPasswordForm } from "@/components/reset-password-form";
import { SiteShell } from "@/components/site-shell";
import { getPublicSiteConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const siteConfig = getPublicSiteConfig();

  return (
    <SiteShell hideHero>
      <div className="mx-auto w-full max-w-md">
        <ResetPasswordForm
          appUrl={siteConfig.appUrl}
          initialToken={params.token}
          initialError={params.error}
        />
      </div>
    </SiteShell>
  );
}
