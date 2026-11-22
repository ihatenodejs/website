CREATE TABLE "agent_connections" (
	"user_id" text PRIMARY KEY NOT NULL,
	"show_models" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_sync_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"file_name" text NOT NULL,
	"inserted_count" integer DEFAULT 0 NOT NULL,
	"updated_count" integer DEFAULT 0 NOT NULL,
	"unchanged_count" integer DEFAULT 0 NOT NULL,
	"provider_count" integer DEFAULT 0 NOT NULL,
	"day_count" integer DEFAULT 0 NOT NULL,
	"model_count" integer DEFAULT 0 NOT NULL,
	"total_tokens" bigint DEFAULT 0 NOT NULL,
	"total_cost_micros" bigint DEFAULT 0 NOT NULL,
	"earliest_date" text,
	"latest_date" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	CONSTRAINT "agent_sync_runs_status_valid" CHECK ("agent_sync_runs"."status" in ('queued', 'running', 'complete', 'failed')),
	CONSTRAINT "agent_sync_runs_inserted_count" CHECK ("agent_sync_runs"."inserted_count" >= 0),
	CONSTRAINT "agent_sync_runs_updated_count" CHECK ("agent_sync_runs"."updated_count" >= 0),
	CONSTRAINT "agent_sync_runs_unchanged_count" CHECK ("agent_sync_runs"."unchanged_count" >= 0),
	CONSTRAINT "agent_sync_runs_provider_count" CHECK ("agent_sync_runs"."provider_count" >= 0),
	CONSTRAINT "agent_sync_runs_day_count" CHECK ("agent_sync_runs"."day_count" >= 0),
	CONSTRAINT "agent_sync_runs_model_count" CHECK ("agent_sync_runs"."model_count" >= 0),
	CONSTRAINT "agent_sync_runs_total_tokens" CHECK ("agent_sync_runs"."total_tokens" >= 0),
	CONSTRAINT "agent_sync_runs_total_cost_micros" CHECK ("agent_sync_runs"."total_cost_micros" >= 0),
	CONSTRAINT "agent_sync_runs_file_name_length" CHECK (char_length("agent_sync_runs"."file_name") between 1 and 120),
	CONSTRAINT "agent_sync_runs_error_message_length" CHECK ("agent_sync_runs"."error_message" is null or char_length("agent_sync_runs"."error_message") <= 500)
);
--> statement-breakpoint
CREATE TABLE "agent_usage" (
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"usage_date" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" bigint NOT NULL,
	"output_tokens" bigint NOT NULL,
	"cache_creation_tokens" bigint NOT NULL,
	"cache_read_tokens" bigint NOT NULL,
	"cost_micros" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_usage_user_id_provider_usage_date_model_pk" PRIMARY KEY("user_id","provider","usage_date","model"),
	CONSTRAINT "agent_usage_date_format" CHECK ("agent_usage"."usage_date" ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'),
	CONSTRAINT "agent_usage_provider_length" CHECK (char_length("agent_usage"."provider") between 1 and 64),
	CONSTRAINT "agent_usage_model_length" CHECK (char_length("agent_usage"."model") between 1 and 200),
	CONSTRAINT "agent_usage_input_tokens" CHECK ("agent_usage"."input_tokens" >= 0),
	CONSTRAINT "agent_usage_output_tokens" CHECK ("agent_usage"."output_tokens" >= 0),
	CONSTRAINT "agent_usage_cache_creation_tokens" CHECK ("agent_usage"."cache_creation_tokens" >= 0),
	CONSTRAINT "agent_usage_cache_read_tokens" CHECK ("agent_usage"."cache_read_tokens" >= 0),
	CONSTRAINT "agent_usage_cost_micros" CHECK ("agent_usage"."cost_micros" >= 0)
);
--> statement-breakpoint
CREATE TABLE "model_overrides" (
	"user_id" text NOT NULL,
	"model" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"icon_key" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_overrides_user_id_model_pk" PRIMARY KEY("user_id","model"),
	CONSTRAINT "model_overrides_display_name_length" CHECK (char_length("model_overrides"."display_name") <= 80),
	CONSTRAINT "model_overrides_icon_key_length" CHECK ("model_overrides"."icon_key" is null or char_length("model_overrides"."icon_key") between 1 and 32)
);
--> statement-breakpoint
ALTER TABLE "agent_connections" ADD CONSTRAINT "agent_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_sync_runs" ADD CONSTRAINT "agent_sync_runs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_usage" ADD CONSTRAINT "agent_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_overrides" ADD CONSTRAINT "model_overrides_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_sync_runs_user_created_idx" ON "agent_sync_runs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_usage_user_model_idx" ON "agent_usage" USING btree ("user_id","model");