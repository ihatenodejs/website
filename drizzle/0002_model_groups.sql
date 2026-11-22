CREATE TABLE "model_group_members" (
	"user_id" text NOT NULL,
	"group_id" text NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_group_members_user_id_model_pk" PRIMARY KEY("user_id","model"),
	CONSTRAINT "model_group_members_model_length" CHECK (char_length("model_group_members"."model") between 1 and 200)
);
--> statement-breakpoint
CREATE TABLE "model_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"alias" text NOT NULL,
	"icon_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_groups_alias_length" CHECK (char_length("model_groups"."alias") between 1 and 80),
	CONSTRAINT "model_groups_icon_key_length" CHECK ("model_groups"."icon_key" is null or char_length("model_groups"."icon_key") between 1 and 32)
);
--> statement-breakpoint
ALTER TABLE "model_group_members" ADD CONSTRAINT "model_group_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_group_members" ADD CONSTRAINT "model_group_members_group_id_model_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."model_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_groups" ADD CONSTRAINT "model_groups_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "model_group_members_group_idx" ON "model_group_members" USING btree ("user_id","group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "model_groups_user_alias_unique" ON "model_groups" USING btree ("user_id","alias");