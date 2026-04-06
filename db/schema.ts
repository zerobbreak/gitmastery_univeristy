import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Curriculum module catalog (seeded). */
export const modules = pgTable("modules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(),
  xpReward: integer("xp_reward").notNull(),
  trackYear: smallint("track_year").notNull(),
  sortOrder: smallint("sort_order").notNull(),
  videoUrl: text("video_url"),
});

/** Git challenges (requirements, copy, XP) — source of truth for challenge UI + validation. */
export const challenges = pgTable(
  "challenges",
  {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    difficulty: text("difficulty").notNull(),
    xp: integer("xp").notNull(),
    sortOrder: smallint("sort_order").notNull().default(0),
    /** JSON array: [{ "id": "obj1", "text": "..." }] */
    objectivesJson: text("objectives_json").notNull(),
  },
  (t) => [uniqueIndex("challenges_module_slug").on(t.moduleId, t.slug)],
);

/**
 * Single row (id = 1) bumped when leaderboard-relevant profile fields change.
 * Supabase Realtime subscribes to UPDATE on this table so clients can refetch
 * without exposing full `user_profiles` rows over the websocket.
 */
export const leaderboardRealtimeSignals = pgTable(
  "leaderboard_realtime_signals",
  {
    id: integer("id").primaryKey(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [check("leaderboard_signal_singleton", sql`${t.id} = 1`)],
);

/** App profile keyed by Clerk user id (synced on first API touch). */
export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  onboardingStep: smallint("onboarding_step").notNull().default(0),
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    withTimezone: true,
  }),
  /** Cached from Clerk on dashboard/profile API calls. */
  displayName: text("display_name"),
  totalXp: integer("total_xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  masteryLevel: smallint("mastery_level").notNull().default(1),
  lastActiveDate: date("last_active_date", { mode: "string" }),
  activeModuleId: text("active_module_id").references(() => modules.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userModuleProgress = pgTable(
  "user_module_progress",
  {
    id: serial("id").primaryKey(),
    userProfileId: integer("user_profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    /** locked | active | next | completed */
    status: text("status").notNull(),
    progressPercent: smallint("progress_percent").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("ump_user_module").on(t.userProfileId, t.moduleId)],
);

export const activityEvents = pgTable("activity_events", {
  id: serial("id").primaryKey(),
  userProfileId: integer("user_profile_id")
    .notNull()
    .references(() => userProfiles.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** One row per user per challenge; prevents double XP awards. */
export const userChallengeCompletions = pgTable(
  "user_challenge_completions",
  {
    id: serial("id").primaryKey(),
    userProfileId: integer("user_profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    xpAwarded: integer("xp_awarded").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("ucc_user_challenge").on(t.userProfileId, t.challengeId)],
);

/** One row per calendar day for GitHub-style heatmap (0–4 intensity). */
export const userActivityDays = pgTable(
  "user_activity_days",
  {
    userProfileId: integer("user_profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    intensity: smallint("intensity").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userProfileId, t.day] })],
);

/** Per-user concept scores + spaced review schedule (workshop quizzes). */
export const userConceptMastery = pgTable(
  "user_concept_mastery",
  {
    userProfileId: integer("user_profile_id")
      .notNull()
      .references(() => userProfiles.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").notNull(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    bestScorePercent: smallint("best_score_percent").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    lastAttemptScore: smallint("last_attempt_score"),
    reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
    /** Increments after each successful review session for this concept. */
    reviewLevel: smallint("review_level").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.userProfileId, t.conceptId] }),
    index("ucm_user_review_due").on(t.userProfileId, t.reviewDueAt),
  ],
);
