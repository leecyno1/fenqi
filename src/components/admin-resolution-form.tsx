"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ResolutionOutcome = "YES" | "NO" | "VOID";

export function AdminResolutionForm({
  marketId,
  marketQuestion,
  openShareCount,
  openPositionCount,
}: {
  marketId: string;
  marketQuestion: string;
  openShareCount: number;
  openPositionCount: number;
}) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<ResolutionOutcome>("YES");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [rationale, setRationale] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const outcomeTone = useMemo(() => {
    if (outcome === "YES") {
      return {
        chip: "bg-[rgba(29,78,216,0.12)] text-[var(--color-accent)] border-[rgba(29,78,216,0.22)]",
        summary: "YES 方向份额按每份 1 积分兑付，NO 方向记为 0。",
      };
    }

    if (outcome === "NO") {
      return {
        chip: "bg-[rgba(198,40,40,0.12)] text-[var(--color-secondary)] border-[rgba(198,40,40,0.22)]",
        summary: "NO 方向份额按每份 1 积分兑付，YES 方向记为 0。",
      };
    }

    return {
      chip: "bg-[rgba(16,32,51,0.08)] text-[var(--color-ink)] border-black/10",
      summary: "市场作废，剩余持仓将按原始成本全额退款，不产生输赢方向。",
    };
  }, [outcome]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(`/api/admin/markets/${marketId}/resolve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        outcome,
        sourceLabel,
        sourceUrl,
        rationale,
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "结算失败。");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(`已完成结算: ${marketQuestion}`);
    setIsSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-[1.9rem] border border-black/10 bg-white p-5 shadow-[0_18px_40px_rgba(16,32,51,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-[var(--color-accent)]">Settlement Console</p>
          <p className="text-lg font-semibold text-[var(--color-ink)]">{marketQuestion}</p>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-muted-ink)]">
            提交 outcome 与公开来源后，将执行终局快照、钱包兑付、PnL 更新、账本落地与持仓清空。
          </p>
        </div>

        <div className="grid min-w-[14rem] grid-cols-2 gap-3">
          <div className="rounded-[1.2rem] border border-black/8 bg-[var(--color-paper)] px-4 py-3">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">未平仓持仓</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{openPositionCount}</p>
          </div>
          <div className="rounded-[1.2rem] border border-black/8 bg-[var(--color-paper)] px-4 py-3">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">未平仓份额</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-ink)]">{openShareCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[1.4rem] border border-black/8 bg-[rgba(11,31,77,0.05)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-[color:var(--color-muted-ink)]">当前选择</p>
            <div className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-medium ${outcomeTone.chip}`}>
              {outcome}
            </div>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[color:var(--color-muted-ink)]">{outcomeTone.summary}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-[var(--color-ink)]">
              结果
              <select
                value={outcome}
                onChange={(event) => setOutcome(event.target.value as ResolutionOutcome)}
                className="rounded-2xl border border-black/10 bg-[var(--color-paper)] px-4 py-3 outline-none transition focus:border-black/25"
              >
                <option value="YES">YES 成立</option>
                <option value="NO">NO 成立</option>
                <option value="VOID">作废退款</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm text-[var(--color-ink)] md:col-span-2">
              来源标题
              <input
                required
                value={sourceLabel}
                onChange={(event) => setSourceLabel(event.target.value)}
                className="rounded-2xl border border-black/10 bg-[var(--color-paper)] px-4 py-3 outline-none transition focus:border-black/25"
                placeholder="例如 国家统计局公告"
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm text-[var(--color-ink)]">
            来源链接
            <input
              required
              type="url"
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              className="rounded-2xl border border-black/10 bg-[var(--color-paper)] px-4 py-3 outline-none transition focus:border-black/25"
              placeholder="https://example.com/source"
            />
          </label>

          <label className="grid gap-2 text-sm text-[var(--color-ink)]">
            说明
            <textarea
              rows={4}
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              className="rounded-2xl border border-black/10 bg-[var(--color-paper)] px-4 py-3 outline-none transition focus:border-black/25"
              placeholder="写清楚为什么按照这个 outcome 结算，避免后续运营复盘时缺上下文。"
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.3rem] border border-[rgba(198,40,40,0.18)] bg-[rgba(198,40,40,0.08)] p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[var(--color-secondary-deep)]">Irreversible Action</p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
              一旦成功提交，市场会进入终态，交易停止，未平仓持仓会被清空并写入账本。
            </p>
          </div>

          <div className="rounded-[1.3rem] border border-black/8 bg-[var(--color-paper)] p-4 text-sm leading-7 text-[color:var(--color-muted-ink)]">
            建议先确认:
            <br />
            1. 来源链接可公开访问
            <br />
            2. outcome 与市场定义完全一致
            <br />
            3. 是否需要用 `VOID` 处理规则歧义或数据失真
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[var(--color-accent-deep)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "结算中..." : "确认结算并写入账本"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-[rgba(198,40,40,0.28)] bg-[rgba(198,40,40,0.08)] px-4 py-3 text-sm text-[var(--color-secondary)]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-[rgba(29,78,216,0.28)] bg-[rgba(29,78,216,0.08)] px-4 py-3 text-sm text-[var(--color-accent)]">
          {successMessage}
        </div>
      ) : null}
    </form>
  );
}
