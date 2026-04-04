CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"onboarding_step" smallint DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_profile_id" integer NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" text NOT NULL,
	"xp_reward" integer NOT NULL,
	"track_year" smallint NOT NULL,
	"sort_order" smallint NOT NULL,
	"video_url" text
);
--> statement-breakpoint
CREATE TABLE "user_activity_days" (
	"user_profile_id" integer NOT NULL,
	"day" date NOT NULL,
	"intensity" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "user_activity_days_user_profile_id_day_pk" PRIMARY KEY("user_profile_id","day")
);
--> statement-breakpoint
CREATE TABLE "user_module_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_profile_id" integer NOT NULL,
	"module_id" text NOT NULL,
	"status" text NOT NULL,
	"progress_percent" smallint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "total_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "streak_days" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "mastery_level" smallint DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "last_active_date" date;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "active_module_id" text;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_days" ADD CONSTRAINT "user_activity_days_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ump_user_module" ON "user_module_progress" USING btree ("user_profile_id","module_id");--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_active_module_id_modules_id_fk" FOREIGN KEY ("active_module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "modules" ("id", "title", "description", "difficulty", "xp_reward", "track_year", "sort_order", "video_url") VALUES
	('IMAD5112', 'GitHub Ecosystem Foundations', 'Basics of GitHub, pushing, and Actions pipelines.', 'Beginner', 400, 1, 1, NULL),
	('PROG5112', 'Logic & Version Control', 'Git core, branching, and commit standards.', 'Beginner', 400, 1, 2, NULL),
	('PROG6112', 'Merge Conflict Resolution', 'Manual merging and diff in collaborative workflows.', 'Intermediate', 850, 2, 1, NULL),
	('PROG6212', 'Remote Mastery', 'Collaborative remote and sync strategies.', 'Intermediate', 600, 2, 2, NULL),
	('PROG7313', 'Branch Mastery & Management', 'Enterprise workflows and governance.', 'Pro', 1000, 3, 1, NULL)
ON CONFLICT ("id") DO NOTHING;
