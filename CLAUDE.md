# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

Poly is a prediction market platform built with Next.js 16, using PostgreSQL for data persistence and Drizzle ORM for database operations. The application implements a Logarithmic Market Scoring Rule (LMSR) automated market maker for pricing prediction market shares.

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
npm run dev

# Database operations
docker compose up -d              # Start PostgreSQL container
npm run db:generate               # Generate migration files from schema
npm run db:push                   # Push schema changes to database (dev)
npm run db:migrate                # Run migrations (production)
npm run db:studio                 # Open Drizzle Studio GUI
npm run db:seed                   # Seed database with initial data

# Testing
npm run test                      # Run tests once
npm run test:watch                # Run tests in watch mode

# Code quality
npm run lint                      # Run ESLint
npm run typecheck                 # Run TypeScript compiler checks

# Build
npm run build                     # Production build
npm run start                     # Start production server
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random string for auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: Base URL for auth callbacks
- `NEXT_PUBLIC_APP_URL`: Public-facing app URL

## Architecture

### Database Schema (`src/db/schema.ts`)

Core entities:
- **users**: User accounts with role-based access (user/admin)
- **sessions/accounts/verifications**: better-auth tables
- **virtualWallets**: User balances and lifetime P&L tracking
- **walletLedger**: Immutable transaction log (bootstrap_grant, trade_debit/credit, resolution_payout, void_refund, admin_adjustment)
- **markets**: Prediction markets with LMSR state (liquidity, yesShares, noShares)
- **trades**: Historical trade records
- **positions**: Aggregated user positions per market side
- **priceSnapshots**: Historical probability data
- **resolutions**: Market outcomes with source attribution

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

- `queries.ts`: Database queries returning domain views
- `views.ts`: View builders that transform DB rows into presentation models

### API Routes

- `/api/auth/[...all]`: better-auth handler
- `/api/markets`: Market listing
- `/api/markets/[slug]/quote`: Get buy order quote
- `/api/admin/markets`: Admin market CRUD
- `/api/admin/markets/[id]/status`: Market status transitions

### Admin Operations (`src/lib/admin/`)

- `market-form.ts`: Market creation/update validation
- `market-status.ts`: Status transition rules and validation
- `market-delete.ts`: Safe deletion guards (prevents deletion if trades/positions exist)

## Testing

Tests are colocated with source files as `*.test.ts`. Run `npm run test` to execute all tests. Coverage reports are generated in `coverage/` directory.

## Key Conventions

- All monetary values are stored as integers (points, not currency)
- Probabilities in database are stored as basis points (bps) in snapshots
- Market slugs are unique identifiers for public URLs
- User roles: "user" (default) or "admin"
- Trade execution is atomic: updates positions, wallet balance, and ledger in a transaction
