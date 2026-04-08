CREATE TYPE "public"."job_run_status" AS ENUM('running', 'success', 'error');--> statement-breakpoint
CREATE TABLE "job_run" (
	"id" text PRIMARY KEY NOT NULL,
	"job_name" text NOT NULL,
	"status" "job_run_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"processed_count" integer,
	"summary" jsonb,
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "rate_limit_bucket" (
	"id" text PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"identifier" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "job_run_name_started_at_idx" ON "job_run" USING btree ("job_name","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rate_limit_bucket_scope_identifier_window_unique" ON "rate_limit_bucket" USING btree ("scope","identifier","window_start");--> statement-breakpoint
CREATE INDEX "rate_limit_bucket_expires_at_idx" ON "rate_limit_bucket" USING btree ("expires_at");
