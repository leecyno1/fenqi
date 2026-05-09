"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { MarketCard } from "@/components/market-card";
import { ShellPanel } from "@/components/shell-panel";
import {
  buildHomeFeedSearch,
  buildHomeFeedSectionAnchorId,
  buildHomeFeedSectionPanelId,
  buildHomeFeedSectionToggleA11yLabel,
  buildHomeFeedSectionToggleLabel,
  canExpandHomeSection,
  countUniqueMarketsInSections,
  defaultHomeFeedControls,
  filterAndSortHomeSections,
  getVisibleHomeSectionMarkets,
  homeFeedSortOptions,
  homeFeedStatusOptions,
  homeFeedTopicOptions,
  parseHomeFeedSearchParams,
  type HomeFeedSort,
  type HomeFeedStatus,
  type HomeFeedTopic,
} from "@/lib/data/home-feed";
import type { HomeEventSection } from "@/lib/data/views";
import { cn } from "@/lib/utils";

type HomeMarketFeedProps = {
  sections: HomeEventSection[];
};

export function HomeMarketFeed({ sections }: HomeMarketFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const controls = useMemo(() => parseHomeFeedSearchParams(searchParams), [searchParams]);

  function updateControls(
    nextPatch: Partial<{ topic: HomeFeedTopic; sort: HomeFeedSort; status: HomeFeedStatus; query: string }>,
  ) {
    const nextControls = {
      ...defaultHomeFeedControls,
      ...controls,
      ...nextPatch,
    };
    const nextSearch = buildHomeFeedSearch(nextControls);
    const href = nextSearch ? `/?${nextSearch}` : "/";

    router.replace(href, { scroll: false });
  }

  function toggleSection(sectionKey: string) {
    setExpandedSections((current) => ({
      ...current,
      [sectionKey]: !current[sectionKey],
    }));
  }

  const visibleSections = useMemo(
    () =>
      filterAndSortHomeSections(sections, {
        topic: controls.topic,
        sort: controls.sort,
        status: controls.status,
        query: controls.query,
      }),
    [controls.query, controls.sort, controls.status, controls.topic, sections],
  );
  const visibleMarketCount = useMemo(() => countUniqueMarketsInSections(visibleSections), [visibleSections]);

  return (
    <section className="mt-8 space-y-4" id="event-feed">
      <ShellPanel className="p-4 md:p-5" tone="soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.34em] text-[var(--color-accent)]">事件库</p>
            <h2 className="mt-2 font-display text-[1.6rem] leading-none text-[var(--color-ink)] md:text-[2.15rem]">
              按题材查看全部事件
            </h2>
            <p className="mt-2 text-[0.84rem] leading-6 text-[color:var(--color-muted-ink)] md:text-[0.92rem]">
              只保留可交易、未过期、可核对来源的事件。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {visibleSections.slice(0, 6).map((section) => (
              <a
                key={section.key}
                href={`#${buildHomeFeedSectionAnchorId(section.key)}`}
                className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-[0.76rem] text-[var(--color-ink)] transition hover:border-[rgba(29,78,216,0.35)] hover:text-[var(--color-accent-deep)]"
              >
                {section.title}
              </a>
            ))}
          </div>
        </div>
      </ShellPanel>

      <ShellPanel className="sticky top-4 z-10 p-3.5 md:p-4" tone="soft">
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-[16rem] flex-1">
            <span className="sr-only">关键词搜索</span>
            <input
              type="search"
              value={controls.query}
              onChange={(event) => updateControls({ query: event.currentTarget.value })}
              placeholder="搜索题面、摘要、球队、资产、事件"
              className="w-full rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-[0.8rem] text-[var(--color-ink)] outline-none transition placeholder:text-[color:var(--color-muted-ink)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[rgba(29,78,216,0.16)]"
            />
          </label>
          {controls.query ? (
            <button
              type="button"
              onClick={() => updateControls({ query: "" })}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-[0.78rem] text-[var(--color-ink)] transition hover:border-[rgba(198,40,40,0.35)]"
            >
              清空
            </button>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {homeFeedSortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateControls({ sort: option.value })}
                className={cn(
                  "rounded-full border px-3 py-2 text-[0.78rem] transition",
                  controls.sort === option.value
                    ? "border-[rgba(198,40,40,0.35)] bg-[var(--color-surface-raised)] text-[var(--color-ink)]"
                    : "border-[var(--color-line)] bg-[var(--color-surface-raised)] text-[color:var(--color-muted-ink)] hover:border-[rgba(29,78,216,0.35)] hover:text-[var(--color-ink)]",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {homeFeedTopicOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateControls({ topic: option.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[0.78rem] transition",
                controls.topic === option.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                  : "border-[var(--color-line)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] hover:border-[rgba(198,40,40,0.35)] hover:bg-[rgba(29,78,216,0.08)]",
              )}
            >
              {option.label}
            </button>
          ))}
          <span className="mx-1 hidden h-4 w-px bg-[var(--color-line)] md:block" />
          {homeFeedStatusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateControls({ status: option.value })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[0.78rem] transition",
                controls.status === option.value
                  ? "border-[rgba(198,40,40,0.38)] bg-[var(--color-surface-raised)] text-[var(--color-secondary-deep)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface-raised)] text-[var(--color-ink)] hover:border-[rgba(29,78,216,0.35)] hover:bg-[rgba(29,78,216,0.09)]",
              )}
            >
              {option.label}
            </button>
          ))}
          <p className="ml-auto text-[0.74rem] text-[color:var(--color-muted-ink)]">
            {visibleSections.length} 个分组 / {visibleMarketCount} 个事件
          </p>
        </div>
      </ShellPanel>

      {visibleSections.length > 0 ? (
        <div className="space-y-5">
          {visibleSections.map((section, index) => (
            <ShellPanel
              key={section.key}
              className="scroll-mt-48 p-4 md:p-5"
              tone={index % 3 === 1 ? "soft" : "default"}
            >
              <section id={buildHomeFeedSectionAnchorId(section.key)} className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.2em] text-[color:var(--color-muted-ink)]">
                      <span className="rounded-full border border-[rgba(29,78,216,0.22)] bg-[rgba(29,78,216,0.08)] px-2.5 py-1 text-[var(--color-accent-deep)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span>{section.markets.length} 个事件</span>
                    </div>
                    <p className="mt-2 font-display text-[1.25rem] leading-none text-[var(--color-ink)] md:text-[1.5rem]">
                      {section.title}
                    </p>
                    <p className="mt-2 text-[0.84rem] leading-6 text-[color:var(--color-muted-ink)]">
                      {section.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canExpandHomeSection(section) ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(section.key)}
                        aria-expanded={Boolean(expandedSections[section.key])}
                        aria-controls={buildHomeFeedSectionPanelId(section.key)}
                        aria-label={buildHomeFeedSectionToggleA11yLabel(section, Boolean(expandedSections[section.key]))}
                        data-section-toggle={section.key}
                        className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface-raised)]/90 px-3.5 py-2 text-[0.8rem] text-[var(--color-ink)] transition hover:border-[rgba(198,40,40,0.38)] hover:bg-[var(--color-surface-raised)]"
                      >
                        {buildHomeFeedSectionToggleLabel(section, Boolean(expandedSections[section.key]))}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div
                  id={buildHomeFeedSectionPanelId(section.key)}
                  className="grid gap-3 xl:grid-cols-3 2xl:grid-cols-4"
                >
                  {getVisibleHomeSectionMarkets(section, Boolean(expandedSections[section.key])).map((market) => (
                    <MarketCard
                      key={`${section.key}-${market.id}`}
                      market={{
                        ...market,
                        href: `/events/${market.slug}`,
                        chartSlug: market.primaryChildMarket?.slug ?? market.slug,
                      }}
                    />
                  ))}
                </div>
              </section>
            </ShellPanel>
          ))}
        </div>
      ) : (
        <ShellPanel className="px-6 py-10 text-center" tone="soft">
          <p className="text-lg font-semibold text-[var(--color-ink)]">当前筛选下没有可展示的市场</p>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted-ink)]">
            请调整关键词、状态或排序后重试。
          </p>
        </ShellPanel>
      )}
    </section>
  );
}
