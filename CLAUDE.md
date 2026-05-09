# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

Poly (分歧) is a Chinese prediction market platform built with Next.js 16. It uses virtual points (not real money) and sources events from Polymarket, Chinese entertainment news, and LLM-generated reports. All events, probabilities, and resolutions are based on publicly verifiable information.

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router) with React 19
- **Database**: PostgreSQL 16 (via Docker Compose)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Authentication**: better-auth with email/password
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest with coverage via v8
- **Type Safety**: TypeScript 5

## Development Commands

```bash
# Start development server
pnpm dev

# Database operations
docker compose up -d              # Start PostgreSQL container
pnpm db:generate                  # Generate migration files from schema
pnpm db:push                      # Push schema changes to database (dev)
pnpm db:migrate                   # Run migrations (production)
pnpm db:studio                    # Open Drizzle Studio GUI
pnpm db:seed                      # Seed database with initial data (dev only)

# Bootstrap scripts
pnpm bootstrap:admin --email admin@example.com --password 'Pass123!' --name '管理员'
pnpm bootstrap:polymarket         # Import Polymarket events

# Testing
pnpm test                         # Run tests once
pnpm test:watch                   # Run tests in watch mode

# Code quality
pnpm lint                         # Run ESLint
pnpm typecheck                    # Run TypeScript compiler checks

# Build
pnpm build                        # Production build
pnpm start                        # Start production server
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random string for auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: Base URL for auth callbacks
- `NEXT_PUBLIC_APP_URL`: Public-facing app URL
- `CRON_SECRET`: Secret for authenticating cron endpoints

Optional variables:
- `AUTH_ALLOW_PUBLIC_SIGNUP`: Enable public registration (default: false)
- `AUTH_REQUIRE_EMAIL_VERIFICATION`: Require email verification before trading
- `SMTP_*`: Email delivery configuration (required for public signup/password reset)
- `SUPPORT_EMAIL`, `APP_ORG_NAME`, `APP_ICP_LICENSE`: Site metadata for footer
- `REPORTS_*`: Configuration for LLM-generated event integration

## Architecture

### Database Schema (`src/db/schema.ts`)

Core entities:
- **users**: User accounts with role-based access (user/admin)
- **sessions/accounts/verifications**: better-auth tables (OAuth, email/password)
- **virtualWallets**: User balances and lifetime P&L tracking
- **walletLedger**: Immutable transaction log with types: bootstrap_grant (初始补助), trade_debit/credit (交易), resolution_payout (结算), void_refund (作废退款), admin_adjustment (管理调整)
- **marketEvents**: Events sourced from external platforms or generated internally, stores title/brief/category/resolutionSources
- **markets**: Prediction markets derived from events, with LMSR state (liquidity, yesShares, noShares), external data sync metadata, price anchor mode, and featured/heat scoring
- **trades**: Historical trade records with price execution details
- **positions**: User positions aggregated per market side (YES/NO), primary key is (userId, marketId, side)
- **priceSnapshots**: Historical probability snapshots (recorded hourly) for chart rendering
- **resolutions**: Market outcome records with resolution source URL, rationale, and resolver reference
- **jobRuns**: Tracking table for cron job execution status, processed counts, and error logs
- **rateLimitBuckets**: Rolling window rate limit tracking by scope and identifier

Enums:
- **marketStatus**: draft → review → live → locked → resolved/voided
- **marketCategory**: current_affairs (时政), technology (科技), finance (金融)
- **marketSide**: YES/NO (binary outcome)
- **marketOutcome**: YES/NO/VOID
- **tradeAction**: buy/sell
- **priceAnchorMode**: external (Polymarket), hybrid (blend), local (internal only)

Market lifecycle: draft → review → live → locked → resolved/voided

### Market Pricing (`src/lib/markets/lmsr.ts`)

LMSR implementation:
- `createMarketState()`: Initialize market with liquidity parameter
- `getMarketProbabilities()`: Calculate YES/NO probabilities from share counts
- `quoteBuyOrder()`: Price a buy order and return cost + new state
- `settlePortfolioPayout()`: Calculate payouts on resolution (100 points per winning share)

The cost function is `C(q) = b * ln(e^(q_yes/b) + e^(q_no/b))` where b is liquidity.

### Authentication (`src/lib/auth.ts`)

Uses better-auth with:
- Email/password authentication
- Drizzle adapter for database integration
- Database hook to create virtual wallet on user registration (1000 point bootstrap grant)
- Role-based guards in `src/lib/auth/guards.ts`: `canAccessPortfolio()`, `canAccessAdmin()`

### Data Layer (`src/lib/data/`)

- `queries.ts`: Database queries returning domain views (market quotes, leaderboards, portfolio P&L)
- `views.ts`: View builders that transform DB rows into presentation models (30+ view types)
  - **Market views**: MarketListItem, MarketDetailView, MarketVisualData
  - **Event views**: EventListItem, EventDetailView
  - **Portfolio views**: PortfolioView (position breakdown, P&L, history)
  - **Admin views**: AdminMarketListItem, AdminSettlementListItem
  - **Leaderboard**: LeaderboardEntryView (user ranking by P&L)
  - **Probability display**: getDisplayProbability (formats probabilities for UI)
- `home-feed.ts`: Homepage section builder (featured markets, trending events, curated sections)
- `market-visuals.ts`: Mini-chart data generation (sparkline paths for market previews)
- `virtual-history.ts`: Virtual market history builder for portfolio page

### API Routes

Public routes:
- `/api/auth/[...all]`: better-auth handler
- `/api/markets`: Market listing
- `/api/markets/[slug]/quote`: Get buy order quote
- `/api/markets/[slug]/trade`: Execute trade
- `/api/markets/[slug]/history`: Price history
- `/api/health/live`: Liveness check
- `/api/health/ready`: Readiness check (validates env, DB, cron freshness)

Admin routes:
- `/api/admin/markets`: Admin market CRUD
- `/api/admin/markets/[id]/status`: Market status transitions
- `/api/admin/markets/[id]/resolve`: Resolve market outcome

Cron routes (require `Authorization: Bearer <CRON_SECRET>`):
- `POST /api/cron/sync-polymarket-catalog`: Sync Polymarket events (run every 6 hours)
- `POST /api/cron/sync-polymarket-prices`: Update market prices (run every 15 minutes)
- `POST /api/cron/enrich-news`: Enrich events with news articles (run every 6 hours)
- `POST /api/cron/record-snapshots`: Record price snapshots (run every 1 hour)

### Admin Operations (`src/lib/admin/`)

- `market-form.ts`: Market creation/update validation
- `market-status.ts`: Status transition rules and validation
- `market-delete.ts`: Safe deletion guards (prevents deletion if trades/positions exist)
- `market-resolution.ts`: Market resolution logic and payout calculation
- `resolve-market.ts`: Orchestrates resolution process with wallet updates

### External Integrations (`src/lib/integrations/`)

- `polymarket.ts`: Fetch and normalize Polymarket events/markets
- `sync-polymarket.ts`: Sync Polymarket data to local database with deduplication
- `cn-entertainment.ts`: Generate Chinese entertainment prediction markets
- `reports-generated.ts`: Fetch LLM-generated events from reports service
- `enrich-news.ts`: Enrich events with related news articles
- `image-cache.ts`: Cache external images locally

### Rate Limiting (`src/lib/rate-limit.ts`)

API 限流保护：
- `applyRateLimit()`: 应用限流检查，返回 429 响应
- `consumeRateLimit()`: 消费限流配额，支持时间窗口聚合
- `getClientAddress()`: 从请求头提取客户端 IP（支持代理）
- `buildRateLimitIdentifier()`: 组合标识符用于分组限流

使用 `rateLimitBuckets` 表跟踪消费，支持自定义作用域（如 `/api/trade`）和窗口大小。

### Job Tracking & Health Checks (`src/lib/jobs.ts`, `src/lib/health.ts`)

定时任务监控系统：
- `startJobRun()`: 记录任务开始
- `finishJobRun()`: 记录任务完成（成功/失败）
- `evaluateJobFreshness()`: 评估任务新鲜度状态（fresh/stale/missing/error）
- 跟踪的任务：sync-polymarket-catalog (6h), enrich-news (8h), sync-polymarket-prices (15min), record-snapshots (120min)

健康检查由三层组成：
1. 环境变量验证
2. 数据库连接测试
3. 定时任务新鲜度检查（用于 `/api/health/ready` 端点）

### Trading Engine (`src/lib/trading/`)

交易执行和头寸管理：
- `execute-trade.ts`: 原子交易执行（LMSR 定价、头寸更新、钱包更新、账本记录）
- `position-accounting.ts`: 聚合用户头寸（YES/NO 股份），支持批量计算

### Email System (`src/lib/email.ts`, `src/lib/auth/transactional-email.ts`)

交易型邮件发送：
- `sendEmail()`: 通过 SMTP 或外部服务发送
- `sendVerificationEmail()`: 邮箱验证
- `sendPasswordResetEmail()`: 密码重置
- 依赖 `SMTP_*` 环境变量配置（可选，需要时必须）

### Event System (`src/lib/events/standalone-event.ts`)

事件创建和验证：
- 支持独立事件创建（不来自 Polymarket 或报告服务）
- 用于管理员添加自定义预测市场

### Cron Infrastructure (`src/lib/cron.ts`, `src/lib/cron/snapshot-recorder.ts`)

定时任务执行框架：
- `runTrackedJob()`: 包装定时任务执行，自动记录开始/完成状态
- `snapshot-recorder.ts`: 记录市场价格快照到 `priceSnapshots` 表（用于图表显示）

### Utilities & Infrastructure

- `src/lib/points.ts`: 点数缩放逻辑 (POINT_SCALE=100)
- `src/lib/format.ts`: 数值格式化（概率、百分比等）
- `src/lib/utils.ts`: 通用工具函数
- `src/lib/env.ts`: 环境变量加载和校验
- `src/lib/logger.ts`: 结构化日志记录
- `src/lib/auth/session.ts`: better-auth 会话处理
- `src/db/client.ts`: Drizzle ORM 数据库客户端

### Content Governance & Configuration

**首页展示规则** (`src/config/content-governance.ts`):
- `HOMEPAGE_EXTERNAL_PRICE_MAX_AGE_MINUTES`: 15 分钟（外部价格缓存时间）
- `HOMEPAGE_EXTERNAL_CATALOG_MAX_AGE_MINUTES`: 360 分钟 (6 小时，事件目录刷新间隔)
- `LOCAL_CURATED_EVENT_SLUGS`: 精选事件集合（政治、金融、科技、文化等34个事件）

精选事件覆盖：时政、美国政治、日本政治、法国政治、美联储政策、黄金、布伦特油、科技创新、中国AI、加密资产、文化娱乐等

### Scripts

- `bootstrap-admin.ts`: 创建初始管理员账户
- `bootstrap-polymarket.ts`: 导入 Polymarket 事件作为初始数据
- `rescale-points.ts`: 数据迁移脚本（点数缩放）

### Frontend Architecture

使用 **Next.js 16 App Router**：
- 页面位于 `src/app/`（动态和静态路由）
- 组件位于 `src/components/`
- 使用 **React 19** 的最新特性（Server Components, Actions）
- **Recharts** 用于市场价格图表
- **Tailwind CSS 4** 处理样式
- **Lucide React** 提供 UI 图标

### Type Safety & Validation

- **Zod**: 运行时数据验证（表单输入、API 请求）
- **TypeScript 5**: 编译时类型检查
- 所有 API 路由返回类型化响应

### Infrastructure

**Docker Compose**:
- PostgreSQL 16 Alpine 镜像
- 容器名: `poly-postgres`
- 默认凭证: `poly:poly`
- 持久化卷: `poly-postgres-data`

## Testing

Tests are colocated with source files as `*.test.ts`. Run `pnpm test` to execute all tests. Coverage reports are generated in `coverage/` directory.

## Deployment Notes

**Production Deployment**:
- Use `pnpm build && pnpm start` for production
- Database migrations run with `pnpm db:migrate`
- Cron jobs must be orchestrated externally (e.g., GitHub Actions, cloud scheduler)
- All cron endpoints require valid `Authorization: Bearer <CRON_SECRET>` header
- Health check endpoint (`/api/health/ready`) should be monitored to ensure data freshness

**Environment Variables Required for Production**:
- `DATABASE_URL`: Must point to production PostgreSQL
- `BETTER_AUTH_SECRET`: Should be generated with strong entropy
- `BETTER_AUTH_URL`: Must match production domain
- `NEXT_PUBLIC_APP_URL`: Public-facing domain
- `CRON_SECRET`: Should be rotated regularly

## Common Development Patterns

### Adding a New Market Type
1. Define event in `src/lib/integrations/` (e.g., `new-source.ts`)
2. Add sync cron route in `src/app/api/cron/`
3. Register in `trackedJobNames` in `src/lib/jobs.ts`
4. Update health check freshness thresholds
5. Add to homepage sections in `src/lib/data/home-feed.ts`

### Modifying Market Pricing
1. Update LMSR functions in `src/lib/markets/lmsr.ts`
2. Update position accounting in `src/lib/trading/position-accounting.ts`
3. Update settlement logic in `src/lib/admin/market-resolution.ts`
4. Add tests covering edge cases

### Adding New Admin Features
1. Create validation in `src/lib/admin/market-form.ts`
2. Add route handler in `src/app/api/admin/markets/`
3. Check guards with `canAccessAdmin()` from `src/lib/auth/guards.ts`
4. Apply rate limiting with custom scope

### Working with Wallets & Ledger
- Always use transactions when modifying balances
- Record all changes in `walletLedger` with appropriate `entryType`
- Calculate new balance after each modification
- Never directly update `balance` without ledger entry

## Troubleshooting

**Database Connection Issues**:
```bash
# Verify PostgreSQL is running
docker ps | grep poly-postgres

# Check connection string in .env.local
echo $DATABASE_URL

# Reset database (dev only)
docker compose down -v && docker compose up -d && pnpm db:push
```

**Auth Issues**:
- Ensure `BETTER_AUTH_SECRET` is set and consistent across restarts
- Verify session table has correct indexes: `pnpm db:studio`
- Clear browser cookies if session is stale

**Cron Job Not Running**:
- Check `jobRuns` table for error messages: `pnpm db:studio`
- Verify `CRON_SECRET` matches in environment
- Monitor `/api/health/ready` for job freshness status

## Key Conventions

- All monetary values are stored as integers (points, not currency)
- Probabilities in database are stored as basis points (bps) in snapshots
- Market slugs are unique identifiers for public URLs
- User roles: "user" (default) or "admin"
- Trade execution is atomic: updates positions, wallet balance, and ledger in a transaction
- External data is cached locally with `lastSyncedAt` timestamp
- All list endpoints support pagination via `limit` and `offset` query parameters
