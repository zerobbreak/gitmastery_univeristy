CREATE TABLE "user_challenge_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_profile_id" integer NOT NULL,
	"challenge_id" text NOT NULL,
	"xp_awarded" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_challenge_completions" ADD CONSTRAINT "user_challenge_completions_user_profile_id_user_profiles_id_fk" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ucc_user_challenge" ON "user_challenge_completions" USING btree ("user_profile_id","challenge_id");