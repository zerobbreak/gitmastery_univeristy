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
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "challenges_module_slug" ON "challenges" USING btree ("module_id","slug");--> statement-breakpoint
INSERT INTO "modules" ("id", "title", "description", "difficulty", "xp_reward", "track_year", "sort_order", "video_url") VALUES
	('PROG6213', 'Pull Request Mastery', 'Create effective PRs, conduct code reviews, and merge with confidence.', 'Intermediate', 400, 2, 3, NULL),
	('PROG6214', 'Git History & Recovery', 'Navigate history, recover lost work, and debug with bisect.', 'Intermediate', 450, 2, 4, NULL)
ON CONFLICT ("id") DO NOTHING;--> statement-breakpoint
INSERT INTO "challenges" ("id", "module_id", "slug", "title", "description", "difficulty", "xp", "sort_order", "objectives_json") VALUES
	('CHAL101', 'PROG5112', 'feature-branching-101', 'Feature Branching 101', 'You are on main with uncommitted edits in your working tree. Create a dedicated branch for the Login feature, stage every modified file, then commit with the exact message below. Use the terminal on the left — the simulator checks branch name, staging, and your last commit message.', 'EASY', 250, 0, '[{"id":"obj1","text":"Create branch feature-login"},{"id":"obj2","text":"Stage all current changes"},{"id":"obj3","text":"Commit changes with message \"init login\""}]'),
	('CHAL102', 'PROG6212', 'configure-fork-remotes', 'Configure Fork Remotes', 'You''ve forked an open-source project. Set up your remotes correctly so you can fetch updates from the original repo while pushing to your fork.', 'EASY', 300, 0, '[{"id":"obj1","text":"Add upstream remote pointing to original repo"},{"id":"obj2","text":"Verify both origin and upstream are configured"},{"id":"obj3","text":"Fetch from upstream"}]'),
	('CHAL201', 'PROG6213', 'pr-workflow', 'Complete PR Workflow', 'Practice the full pull request workflow: create a feature branch, make changes, push, and prepare for review.', 'MEDIUM', 400, 0, '[{"id":"obj1","text":"Create feature branch from main"},{"id":"obj2","text":"Make and commit changes"},{"id":"obj3","text":"Push branch with upstream tracking"}]'),
	('CHAL202', 'PROG6214', 'recover-lost-commit', 'Recover Lost Commit', 'You accidentally reset too far back and lost important commits. Use reflog to find and recover the lost work.', 'MEDIUM', 450, 0, '[{"id":"obj1","text":"Use reflog to find lost commit"},{"id":"obj2","text":"Create recovery branch from lost commit"},{"id":"obj3","text":"Verify recovered changes"}]')
ON CONFLICT ("id") DO NOTHING;