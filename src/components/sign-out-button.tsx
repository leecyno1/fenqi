"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-full border border-white/75 bg-white/68 px-4 py-2 text-[var(--color-ink)] shadow-[0_8px_18px_rgba(31,39,55,0.06)] transition hover:bg-white"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      退出登录
    </button>
  );
}
