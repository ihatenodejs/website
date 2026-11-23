CREATE TABLE "profile_schools" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"start_year" integer,
	"end_year" integer,
	"graduated_year" integer,
	"student_status" text DEFAULT '' NOT NULL,
	"major" text DEFAULT '' NOT NULL,
	"clubs" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "profile_schools_name_length" CHECK (char_length("profile_schools"."name") between 1 and 120),
	CONSTRAINT "profile_schools_location_length" CHECK (char_length("profile_schools"."location") <= 120),
	CONSTRAINT "profile_schools_status_length" CHECK (char_length("profile_schools"."student_status") <= 80),
	CONSTRAINT "profile_schools_major_length" CHECK (char_length("profile_schools"."major") <= 120),
	CONSTRAINT "profile_schools_clubs_length" CHECK (char_length("profile_schools"."clubs") <= 120),
	CONSTRAINT "profile_schools_start_year" CHECK ("profile_schools"."start_year" is null or "profile_schools"."start_year" between 1900 and 2100),
	CONSTRAINT "profile_schools_end_year" CHECK ("profile_schools"."end_year" is null or "profile_schools"."end_year" between 1900 and 2100),
	CONSTRAINT "profile_schools_graduated_year" CHECK ("profile_schools"."graduated_year" is null or "profile_schools"."graduated_year" between 1900 and 2100),
	CONSTRAINT "profile_schools_year_order" CHECK ("profile_schools"."start_year" is null or "profile_schools"."end_year" is null or "profile_schools"."end_year" >= "profile_schools"."start_year")
);
--> statement-breakpoint
CREATE TABLE "status_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"mood" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "status_posts_body_length" CHECK (char_length("status_posts"."body") between 1 and 500),
	CONSTRAINT "status_posts_mood_length" CHECK (char_length("status_posts"."mood") <= 60)
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_link" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "detail_status" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "here_for" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "hometown" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "ethnicity" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "zodiac" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "smoke" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "drink" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "education" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "occupation" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profile_schools" ADD CONSTRAINT "profile_schools_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_posts" ADD CONSTRAINT "status_posts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_schools_user_position_idx" ON "profile_schools" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "status_posts_user_created_idx" ON "status_posts" USING btree ("user_id","created_at");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_link_length" CHECK (char_length("profiles"."profile_link") <= 500);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_detail_status_length" CHECK (char_length("profiles"."detail_status") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_here_for_length" CHECK (char_length("profiles"."here_for") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_hometown_length" CHECK (char_length("profiles"."hometown") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_ethnicity_length" CHECK (char_length("profiles"."ethnicity") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_zodiac_length" CHECK (char_length("profiles"."zodiac") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_smoke_length" CHECK (char_length("profiles"."smoke") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_drink_length" CHECK (char_length("profiles"."drink") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_education_length" CHECK (char_length("profiles"."education") <= 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_occupation_length" CHECK (char_length("profiles"."occupation") <= 80);