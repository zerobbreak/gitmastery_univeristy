CREATE TABLE "leaderboard_realtime_signals" (
	"id" integer PRIMARY KEY NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leaderboard_signal_singleton" CHECK ("leaderboard_realtime_signals"."id" = 1)
);
--> statement-breakpoint
INSERT INTO "leaderboard_realtime_signals" ("id") VALUES (1);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION notify_leaderboard_rank_change()
RETURNS trigger AS $$
BEGIN
  UPDATE "leaderboard_realtime_signals" SET "updated_at" = now() WHERE "id" = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
--> statement-breakpoint
DROP TRIGGER IF EXISTS "user_profiles_leaderboard_notify" ON "user_profiles";
--> statement-breakpoint
CREATE TRIGGER "user_profiles_leaderboard_notify"
AFTER INSERT OR UPDATE OF "total_xp", "streak_days", "mastery_level", "display_name"
ON "user_profiles"
FOR EACH ROW
EXECUTE FUNCTION notify_leaderboard_rank_change();
--> statement-breakpoint
ALTER TABLE "leaderboard_realtime_signals" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "leaderboard_realtime_signals_select"
ON "leaderboard_realtime_signals"
FOR SELECT
USING (true);
--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE ON "leaderboard_realtime_signals" FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT SELECT ON "leaderboard_realtime_signals" TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT ON "leaderboard_realtime_signals" TO authenticated;
  END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'leaderboard_realtime_signals'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE "leaderboard_realtime_signals";
    END IF;
  END IF;
END $$;
