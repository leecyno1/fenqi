CREATE TABLE IF NOT EXISTS "external_text_translation" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"source_slug" text,
	"original_title" text NOT NULL,
	"original_brief" text,
	"translated_title" text NOT NULL,
	"translated_brief" text NOT NULL,
	"model" text DEFAULT 'rule-fallback' NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "external_text_translation_source_id_unique" ON "external_text_translation" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "external_text_translation_status_idx" ON "external_text_translation" USING btree ("status");
