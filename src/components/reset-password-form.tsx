"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({
  appUrl,
  initialToken,
  initialError,
}: {
  appUrl: string;
  initialToken?: string;
  initialError?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    initialError === "INVALID_TOKEN" ? "重置链接无效或已过期，请重新发起密码重置。" : "",
  );
  const [noticeMessage, setNoticeMessage] = useState("");

  const hasToken = useMemo(() => Boolean(initialToken), [initialToken]);

  async function handleRequestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${appUrl}/reset-password`,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "重置邮件发送失败，请稍后重试。");
      } else {
        setNoticeMessage("如果该邮箱已注册，系统会发送一封重置邮件。");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "重置邮件发送失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await authClient.resetPassword({
        token: initialToken,
        newPassword: password,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "密码重置失败，请稍后重试。");
        return;
      }

      router.push("/sign-in?notice=password-reset");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "密码重置失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-5">
      <div>
        <p className="font-display text-[1.85rem] leading-none tracking-tight text-[var(--color-ink)]">
          {hasToken ? "设置新密码" : "找回密码"}
        </p>
        <p className="mt-3 text-[0.8rem] leading-6 text-[color:var(--color-muted-ink)]">
          {hasToken
            ? "输入新的登录密码。提交成功后会跳回登录页。"
            : "输入注册邮箱，系统会把密码重置链接发到你的邮箱。"}
        </p>
      </div>

      {noticeMessage ? (
        <div className="mt-4 rounded-[1rem] border border-[rgba(29,78,216,0.24)] bg-white px-4 py-2.5 text-[0.78rem] text-[var(--color-accent-deep)]">
          {noticeMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-[1rem] border border-[color:rgba(198,40,40,0.28)] bg-white px-4 py-2.5 text-[0.78rem] text-[var(--color-secondary)]">
          {errorMessage}
        </div>
      ) : null}

      {hasToken ? (
        <form className="mt-5 grid gap-3.5" onSubmit={handleResetPassword}>
          <label className="grid gap-1.5 text-[0.82rem] text-[var(--color-ink)]">
            新密码
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-[1rem] border border-black/10 bg-white px-4 py-2.5 outline-none transition focus:border-black/25"
              placeholder="至少 8 位"
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <button
            disabled={isSubmitting}
            type="submit"
            className="rounded-full bg-[var(--color-accent-deep)] px-5 py-2.75 text-[0.82rem] font-medium text-white transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "处理中..." : "更新密码"}
          </button>
        </form>
      ) : (
        <form className="mt-5 grid gap-3.5" onSubmit={handleRequestReset}>
          <label className="grid gap-1.5 text-[0.82rem] text-[var(--color-ink)]">
            邮箱
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-[1rem] border border-black/10 bg-white px-4 py-2.5 outline-none transition focus:border-black/25"
              placeholder="researcher@example.com"
              autoComplete="email"
            />
          </label>
          <button
            disabled={isSubmitting}
            type="submit"
            className="rounded-full bg-[var(--color-accent-deep)] px-5 py-2.75 text-[0.82rem] font-medium text-white transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "处理中..." : "发送重置邮件"}
          </button>
        </form>
      )}
    </div>
  );
}
