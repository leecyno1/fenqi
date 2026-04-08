ALTER TABLE "market" ADD COLUMN "external_source" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_slug" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "source_name" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "canonical_source_url" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_image_url" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "news_image_url" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "news_image_cached_url" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "news_image_source" text;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "news_references" jsonb;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "heat_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "controversy_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "last_synced_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "market_external_source_idx" ON "market" USING btree ("external_source");--> statement-breakpoint
CREATE UNIQUE INDEX "market_external_source_id_unique" ON "market" USING btree ("external_source","external_id");
