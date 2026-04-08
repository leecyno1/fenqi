import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const marketCategoryEnum = pgEnum("market_category", ["current_affairs", "technology", "finance"]);
export const marketStatusEnum = pgEnum("market_status", ["draft", "review", "live", "locked", "resolved", "voided"]);
export const marketSideEnum = pgEnum("market_side", ["YES", "NO"]);
export const marketOutcomeEnum = pgEnum("market_outcome", ["YES", "NO", "VOID"]);
export const tradeActionEnum = pgEnum("trade_action", ["buy", "sell"]);
export const priceAnchorModeEnum = pgEnum("price_anchor_mode", ["external", "hybrid", "local"]);
export const jobRunStatusEnum = pgEnum("job_run_status", ["running", "success", "error"]);
export const ledgerEntryTypeEnum = pgEnum("ledger_entry_type", [
  "bootstrap_grant",
  "trade_debit",
  "trade_credit",
  "resolution_payout",
  "void_refund",
  "admin_adjustment",
]);

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("account_user_id_idx").on(table.userId),
    uniqueIndex("account_provider_account_unique").on(table.providerId, table.accountId),
  ],
);

export const verifications = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const virtualWallets = pgTable("virtual_wallet", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  balance: integer("balance").notNull().default(0),
  lifetimePnL: integer("lifetime_pnl").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const walletLedger = pgTable(
  "wallet_ledger",
  {
    id: text("id").primaryKey(),
    walletId: text("wallet_id")
      .notNull()
      .references(() => virtualWallets.id, { onDelete: "cascade" }),
    marketId: text("market_id"),
    entryType: ledgerEntryTypeEnum("entry_type").notNull(),
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    memo: text("memo"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("wallet_ledger_wallet_id_idx").on(table.walletId)],
);

export const marketEvents = pgTable(
  "market_event",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    image: text("image"),
    externalSource: text("external_source"),
    externalEventId: text("external_event_id"),
    externalEventSlug: text("external_event_slug"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    canonicalSourceUrl: text("canonical_source_url"),
    externalImageUrl: text("external_image_url"),
    newsImageUrl: text("news_image_url"),
    newsImageCachedUrl: text("news_image_cached_url"),
    newsImageSource: text("news_image_source"),
    newsReferences: jsonb("news_references"),
    heatScore: integer("heat_score").notNull().default(0),
    controversyScore: integer("controversy_score").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    title: text("title").notNull(),
    brief: text("brief").notNull(),
    tone: text("tone").notNull(),
    category: marketCategoryEnum("category").notNull(),
    resolutionSources: jsonb("resolution_sources").notNull(),
    evidence: jsonb("evidence").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("market_event_external_source_idx").on(table.externalSource),
    uniqueIndex("market_event_external_source_id_unique").on(
      table.externalSource,
      table.externalEventId,
    ),
  ],
);

export const markets = pgTable(
  "market",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => marketEvents.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    image: text("image"),
    externalSource: text("external_source"),
    externalId: text("external_id"),
    externalSlug: text("external_slug"),
    externalMarketId: text("external_market_id"),
    externalMarketSlug: text("external_market_slug"),
    answerLabel: text("answer_label").notNull().default("主市场"),
    answerOrder: integer("answer_order").notNull().default(1),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    canonicalSourceUrl: text("canonical_source_url"),
    externalImageUrl: text("external_image_url"),
    newsImageUrl: text("news_image_url"),
    newsImageCachedUrl: text("news_image_cached_url"),
    newsImageSource: text("news_image_source"),
    newsReferences: jsonb("news_references"),
    heatScore: integer("heat_score").notNull().default(0),
    controversyScore: integer("controversy_score").notNull().default(0),
    isFeatured: boolean("is_featured").notNull().default(false),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    externalYesProbabilityBps: integer("external_yes_probability_bps"),
    externalNoProbabilityBps: integer("external_no_probability_bps"),
    externalPriceUpdatedAt: timestamp("external_price_updated_at", { withTimezone: true }),
    externalPriceStale: boolean("external_price_stale").notNull().default(false),
    priceAnchorMode: priceAnchorModeEnum("price_anchor_mode").notNull().default("local"),
    clobTokenIds: jsonb("clob_token_ids"),
    question: text("question").notNull(),
    brief: text("brief").notNull(),
    tone: text("tone").notNull(),
    category: marketCategoryEnum("category").notNull(),
    status: marketStatusEnum("status").notNull().default("draft"),
    liquidity: integer("liquidity").notNull(),
    yesShares: integer("yes_shares").notNull().default(0),
    noShares: integer("no_shares").notNull().default(0),
    volumePoints: integer("volume_points").notNull().default(0),
    activeTraders: integer("active_traders").notNull().default(0),
    closesAt: timestamp("closes_at", { withTimezone: true }).notNull(),
    resolvesAt: timestamp("resolves_at", { withTimezone: true }).notNull(),
    resolutionSources: jsonb("resolution_sources").notNull(),
    evidence: jsonb("evidence").notNull(),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("market_status_idx").on(table.status),
    index("market_event_id_idx").on(table.eventId),
    index("market_external_source_idx").on(table.externalSource),
    uniqueIndex("market_external_source_market_id_unique").on(
      table.externalSource,
      table.externalMarketId,
    ),
  ],
);

export const trades = pgTable(
  "trade",
  {
    id: text("id").primaryKey(),
    marketId: text("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    action: tradeActionEnum("action").notNull().default("buy"),
    side: marketSideEnum("side").notNull(),
    shareCount: integer("share_count").notNull(),
    totalCost: integer("total_cost").notNull(),
    averagePrice: integer("average_price").notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("trade_market_idx").on(table.marketId),
    index("trade_user_idx").on(table.userId),
  ],
);

export const positions = pgTable(
  "position",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    marketId: text("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    side: marketSideEnum("side").notNull(),
    shareCount: integer("share_count").notNull().default(0),
    totalCost: integer("total_cost").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.marketId, table.side] }),
    index("position_market_idx").on(table.marketId),
  ],
);

export const priceSnapshots = pgTable(
  "price_snapshot",
  {
    id: text("id").primaryKey(),
    marketId: text("market_id")
      .notNull()
      .references(() => markets.id, { onDelete: "cascade" }),
    yesProbabilityBps: integer("yes_probability_bps").notNull(),
    noProbabilityBps: integer("no_probability_bps").notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("price_snapshot_market_idx").on(table.marketId)],
);

export const resolutions = pgTable("resolution", {
  marketId: text("market_id")
    .primaryKey()
    .references(() => markets.id, { onDelete: "cascade" }),
  outcome: marketOutcomeEnum("outcome").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceLabel: text("source_label").notNull(),
  rationale: text("rationale"),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobRuns = pgTable(
  "job_run",
  {
    id: text("id").primaryKey(),
    jobName: text("job_name").notNull(),
    status: jobRunStatusEnum("status").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    processedCount: integer("processed_count"),
    summary: jsonb("summary"),
    errorMessage: text("error_message"),
  },
  (table) => [index("job_run_name_started_at_idx").on(table.jobName, table.startedAt)],
);

export const rateLimitBuckets = pgTable(
  "rate_limit_bucket",
  {
    id: text("id").primaryKey(),
    scope: text("scope").notNull(),
    identifier: text("identifier").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("rate_limit_bucket_scope_identifier_window_unique").on(
      table.scope,
      table.identifier,
      table.windowStart,
    ),
    index("rate_limit_bucket_expires_at_idx").on(table.expiresAt),
  ],
);
