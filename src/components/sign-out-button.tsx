"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="rounded-full border border-black/10 bg-[var(--color-paper)] px-4 py-2 text-[var(--color-ink)] transition hover:border-black/20 hover:bg-white"
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
