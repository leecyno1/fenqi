"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminMarketFormInput } from "@/lib/admin/market-form";

type FormState = AdminMarketFormInput;

const emptyState: FormState = {
  question: "",
  slug: "",
  image: "",
  sourceName: "",
  sourceUrl: "",
  newsImageSource: "",
  priceAnchorMode: "local",
  brief: "",
  tone: "",
  category: "technology",
  status: "draft",
  liquidity: "100",
  yesShares: "0",
  noShares: "0",
  volumePoints: "0",
  activeTraders: "0",
  closesAt: "",
  resolvesAt: "",
  evidence: "",
  resolutionSources: "",
};

export function AdminMarketForm({
  action = "/api/admin/markets",
  buttonLabel = "创建市场",
  successPrefix = "市场已创建",
  title = "Create Market",
  description = "录入市场定义与来源信息。",
  method = "POST",
  initialValues,
}: {
  action?: string;
  buttonLabel?: string;
  successPrefix?: string;
  title?: string;
  description?: string;
  method?: "POST" | "PATCH";
  initialValues?: FormState;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialValues ?? emptyState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const response = await fetch(action, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const payload = (await response.json()) as { error?: string; market?: { slug: string } };

    if (!response.ok) {
      setErrorMessage(payload.error ?? "创建市场失败。");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(`${successPrefix}: ${payload.market?.slug ?? form.slug}`);
    if (method === "POST") {
      setForm(emptyState);
    }
    setIsSubmitting(false);
    router.refresh();
  }

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <form className="space-y-3.5" onSubmit={handleSubmit}>
      <div>
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-white/55">{title}</p>
        <p className="mt-2 text-[0.8rem] leading-5 text-white/68">{description}</p>
      </div>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        市场问题
        <input
          required
          value={form.question}
          onChange={(event) => updateField("question", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder="例如 2026 年底前，中国会出现稳定商用 Agent OS 吗？"
        />
      </label>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        Slug
        <input
          required
          value={form.slug}
          onChange={(event) => updateField("slug", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder="cn-agent-os-2026"
        />
      </label>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        手动覆盖图
        <input
          value={form.image}
          onChange={(event) => updateField("image", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder="/event-photo/crypto.jpg 或 https://example.com/image.jpg"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-1.5 text-[0.8rem] text-white">
          外部来源名
          <input
            value={form.sourceName}
            onChange={(event) => updateField("sourceName", event.target.value)}
            className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
            placeholder="Polymarket / Reuters"
          />
        </label>

        <label className="grid gap-1.5 text-[0.8rem] text-white md:col-span-2">
          外部来源链接
          <input
            value={form.sourceUrl}
            onChange={(event) => updateField("sourceUrl", event.target.value)}
            className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
            placeholder="https://polymarket.com/event/..."
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        图片来源标记
        <input
          value={form.newsImageSource}
          onChange={(event) => updateField("newsImageSource", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder="news / polymarket / manual"
        />
      </label>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        盘口模式
        <select
          value={form.priceAnchorMode ?? "local"}
          onChange={(event) => updateField("priceAnchorMode", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
        >
          <option value="external">外部锚定</option>
          <option value="hybrid">混合盘口</option>
          <option value="local">本地盘口</option>
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-[0.8rem] text-white">
          类别
          <select
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          >
            <option value="technology">科技</option>
            <option value="finance">财经</option>
            <option value="current_affairs">时事</option>
          </select>
        </label>

        <label className="grid gap-1.5 text-[0.8rem] text-white">
          初始状态
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          >
            <option value="draft">草稿</option>
            <option value="review">待审核</option>
            <option value="live">进行中</option>
            <option value="locked">锁盘中</option>
          </select>
        </label>
      </div>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        简介
        <textarea
          required
          rows={3}
          value={form.brief}
          onChange={(event) => updateField("brief", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder="简要描述这个市场为什么值得建。"
        />
      </label>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        市场语气
        <textarea
          required
          rows={3}
          value={form.tone}
          onChange={(event) => updateField("tone", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder="例如 这是一个偏科技叙事的长期观察市场。"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-[0.8rem] text-white">
          锁盘时间
          <input
            required
            type="datetime-local"
            value={form.closesAt}
            onChange={(event) => updateField("closesAt", event.target.value)}
            className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          />
        </label>

        <label className="grid gap-1.5 text-[0.8rem] text-white">
          结算时间
          <input
            required
            type="datetime-local"
            value={form.resolvesAt}
            onChange={(event) => updateField("resolvesAt", event.target.value)}
            className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          ["liquidity", "流动性", form.liquidity],
          ["yesShares", "YES 初始份额", form.yesShares],
          ["noShares", "NO 初始份额", form.noShares],
          ["volumePoints", "积分量级", form.volumePoints],
          ["activeTraders", "活跃分析者", form.activeTraders],
        ].map(([key, label, value]) => (
          <label key={key} className="grid gap-1.5 text-[0.8rem] text-white">
            {label}
            <input
              required
              type="number"
              min="0"
              value={value}
              onChange={(event) => updateField(key as keyof FormState, event.target.value)}
              className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
            />
          </label>
        ))}
      </div>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        证据线索
        <textarea
          required
          rows={4}
          value={form.evidence}
          onChange={(event) => updateField("evidence", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder={"每行一条\n例如 关注正式发布\n关注开发者生态"}
        />
      </label>

      <label className="grid gap-1.5 text-[0.8rem] text-white">
        结算来源
        <textarea
          required
          rows={4}
          value={form.resolutionSources}
          onChange={(event) => updateField("resolutionSources", event.target.value)}
          className="rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2.5 text-white outline-none transition focus:border-white/25"
          placeholder={"每行格式: 标签|https://example.com\n例如 官方公告|https://example.com/notice"}
        />
      </label>

      {errorMessage ? (
        <div className="rounded-[1rem] border border-[rgba(198,40,40,0.28)] bg-[rgba(198,40,40,0.12)] px-4 py-2.5 text-[0.78rem] text-[#ffb39f]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-[1rem] border border-[rgba(29,78,216,0.28)] bg-[rgba(29,78,216,0.12)] px-4 py-2.5 text-[0.78rem] text-[#d9e6ff]">
          {successMessage}
        </div>
      ) : null}

      <button
        disabled={isSubmitting}
        type="submit"
        className="w-full rounded-full bg-white px-5 py-2.75 text-[0.82rem] font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "提交中..." : buttonLabel}
      </button>
    </form>
  );
}
