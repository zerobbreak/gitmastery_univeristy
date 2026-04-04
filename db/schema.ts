import {
  date,
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
