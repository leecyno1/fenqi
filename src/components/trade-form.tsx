"use client";

import { useEffect, useMemo, useState } from "react";

import { formatPercent, formatPoints } from "@/lib/format";

type MarketSide = "YES" | "NO";
type TradeAction = "buy" | "sell";

type Quote = {
  amount: number;
  averagePrice: number;
};

type TradeFormProps = {
  slug: string;
  userBalance: number | null;
  isAuthenticated: boolean;
  isTradingOpen: boolean;
  yesProbability: number;
  noProbability: number;
  availableShares: Record<MarketSide, number>;
  resolution: {
    outcome: "YES" | "NO" | "VOID";
    sourceLabel: string;
    sourceUrl: string;
    rationale: string | null;
  } | null;
};

const QUICK_SIZES = [2, 5, 10, 20] as const;

function formatPrice(value: number) {
  return value.toFixed(3).replace(/\.?0+$/, "");
}

export function TradeForm({
  slug,
  userBalance,
  isAuthenticated,
  isTradingOpen,
  yesProbability,
  noProbability,
  availableShares,
  resolution,
}: TradeFormProps) {
  const [action, setAction] = useState<TradeAction>("buy");
  const [side, setSide] = useState<MarketSide>("YES");
  const [shareCount, setShareCount] = useState<string>("5");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const parsedShareCount = useMemo(() => parseInt(shareCount, 10), [shareCount]);
  const sellLimit = availableShares[side] ?? 0;
  const insufficientShares =
    action === "sell" && (!Number.isFinite(parsedShareCount) || parsedShareCount > sellLimit);

  useEffect(() => {
    if (!isTradingOpen || resolution) {
      setQuote(null);
      return;
    }

    if (!Number.isFinite(parsedShareCount) || parsedShareCount <= 0 || insufficientShares) {
      setQuote(null);
      return;
    }

    const fetchQuote = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/markets/${slug}/quote?action=${action}&side=${side}&shareCount=${parsedShareCount}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch quote");
        }

        const data = await response.json();
        setQuote({
          amount: data.amount,
          averagePrice: data.averagePrice,
        });
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchQuote, 250);
    return () => clearTimeout(timeoutId);
  }, [action, insufficientShares, isTradingOpen, parsedShareCount, resolution, side, slug]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!isAuthenticated) {
      setError("请先登录");
      return;
    }

    if (!isTradingOpen || resolution) {
      setError("当前市场不可交易");
      return;
    }

    if (!Number.isFinite(parsedShareCount) || parsedShareCount <= 0) {
      setError("请输入有效的份额数量");
      return;
    }

    if (insufficientShares) {
      setError("可卖份额不足");
      return;
    }

    if (action === "buy" && quote && userBalance !== null && quote.amount > userBalance) {
      setError("余额不足");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/markets/${slug}/trade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          side,
          shareCount: parsedShareCount,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to execute trade");
      }

      setSuccess(true);
      setShareCount("5");

      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const insufficientBalance =
    action === "buy" && quote && userBalance !== null && quote.amount > userBalance;

  const sideCards: Array<{ side: MarketSide; probability: number }> = [
    { side: "YES", probability: yesProbability },
    { side: "NO", probability: noProbability },
  ];

  if (resolution) {
    return (
      <div className="overflow-hidden rounded-[1.45rem] border border-black/10 bg-[var(--color-ink)] text-white shadow-[0_22px_56px_rgba(16,32,51,0.18)]">
        <div className="border-b border-white/10 bg-[rgba(29,78,216,0.2)] px-4 py-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/60">Resolved Market</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.8rem] text-white/65">最终结果</p>
              <p className="mt-1.5 text-3xl font-semibold tracking-tight">{resolution.outcome}</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.24em] text-white/70">
              只读
            </div>
          </div>
        </div>

        <div className="space-y-3 px-4 py-4">
          <div className="rounded-[1.1rem] border border-white/10 bg-white/6 p-3.5">
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-white/50">结算来源</p>
            <p className="mt-2 text-[0.95rem] font-medium text-white">{resolution.sourceLabel}</p>
            {resolution.rationale ? (
              <p className="mt-2 text-[0.8rem] leading-5 text-white/72">{resolution.rationale}</p>
            ) : null}
          </div>

          <a
            href={resolution.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full border border-white/12 bg-white/8 px-4 py-2.5 text-[0.82rem] font-medium text-white transition hover:bg-white/12"
          >
            查看结算依据
          </a>
        </div>
      </div>
    );
  }

  if (!isTradingOpen) {
    return (
      <div className="overflow-hidden rounded-[1.45rem] border border-black/10 bg-[var(--color-ink)] text-white shadow-[0_22px_56px_rgba(16,32,51,0.18)]">
        <div className="border-b border-white/10 bg-[rgba(198,40,40,0.2)] px-4 py-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/60">Trading Closed</p>
          <p className="mt-3 text-[1.35rem] font-semibold tracking-tight">当前市场已锁盘</p>
        </div>
        <div className="px-4 py-4 text-[0.82rem] leading-6 text-white/76">
          交易窗口已经结束，当前只保留价格历史、证据来源与终局结算信息展示。
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.45rem] border border-black/10 bg-[var(--color-ink)] text-white shadow-[0_22px_56px_rgba(16,32,51,0.18)]">
      <div className="border-b border-white/10 bg-[rgba(29,78,216,0.14)] px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/55">交易面板</p>
            <h3 className="mt-2 font-display text-[1.45rem] tracking-tight">
              {action === "buy" ? "买入建仓" : "卖出减仓"}
            </h3>
          </div>
          <div className="rounded-[1rem] border border-white/10 bg-white/6 px-3 py-2.5 text-right">
            <p className="text-[0.58rem] uppercase tracking-[0.24em] text-white/50">可用积分</p>
            <p className="mt-1.5 text-[1.35rem] font-semibold tracking-tight">
              {userBalance === null ? "--" : formatPoints(userBalance)}
            </p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {sideCards.map((item) => (
            <button
              key={item.side}
              type="button"
              onClick={() => setSide(item.side)}
              className={`rounded-[0.95rem] border px-3 py-2.5 text-left transition ${
                side === item.side
                  ? item.side === "YES"
                    ? "border-[rgba(29,78,216,0.55)] bg-[rgba(29,78,216,0.26)]"
                    : "border-[rgba(198,40,40,0.55)] bg-[rgba(198,40,40,0.26)]"
                  : "border-white/10 bg-white/6 hover:bg-white/10"
              }`}
            >
              <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/56">{item.side}</p>
              <p className="mt-1 text-[1.05rem] font-semibold tracking-tight">{formatPercent(item.probability)}</p>
              <p className="mt-1.5 text-[0.68rem] text-white/62">
                {action === "sell"
                  ? `可卖 ${formatPoints(availableShares[item.side])} 份`
                  : "当前票面"}
              </p>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[0.84rem] font-medium">动作</label>
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-white/45">buy / sell</span>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-[1rem] border border-white/10 bg-white/4 p-1">
            {([
              ["buy", "买入"],
              ["sell", "卖出"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAction(value);
                  setError(null);
                }}
                className={`rounded-[0.8rem] px-4 py-2.5 text-[0.82rem] font-medium transition ${
                  action === value
                    ? "bg-white text-[var(--color-ink)]"
                    : "text-white/62 hover:bg-white/8 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="shareCount" className="text-[0.84rem] font-medium">
              份额数量
            </label>
            <span className="text-[0.7rem] text-white/45">{action === "sell" ? `上限 ${formatPoints(sellLimit)}` : "整数份额"}</span>
          </div>
          <input
            id="shareCount"
            type="number"
            min="1"
            step="1"
            value={shareCount}
            onChange={(event) => setShareCount(event.target.value)}
            className="w-full rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-[1rem] text-white placeholder-white/35 outline-none transition focus:border-white/24 focus:bg-white/10"
            placeholder="输入份额数量"
          />
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            {QUICK_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setShareCount(String(size))}
                className="rounded-full border border-white/10 px-3 py-1.5 text-[0.7rem] font-medium text-white/68 transition hover:bg-white/8 hover:text-white"
              >
                {size} 份
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.1rem] border border-white/10 bg-white/8 p-3.5">
          <div className="mb-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.22em] text-white/50">
            <span>即时成交估算</span>
            <span>{action.toUpperCase()} · {side}</span>
          </div>
          {loading ? (
            <div className="rounded-[0.95rem] border border-white/8 bg-black/18 px-3 py-3 text-[0.8rem] text-white/60">
              更新报价中...
            </div>
          ) : quote ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[0.95rem] bg-black/18 p-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/48">
                    {action === "buy" ? "预计成本" : "预计返还"}
                  </p>
                  <p className="mt-2 text-[1.3rem] font-semibold tracking-tight">{formatPrice(quote.amount)}</p>
                </div>
                <div className="rounded-[0.95rem] bg-black/18 p-3">
                  <p className="text-[0.58rem] uppercase tracking-[0.22em] text-white/48">均价(积分/份)</p>
                  <p className="mt-2 text-[1.3rem] font-semibold tracking-tight">{formatPrice(quote.averagePrice)}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between rounded-[0.9rem] border border-white/8 px-3 py-2.5 text-[0.78rem]">
                <span className="text-white/58">本次操作</span>
                <span className="font-medium text-white">
                  {action === "buy" ? "建仓" : "减仓"} {side} · {Number.isFinite(parsedShareCount) ? formatPoints(parsedShareCount) : "--"} 份
                </span>
              </div>
            </>
          ) : (
            <div className="rounded-[0.95rem] border border-white/8 bg-black/18 px-3 py-3 text-[0.78rem] text-white/58">
              输入份额后显示成交估算。
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-[0.95rem] border border-[rgba(198,40,40,0.28)] bg-[rgba(198,40,40,0.22)] px-3.5 py-2.5 text-[0.78rem] text-[#ffe0df]">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-[0.95rem] border border-[rgba(29,78,216,0.3)] bg-[rgba(29,78,216,0.2)] px-3.5 py-2.5 text-[0.78rem] text-[#deebff]">
            交易已提交，页面即将刷新。
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!isAuthenticated || submitting || insufficientBalance || insufficientShares || !quote}
          className="w-full rounded-full bg-white px-6 py-3 text-[0.82rem] font-medium text-[var(--color-ink)] transition hover:bg-white/92 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "提交中..."
            : !isAuthenticated
              ? "请先登录"
              : insufficientShares
                ? "可卖份额不足"
                : insufficientBalance
                  ? "余额不足"
                  : action === "buy"
                    ? `确认买入 ${side}`
                    : `确认卖出 ${side}`}
        </button>
      </form>
    </div>
  );
}
