CREATE TABLE "market_event" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"image" text,
	"external_source" text,
	"external_event_id" text,
	"external_event_slug" text,
	"source_name" text,
	"source_url" text,
	"canonical_source_url" text,
	"external_image_url" text,
	"news_image_url" text,
	"news_image_cached_url" text,
	"news_image_source" text,
	"news_references" jsonb,
	"heat_score" integer DEFAULT 0 NOT NULL,
	"controversy_score" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"title" text NOT NULL,
	"brief" text NOT NULL,
	"tone" text NOT NULL,
	"category" "market_category" NOT NULL,
	"resolution_sources" jsonb NOT NULL,
	"evidence" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "market_event_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "event_id" text;
--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_market_id" text;
--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "external_market_slug" text;
--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "answer_label" text DEFAULT '主市场' NOT NULL;
--> statement-breakpoint
ALTER TABLE "market" ADD COLUMN "answer_order" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
INSERT INTO "market_event" (
	"id",
	"slug",
	"image",
	"external_source",
	"external_event_id",
	"external_event_slug",
	"source_name",
	"source_url",
	"canonical_source_url",
	"external_image_url",
	"news_image_url",
	"news_image_cached_url",
	"news_image_source",
	"news_references",
	"heat_score",
	"controversy_score",
	"is_featured",
	"last_synced_at",
	"title",
	"brief",
	"tone",
	"category",
	"resolution_sources",
	"evidence",
	"created_at",
	"updated_at"
)
SELECT
	'evt_' || "id",
	"slug",
	"image",
	"external_source",
	"external_id",
	coalesce("external_slug", "slug"),
	"source_name",
	"source_url",
	"canonical_source_url",
	"external_image_url",
	"news_image_url",
	"news_image_cached_url",
	"news_image_source",
	"news_references",
	"heat_score",
	"controversy_score",
	"is_featured",
	"last_synced_at",
	"question",
	"brief",
	"tone",
	"category",
	"resolution_sources",
	"evidence",
	"created_at",
	"updated_at"
FROM "market";
--> statement-breakpoint
UPDATE "market"
SET
	"event_id" = 'evt_' || "id",
	"external_market_id" = coalesce("external_id", "id"),
	"external_market_slug" = coalesce("external_slug", "slug"),
	"answer_label" = '主市场',
	"answer_order" = 1;
--> statement-breakpoint
ALTER TABLE "market" ALTER COLUMN "event_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "market" ADD CONSTRAINT "market_event_id_market_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."market_event"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "market_external_source_id_unique";
--> statement-breakpoint
CREATE INDEX "market_event_external_source_idx" ON "market_event" USING btree ("external_source");
--> statement-breakpoint
CREATE UNIQUE INDEX "market_event_external_source_id_unique" ON "market_event" USING btree ("external_source","external_event_id");
--> statement-breakpoint
CREATE INDEX "market_event_id_idx" ON "market" USING btree ("event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "market_external_source_market_id_unique" ON "market" USING btree ("external_source","external_market_id");
