"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

export function SignInForm({
  nextPath,
  allowPublicSignup,
  requireEmailVerification,
  supportEmail,
  initialEmail = "",
  initialNotice = "",
}: {
  nextPath: string;
  allowPublicSignup: boolean;
  requireEmailVerification: boolean;
  supportEmail: string | null;
  initialEmail?: string;
  initialNotice?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState(initialNotice);

  const heading = useMemo(
    () => (mode === "sign-in" ? "登录已有账户" : "创建新账户"),
    [mode],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const normalizedEmail = email.trim();
      const payload = {
        email: normalizedEmail,
        password,
        callbackURL: nextPath,
      };

      const result =
        mode === "sign-in"
          ? await authClient.signIn.email(payload)
          : await authClient.signUp.email({
              ...payload,
              name: name.trim() || normalizedEmail.split("@")[0] || "Researcher",
            });

      if (result.error) {
        const rawMessage = result.error.message ?? "认证失败，请稍后重试。";
        if (/not verified|EMAIL_NOT_VERIFIED/i.test(rawMessage)) {
          setErrorMessage("邮箱尚未验证。系统已按配置补发验证邮件，请先完成验证。");
        } else {
          setErrorMessage(rawMessage);
        }
        setIsSubmitting(false);
        return;
      }

      if (mode === "sign-up" && requireEmailVerification) {
        setNoticeMessage("验证邮件已发送。完成邮箱验证后，才能进入仓位与交易页面。");
        setPassword("");
        setIsSubmitting(false);
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "认证失败，请稍后重试。",
      );
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setErrorMessage("请先输入邮箱。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setNoticeMessage("");

    try {
      const result = await authClient.sendVerificationEmail({
        email: normalizedEmail,
        callbackURL: nextPath,
      });

      if (result.error) {
        setErrorMessage(result.error.message ?? "验证邮件发送失败，请稍后重试。");
      } else {
        setNoticeMessage("验证邮件已发送，请检查收件箱。");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "验证邮件发送失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[1.6rem] border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[0_14px_30px_rgba(11,31,77,0.08)] md:p-5">
      <div className="flex gap-2 rounded-full border border-black/8 bg-white p-1">
        {[
          ["sign-in", "登录"],
          ...(allowPublicSignup ? [["sign-up", "注册"]] : []),
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`flex-1 rounded-full px-4 py-2 text-[0.82rem] transition ${
              mode === value ? "bg-black text-white" : "text-[color:var(--color-muted-ink)]"
            }`}
            onClick={() => {
              setMode(value as AuthMode);
              setErrorMessage("");
              setNoticeMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <p className="font-display text-[1.85rem] leading-none tracking-tight text-[var(--color-ink)]">{heading}</p>
      </div>

      {!allowPublicSignup ? (
        <div className="mt-4 rounded-[1rem] border border-[var(--color-line)] bg-white px-4 py-3 text-[0.78rem] leading-6 text-[color:var(--color-muted-ink)]">
          当前环境为邀请制开户。{supportEmail ? `如需开通，请联系 ${supportEmail}。` : "如需开通，请联系运营方。"}
        </div>
      ) : null}

      {noticeMessage ? (
        <div className="mt-4 rounded-[1rem] border border-[rgba(29,78,216,0.24)] bg-white px-4 py-2.5 text-[0.78rem] text-[var(--color-accent-deep)]">
          {noticeMessage}
        </div>
      ) : null}

      <form className="mt-5 grid gap-3.5" onSubmit={handleSubmit}>
        {allowPublicSignup && mode === "sign-up" ? (
          <label className="grid gap-1.5 text-[0.82rem] text-[var(--color-ink)]">
            昵称
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-[1rem] border border-black/10 bg-white px-4 py-2.5 outline-none transition focus:border-black/25"
              placeholder="例如 研究员"
            />
          </label>
        ) : null}

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

        <label className="grid gap-1.5 text-[0.82rem] text-[var(--color-ink)]">
          密码
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-[1rem] border border-black/10 bg-white px-4 py-2.5 outline-none transition focus:border-black/25"
            placeholder="至少 8 位"
            minLength={8}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />
        </label>

        {errorMessage ? (
          <div className="rounded-[1rem] border border-[color:rgba(198,40,40,0.28)] bg-white px-4 py-2.5 text-[0.78rem] text-[var(--color-secondary)]">
            {errorMessage}
          </div>
        ) : null}

        <button
          disabled={isSubmitting}
          type="submit"
          className="mt-1 rounded-full bg-[var(--color-accent-deep)] px-5 py-2.75 text-[0.82rem] font-medium text-white transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "处理中..." : mode === "sign-in" ? "登录账户" : "创建账户"}
        </button>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.76rem] text-[color:var(--color-muted-ink)]">
          <button
            type="button"
            className="transition hover:text-[var(--color-ink)]"
            onClick={() => router.push("/reset-password")}
          >
            忘记密码
          </button>
          {requireEmailVerification ? (
            <button
              type="button"
              className="transition hover:text-[var(--color-ink)]"
              onClick={handleResendVerification}
              disabled={isSubmitting}
            >
              重发验证邮件
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
