CREATE TYPE "public"."price_anchor_mode" AS ENUM('external', 'hybrid', 'local');--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_yes_probability_bps" integer;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_no_probability_bps" integer;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_price_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_price_stale" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "price_anchor_mode" "price_anchor_mode" DEFAULT 'local' NOT NULL;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "clob_token_ids" jsonb;
