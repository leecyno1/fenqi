CREATE TYPE "public"."trade_action" AS ENUM('buy', 'sell');--> statement-breakpoint
ALTER TABLE "trade" ADD COLUMN "action" "trade_action" DEFAULT 'buy' NOT NULL;