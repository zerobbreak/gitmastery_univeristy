CREATE TABLE "activity_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_profile_id" integer NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"difficulty" text NOT NULL,
	"xp" integer NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"objectives_json" text NOT NULL
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
CREATE TABLE "user_challenge_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_profile_id" integer NOT NULL,
	"challenge_id" text NOT NULL,
	"xp_awarded" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_concept_mastery" (
	"user_profile_id" integer NOT NULL,
	"concept_id" text NOT NULL,
	"module_id" text NOT NULL,
	"best_score_percent" smallint DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"last_attempt_score" smallint,
	"review_due_at" timestamp with time zone,
	"review_level" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "user_concept_mastery_user_profile_id_concept_id_pk" PRIMARY KEY("user_profile_id","concept_id")
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
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"onboarding_step" smallint DEFAULT 0 NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"display_name" text,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"mastery_level" smallint DEFAULT 1 NOT NULL,
	"last_active_date" date,
	"active_module_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_profiles_clerk_user_id_unique" UNIQUE("clerk_user_id")
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_days" ADD CONSTRAINT "user_activity_days_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenge_completions" ADD CONSTRAINT "user_challenge_completions_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_challenge_completions" ADD CONSTRAINT "user_challenge_completions_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_concept_mastery" ADD CONSTRAINT "user_concept_mastery_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_concept_mastery" ADD CONSTRAINT "user_concept_mastery_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_active_module_id_modules_id_fk" FOREIGN KEY ("active_module_id") REFERENCES "public"."modules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "challenges_module_slug" ON "challenges" USING btree ("module_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "ucc_user_challenge" ON "user_challenge_completions" USING btree ("user_profile_id","challenge_id");--> statement-breakpoint
CREATE INDEX "ucm_user_review_due" ON "user_concept_mastery" USING btree ("user_profile_id","review_due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ump_user_module" ON "user_module_progress" USING btree ("user_profile_id","module_id");
--> statement-breakpoint
INSERT INTO "modules" ("id", "title", "description", "difficulty", "xp_reward", "track_year", "sort_order", "video_url") VALUES
	('IMAD5112', 'GitHub Ecosystem Foundations', 'Basics of GitHub, pushing, and Actions pipelines.', 'Beginner', 400, 1, 1, NULL),
	('PROG5112', 'Logic & Version Control', 'Git core, branching, and commit standards.', 'Beginner', 400, 1, 2, NULL),
	('PROG6112', 'Merge Conflict Resolution', 'Manual merging and diff in collaborative workflows.', 'Intermediate', 850, 2, 1, NULL),
	('PROG6212', 'Remote Mastery', 'Collaborative remote and sync strategies.', 'Intermediate', 600, 1, 3, NULL),
	('PROG7313', 'Branch Mastery & Management', 'Enterprise workflows and governance.', 'Pro', 1000, 3, 1, NULL),
	('PROG6213', 'Pull Request Mastery', 'Create effective PRs, conduct code reviews, and merge with confidence.', 'Intermediate', 400, 2, 3, NULL),
	('PROG6214', 'Git History & Recovery', 'Navigate history, recover lost work, and debug with bisect.', 'Intermediate', 450, 2, 4, NULL),
	('PROG7314', 'Interactive Rebase Mastery', 'Squash, reword, and reorder commits before review.', 'Pro', 550, 3, 2, NULL),
	('PROG7315', 'Advanced Merge Strategies', 'Rerere, merge policies, and messy integrations.', 'Pro', 550, 3, 3, NULL),
	('PROG7316', 'Git Hooks & Automation', 'Client-side hooks and quality gates.', 'Pro', 600, 3, 4, NULL),
	('PROG7317', 'Monorepos & Submodules', 'Submodule workflows and scaling large repos.', 'Pro', 600, 3, 5, NULL),
	('PROG7318', 'Security & History Rewriting', 'Secrets in history and safe remediation.', 'Pro', 650, 3, 6, NULL),
	('PROG7319', 'Git Internals & Troubleshooting', 'Objects, fsck, and low-level debugging.', 'Pro', 650, 3, 7, NULL),
	('PROG7320', 'Full Project: Fork to Push', 'Capstone: combine every prior skill in one flow.', 'Pro', 1000, 3, 8, NULL)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "challenges" ("id", "module_id", "slug", "title", "description", "difficulty", "xp", "sort_order", "objectives_json") VALUES
	('CHAL101', 'PROG5112', 'feature-branching-101', 'Feature Branching 101', 'You are on main with uncommitted edits in your working tree. Create a dedicated branch for the Login feature, stage every modified file, then commit with the exact message below. Use the terminal on the left — the simulator checks branch name, staging, and your last commit message.', 'EASY', 250, 0, '[{"id":"obj1","text":"Create branch feature-login"},{"id":"obj2","text":"Stage all current changes"},{"id":"obj3","text":"Commit changes with message \"init login\""}]'),
	('CHAL102', 'PROG6212', 'configure-fork-remotes', 'Configure Fork Remotes', 'You''ve forked an open-source project. Set up your remotes correctly so you can fetch updates from the original repo while pushing to your fork.', 'EASY', 300, 0, '[{"id":"obj1","text":"Add upstream remote pointing to original repo"},{"id":"obj2","text":"Verify both origin and upstream are configured"},{"id":"obj3","text":"Fetch from upstream"}]'),
	('CHAL201', 'PROG6213', 'pr-workflow', 'Complete PR Workflow', 'Practice the full pull request workflow: create a feature branch from main, stage your changes, commit with a message you choose, push, and set upstream tracking so the branch is ready for review.', 'MEDIUM', 400, 0, '[{"id":"obj1","text":"Create feature branch from main"},{"id":"obj2","text":"Make and commit changes"},{"id":"obj3","text":"Push branch with upstream tracking"}]'),
	('CHAL202', 'PROG6214', 'recover-lost-commit', 'Recover Lost Commit', 'You accidentally reset too far back and lost important commits. Use reflog to find and recover the lost work.', 'MEDIUM', 450, 0, '[{"id":"obj1","text":"Use reflog to find lost commit"},{"id":"obj2","text":"Create recovery branch from lost commit"},{"id":"obj3","text":"Verify recovered changes"}]'),
	('CHAL301', 'IMAD5112', 'github-ecosystem-lab', 'GitHub first push', 'Your team uses GitHub as the source of truth. Create a branch for this lesson, stage your local edits, and commit with the message required for CI to pick up the next step.', 'EASY', 350, 0, '[{"id":"obj1","text":"Create branch workshop-github"},{"id":"obj2","text":"Stage all current changes"},{"id":"obj3","text":"Commit changes with message \"ready push\""}]'),
	('CHAL302', 'PROG6112', 'ci-merge-workflow', 'Branch before merge', 'Green main depends on running checks on a feature branch first. Isolate your work, stage it, and record a commit the way you would before opening a merge or PR.', 'MEDIUM', 400, 0, '[{"id":"obj1","text":"Create branch fix-ci-merge"},{"id":"obj2","text":"Stage all current changes"},{"id":"obj3","text":"Commit changes with message \"ci green\""}]'),
	('CHAL303', 'PROG7313', 'governance-signoff', 'Policy branch sign-off', 'Governed repos require named branches for policy edits and auditable commits. Create the branch, stage all tracked changes, and commit with the compliance message.', 'HARD', 500, 0, '[{"id":"obj1","text":"Create branch governance-release"},{"id":"obj2","text":"Stage all current changes"},{"id":"obj3","text":"Commit changes with message \"policy ok\""}]'),
	('CHAL304', 'PROG6112', 'resolve-merge-conflicts', 'Resolve Merge Conflicts', 'A merge has left your repository with conflicting changes. Edit the files to remove all conflict markers, keeping the code you want, then stage and commit the resolved files.', 'MEDIUM', 450, 1, '[{"id":"obj1","text":"Resolve conflicts in config.js"},{"id":"obj2","text":"Resolve conflicts in utils.js"},{"id":"obj3","text":"Stage all resolved files"},{"id":"obj4","text":"Commit changes with message \"merge complete\""}]'),
	('CHAL401', 'PROG7314', 'interactive-rebase-lab', 'Interactive rebase squash', 'You have three noisy WIP commits on main. Squash them into one clean commit before you open a PR.', 'HARD', 550, 0, '[{"id":"obj1","text":"Squash last three commits with git rebase -i HEAD~3"}]'),
	('CHAL402', 'PROG7315', 'rerere-merge-lab', 'Rerere and merge', 'Enable rerere, then merge the feature branch that advanced while you were on main.', 'HARD', 550, 0, '[{"id":"obj1","text":"Enable rerere with git config rerere.enabled true"},{"id":"obj2","text":"Merge branch feature-x"}]'),
	('CHAL403', 'PROG7316', 'hooks-install-lab', 'Install a hook', 'Automation often starts with a pre-commit hook placeholder.', 'HARD', 600, 0, '[{"id":"obj1","text":"Install pre-commit hook with git hook install pre-commit"}]'),
	('CHAL404', 'PROG7317', 'submodule-vendor-lab', 'Add a submodule', 'Vendor an external library as a submodule at a fixed path.', 'HARD', 600, 0, '[{"id":"obj1","text":"Add submodule for vendor/lib at https://github.com/example/lib.git"}]'),
	('CHAL405', 'PROG7318', 'filter-secret-lab', 'Rewrite history', 'A secret landed in README. Remove it from history with a filter-repo style rewrite (simulator).', 'HARD', 650, 0, '[{"id":"obj1","text":"Run git filter-repo with --force"}]'),
	('CHAL406', 'PROG7319', 'internals-inspection-lab', 'Inspect objects', 'Use plumbing commands to inspect objects and verify repository health.', 'HARD', 650, 0, '[{"id":"obj1","text":"Run git cat-file -p HEAD"},{"id":"obj2","text":"Run git fsck"},{"id":"obj3","text":"Create annotated tag v1.0.0"}]'),
	('CHAL407', 'PROG7320', 'oss-fork-to-push', 'Fork to push', 'From your fork: branch, wire upstream, sync, commit, and push like a real contribution.', 'HARD', 1000, 0, '[{"id":"obj1","text":"Create branch feature/oss-contribution"},{"id":"obj2","text":"Add upstream remote pointing to original repo"},{"id":"obj3","text":"Verify both origin and upstream are configured"},{"id":"obj4","text":"Fetch from upstream"},{"id":"obj5","text":"Stage all current changes"},{"id":"obj6","text":"Commit changes with message \"Add contribution\""},{"id":"obj7","text":"Push branch with upstream tracking"}]')
ON CONFLICT ("id") DO NOTHING;