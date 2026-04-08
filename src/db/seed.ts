import "dotenv/config";

import { eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { buildInitialWalletArtifacts, INITIAL_CREDITS } from "@/lib/auth/bootstrap";
import { getMarkets, getPortfolioSnapshot } from "@/lib/demo-data";
import { buildStandaloneEventId, buildStandaloneEventValues } from "@/lib/events/standalone-event";
import { createMarketState, getMarketProbabilities } from "@/lib/markets/lmsr";
import { scaleDownPoints } from "@/lib/points";

import { db } from "./client";
import {
  marketEvents,
  markets,
  positions,
  priceSnapshots,
  resolutions,
  users,
  virtualWallets,
  walletLedger,
} from "./schema";

const categoryMap = {
  科技: "technology",
  财经: "finance",
  时事: "current_affairs",
} as const;

function mapSeedCategory(category: keyof typeof categoryMap | "technology" | "finance" | "current_affairs") {
  switch (category) {
    case "科技":
    case "财经":
    case "时事":
      return categoryMap[category];
    default:
      return category;
  }
}

async function ensureUser(input: {
  name: string;
  email: string;
  password: string;
  role?: "user" | "admin";
  walletBalance?: number;
  lifetimePnL?: number;
}) {
  const [existing] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  const user =
    existing ??
    (
      await auth.api.signUpEmail({
        body: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
      })
    ).user;

  await db
    .update(users)
    .set({
      name: input.name,
      role: input.role ?? "user",
      emailVerified: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  const [wallet] = await db
    .select({
      id: virtualWallets.id,
    })
    .from(virtualWallets)
    .where(eq(virtualWallets.userId, user.id))
    .limit(1);

  if (!wallet) {
    const artifacts = buildInitialWalletArtifacts({ userId: user.id });

    await db.insert(virtualWallets).values(artifacts.wallet).onConflictDoNothing();
    await db.insert(walletLedger).values(artifacts.ledger).onConflictDoNothing();
  }

  const [freshWallet] = await db
    .select({
      id: virtualWallets.id,
    })
    .from(virtualWallets)
    .where(eq(virtualWallets.userId, user.id))
    .limit(1);

  if (!freshWallet) {
    throw new Error(`Failed to load wallet for ${input.email}`);
  }

  if (
    typeof input.walletBalance === "number" ||
    typeof input.lifetimePnL === "number"
  ) {
    const balance = input.walletBalance ?? INITIAL_CREDITS;
    const lifetimePnL = input.lifetimePnL ?? 0;

    await db
      .update(virtualWallets)
      .set({
        balance,
        lifetimePnL,
        updatedAt: new Date(),
      })
      .where(eq(virtualWallets.userId, user.id));

    await db
      .insert(walletLedger)
      .values({
        id: `seed-adjustment-${user.id}`,
        walletId: freshWallet.id,
        marketId: null,
        entryType: "admin_adjustment",
        amount: balance - INITIAL_CREDITS,
        balanceAfter: balance,
        memo: "Seed wallet state alignment",
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: walletLedger.id,
        set: {
          amount: balance - INITIAL_CREDITS,
          balanceAfter: balance,
          memo: "Seed wallet state alignment",
          createdAt: new Date(),
        },
      });
  }

  const [freshUser] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!freshUser) {
    throw new Error(`Failed to load seeded user ${input.email}`);
  }

  return {
    ...freshUser,
    walletId: freshWallet.id,
  };
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed is disabled in production. Use pnpm bootstrap:admin for the first operator account.");
  }

  const admin = await ensureUser({
    name: "运营示例账号",
    email: "admin@pulse.local",
    password: "Admin123456!",
    role: "admin",
    walletBalance: INITIAL_CREDITS,
    lifetimePnL: 0,
  });

  const portfolioSnapshot = getPortfolioSnapshot();

  const analyst = await ensureUser({
    name: "北岸观察",
    email: "analyst@pulse.local",
    password: "Analyst123456!",
    role: "user",
    walletBalance: scaleDownPoints(portfolioSnapshot.user.credits),
    lifetimePnL: scaleDownPoints(portfolioSnapshot.summary.resolvedPnl),
  });

  const macro = await ensureUser({
    name: "北岸宏观",
    email: "macro@pulse.local",
    password: "Macro123456!",
    role: "user",
    walletBalance: scaleDownPoints(121180),
    lifetimePnL: scaleDownPoints(16110),
  });

  const seededMarkets = getMarkets();
  const settlementFixtureState = createMarketState({
    liquidity: 118,
    yesShares: 52,
    noShares: 68,
  });
  const settlementFixtureProbability = getMarketProbabilities(settlementFixtureState);
  const supplementalMarkets = [
    {
      id: "mkt_cn_ai_glasses_q1_2026",
      slug: "cn-ai-glasses-q1-2026-shipment",
      question: "2026 年第一季度，中国 AI 眼镜出货量会突破 150 万台吗？",
      brief:
        "这个市场已经过了锁盘时间，适合用于验收后台结算台、来源录入和持仓兑付链路。",
      tone: "产业发布节奏已经兑现，真正需要确认的是最终口径与结算来源是否一致。",
      category: "technology" as const,
      status: "locked" as const,
      liquidity: 118,
      yesShares: 52,
      noShares: 68,
      volumePoints: 182400,
      activeTraders: 2,
      closesAt: "2026-03-28T18:00:00+08:00",
      resolvesAt: "2026-04-02T12:00:00+08:00",
      evidence: [
        "重点看季度累计出货，不看发布会单日热度。",
        "需要以统一公开口径作为结算依据，避免渠道数据口径冲突。",
        "这个市场专门保留未平仓仓位，供后台结算验收使用。",
      ],
      resolutionSource: [
        {
          label: "IDC China AR/AI Wearables Tracker",
          href: "https://www.idc.com/",
        },
        {
          label: "Counterpoint Smart Glasses Shipment Tracker",
          href: "https://www.counterpointresearch.com/",
        },
      ],
      probability: settlementFixtureProbability,
    },
  ];
  const marketSeeds = [...seededMarkets, ...supplementalMarkets];

  for (const market of marketSeeds) {
    const eventId = buildStandaloneEventId(market.id);

    await db
      .insert(marketEvents)
      .values(
        buildStandaloneEventValues({
          id: eventId,
          slug: market.slug,
          title: market.question,
          brief: market.brief,
          tone: market.tone,
          category: mapSeedCategory(market.category),
          resolutionSources: market.resolutionSource,
          evidence: market.evidence,
          sourceName: null,
          sourceUrl: null,
          image: null,
        }),
      )
      .onConflictDoUpdate({
        target: marketEvents.id,
        set: {
          slug: market.slug,
          title: market.question,
          brief: market.brief,
          tone: market.tone,
          category: mapSeedCategory(market.category),
          resolutionSources: market.resolutionSource,
          evidence: market.evidence,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(markets)
      .values({
        id: market.id,
        eventId,
        slug: market.slug,
        externalMarketId: market.id,
        externalMarketSlug: market.slug,
        answerLabel: "主市场",
        answerOrder: 1,
        question: market.question,
        brief: market.brief,
        tone: market.tone,
        category: mapSeedCategory(market.category),
        status: market.status,
        liquidity: market.liquidity,
        yesShares: market.yesShares,
        noShares: market.noShares,
        volumePoints: scaleDownPoints(market.volumePoints),
        activeTraders: market.activeTraders,
        closesAt: new Date(market.closesAt),
        resolvesAt: new Date(market.resolvesAt),
        resolutionSources: market.resolutionSource,
        evidence: market.evidence,
        createdBy: admin.id,
      })
      .onConflictDoUpdate({
        target: markets.id,
        set: {
          slug: market.slug,
          question: market.question,
          brief: market.brief,
          tone: market.tone,
          category: mapSeedCategory(market.category),
          status: market.status,
          liquidity: market.liquidity,
          yesShares: market.yesShares,
          noShares: market.noShares,
          volumePoints: scaleDownPoints(market.volumePoints),
          activeTraders: market.activeTraders,
          closesAt: new Date(market.closesAt),
          resolvesAt: new Date(market.resolvesAt),
          resolutionSources: market.resolutionSource,
          evidence: market.evidence,
          createdBy: admin.id,
          updatedAt: new Date(),
        },
      });

    await db
      .insert(priceSnapshots)
      .values({
        id: `snapshot-${market.id}`,
        marketId: market.id,
        yesProbabilityBps: Math.round(market.probability.yes * 10000),
        noProbabilityBps: Math.round(market.probability.no * 10000),
      })
      .onConflictDoUpdate({
        target: priceSnapshots.id,
        set: {
          yesProbabilityBps: Math.round(market.probability.yes * 10000),
          noProbabilityBps: Math.round(market.probability.no * 10000),
          recordedAt: new Date(),
        },
      });

    if ((market.status === "resolved" || market.status === "voided") && market.resolutionOutcome) {
      await db
        .insert(resolutions)
        .values({
          marketId: market.id,
          outcome: market.resolutionOutcome,
          sourceLabel: market.resolutionSource[0]?.label ?? "Seed resolution source",
          sourceUrl: market.resolutionSource[0]?.href ?? "https://example.com",
          rationale: "Seeded terminal market for homepage and detail-state coverage.",
          resolvedBy: admin.id,
          resolvedAt: new Date(market.resolvesAt),
        })
        .onConflictDoUpdate({
          target: resolutions.marketId,
          set: {
            outcome: market.resolutionOutcome,
            sourceLabel: market.resolutionSource[0]?.label ?? "Seed resolution source",
            sourceUrl: market.resolutionSource[0]?.href ?? "https://example.com",
            rationale: "Seeded terminal market for homepage and detail-state coverage.",
            resolvedBy: admin.id,
            resolvedAt: new Date(market.resolvesAt),
          },
        });
    } else {
      await db.delete(resolutions).where(eq(resolutions.marketId, market.id));
    }
  }

  for (const holding of portfolioSnapshot.holdings) {
    const market = marketSeeds.find((item) => item.slug === holding.marketSlug);

    if (!market) {
      continue;
    }

    await db
      .insert(positions)
      .values({
        userId: analyst.id,
        marketId: market.id,
        side: holding.side,
        shareCount: holding.shares,
        totalCost: scaleDownPoints(holding.totalCost),
      })
      .onConflictDoUpdate({
        target: [positions.userId, positions.marketId, positions.side],
        set: {
          shareCount: holding.shares,
          totalCost: scaleDownPoints(holding.totalCost),
          updatedAt: new Date(),
        },
      });
  }

  for (const position of [
    {
      userId: analyst.id,
      marketId: "mkt_cn_ai_glasses_q1_2026",
      side: "YES" as const,
      shareCount: 14,
      totalCost: scaleDownPoints(792),
    },
    {
      userId: macro.id,
      marketId: "mkt_cn_ai_glasses_q1_2026",
      side: "NO" as const,
      shareCount: 11,
      totalCost: scaleDownPoints(583),
    },
  ]) {
    await db
      .insert(positions)
      .values(position)
      .onConflictDoUpdate({
        target: [positions.userId, positions.marketId, positions.side],
        set: {
          shareCount: position.shareCount,
          totalCost: position.totalCost,
          updatedAt: new Date(),
        },
      });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
