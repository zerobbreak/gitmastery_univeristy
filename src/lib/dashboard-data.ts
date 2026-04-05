import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
} from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

import type { DashboardPayload, LearningPathModuleStatus } from "@/lib/dashboard-types";
import { getModuleResumeHref } from "@/lib/module-routes";

import { getDb, schema } from "../../db/index";

const {
  activityEvents,
  modules,
  userActivityDays,
  userChallengeCompletions,
  userModuleProgress,
  userProfiles,
} = schema;

const HEATMAP_DAYS = 84;

const COACH_HINTS = [
  'Try using git commit --amend to add files you forgot without creating a new commit.',
  "Before a big rebase, create a backup branch: git branch backup/main.",
  "Use git bisect when you need to find which commit introduced a bug.",
  "Protect your main branch with required reviews and passing CI before merge.",
];

function formatCompactXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return String(xp);
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function heatmapDayKeys(): string[] {
  const out: string[] = [];
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (HEATMAP_DAYS - 1));
  const cur = new Date(start);
  for (let i = 0; i < HEATMAP_DAYS; i++) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function pickCoachHint(clerkUserId: string): string {
  let h = 0;
  for (let i = 0; i < clerkUserId.length; i++) {
    h = (h + clerkUserId.charCodeAt(i)) % COACH_HINTS.length;
  }
  return COACH_HINTS[h] ?? COACH_HINTS[0];
}

export function masteryLevelFromXp(totalXp: number): number {
  return Math.max(1, Math.min(99, 1 + Math.floor(totalXp / 1000)));
}

export async function ensureModuleProgressForUser(
  db: ReturnType<typeof getDb>,
  profileId: number,
): Promise<void> {
  const catalog = await db
    .select()
    .from(modules)
    .orderBy(asc(modules.trackYear), asc(modules.sortOrder));

  if (catalog.length === 0) return;

  const existing = await db
    .select()
    .from(userModuleProgress)
    .where(eq(userModuleProgress.userProfileId, profileId));

  if (existing.length === 0) {
    const rows = catalog.map((mod, i) => ({
      userProfileId: profileId,
      moduleId: mod.id,
      status: i === 0 ? "active" : "locked",
      progressPercent: i === 0 ? 0 : 0,
    }));
    await db.insert(userModuleProgress).values(rows);
    await db
      .update(userProfiles)
      .set({
        activeModuleId: catalog[0]!.id,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, profileId));
    return;
  }

  const existingIds = new Set(existing.map((e) => e.moduleId));
  const missingCatalog = catalog.filter((c) => !existingIds.has(c.id));
  if (missingCatalog.length > 0) {
    await db.insert(userModuleProgress).values(
      missingCatalog.map((mod) => ({
        userProfileId: profileId,
        moduleId: mod.id,
        status: "locked" as const,
        progressPercent: 0,
      })),
    );
  }

  const profileRow = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, profileId))
    .limit(1);
  const p = profileRow[0];
  if (p && !p.activeModuleId) {
    const active = existing.find((e) => e.status === "active");
    const fallback = active ?? existing[0];
    if (fallback) {
      await db
        .update(userProfiles)
        .set({
          activeModuleId: fallback.moduleId,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, profileId));
    }
  }
}

export async function buildDashboardPayload(
  clerkUserId: string,
  displayNameFromClerk: string,
): Promise<DashboardPayload> {
  const db = getDb();
  const now = new Date();
  const displayName =
    displayNameFromClerk.trim() || "Learner";

  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);

  let profile = existing[0];
  if (!profile) {
    const [inserted] = await db
      .insert(userProfiles)
      .values({
        clerkUserId,
        displayName,
        masteryLevel: masteryLevelFromXp(0),
      })
      .returning();
    profile = inserted;
  } else if (profile.displayName !== displayName) {
    const [updated] = await db
      .update(userProfiles)
      .set({ displayName, updatedAt: now })
      .where(eq(userProfiles.id, profile.id))
      .returning();
    profile = updated ?? profile;
  }

  await ensureModuleProgressForUser(db, profile.id);
  const { recomputeModuleProgressFromCompletions } = await import(
    "./challenge-progression"
  );
  await recomputeModuleProgressFromCompletions(db, profile.id);

  const [refreshed] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, profile.id))
    .limit(1);
  profile = refreshed ?? profile;

  const masteryLevel = masteryLevelFromXp(profile.totalXp);
  if (masteryLevel !== profile.masteryLevel) {
    const [lv] = await db
      .update(userProfiles)
      .set({ masteryLevel, updatedAt: now })
      .where(eq(userProfiles.id, profile.id))
      .returning();
    if (lv) profile = lv;
  }

  const [{ ahead }] = await db
    .select({ ahead: count() })
    .from(userProfiles)
    .where(gt(userProfiles.totalXp, profile.totalXp));
  const globalRank = Number(ahead) + 1;

  const [{ totalLearners }] = await db
    .select({ totalLearners: count() })
    .from(userProfiles);

  const total = Math.max(1, Number(totalLearners));
  const topPct = Math.max(
    1,
    Math.min(99, Math.round((1 - globalRank / total) * 100)),
  );
  const topPercentLabel =
    globalRank <= 1 ? "Top 1%" : `Top ${topPct}%`;

  const activeModuleId = profile.activeModuleId;
  let activeModuleRow: InferSelectModel<typeof modules> | null = null;
  let activeProgress = 0;
  if (activeModuleId) {
    const [mod] = await db
      .select()
      .from(modules)
      .where(eq(modules.id, activeModuleId))
      .limit(1);
    activeModuleRow = mod ?? null;
    const [prog] = await db
      .select()
      .from(userModuleProgress)
      .where(
        and(
          eq(userModuleProgress.userProfileId, profile.id),
          eq(userModuleProgress.moduleId, activeModuleId),
        ),
      )
      .limit(1);
    activeProgress = prog?.progressPercent ?? 0;
  }

  const pathRows = await db
    .select({
      module: modules,
      progress: userModuleProgress,
    })
    .from(modules)
    .leftJoin(
      userModuleProgress,
      and(
        eq(userModuleProgress.moduleId, modules.id),
        eq(userModuleProgress.userProfileId, profile.id),
      ),
    )
    .orderBy(asc(modules.trackYear), asc(modules.sortOrder))
    .limit(8);

  const learningPath = pathRows.map(({ module: m, progress: pr }) => {
    const rawStatus = pr?.status;
    const status: LearningPathModuleStatus =
      rawStatus === "locked" ||
      rawStatus === "active" ||
      rawStatus === "next" ||
      rawStatus === "completed"
        ? rawStatus
        : "locked";
    return {
      moduleId: m.id,
      title: m.title,
      level: m.difficulty,
      xp: m.xpReward,
      done: pr?.status === "completed",
      status,
      trackYear: m.trackYear,
      resumeHref: getModuleResumeHref(m.id),
    };
  });

  const topUsers = await db
    .select()
    .from(userProfiles)
    .orderBy(desc(userProfiles.totalXp))
    .limit(3);

  const leaderboardPreview = topUsers.map((u, i) => ({
    rank: i + 1,
    displayName:
      u.clerkUserId === clerkUserId
        ? "You"
        : (u.displayName ?? "Learner"),
    xpLabel: `${formatCompactXp(u.totalXp)} XP`,
    isYou: u.clerkUserId === clerkUserId,
  }));

  const events = await db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.userProfileId, profile.id))
    .orderBy(desc(activityEvents.createdAt))
    .limit(6);

  const recentActivity = events.map((e) => ({
    id: e.id,
    title: e.title,
    timeLabel: formatRelativeTime(e.createdAt.toISOString()),
  }));

  const dayKeys = heatmapDayKeys();
  const heatRows =
    dayKeys.length > 0
      ? await db
          .select()
          .from(userActivityDays)
          .where(
            and(
              eq(userActivityDays.userProfileId, profile.id),
              inArray(userActivityDays.day, dayKeys),
            ),
          )
      : [];
  const heatMap = new Map(heatRows.map((r) => [r.day, r.intensity]));
  const heatmap = dayKeys.map((k) => Math.min(4, Math.max(0, heatMap.get(k) ?? 0)));

  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const [{ ytd }] = await db
    .select({ ytd: count() })
    .from(activityEvents)
    .where(
      and(
        eq(activityEvents.userProfileId, profile.id),
        gte(activityEvents.createdAt, yearStart),
      ),
    );

  const activityYearLabel = `${ytd} events this year`;

  const challengeCompletionRows = await db
    .select({ challengeId: userChallengeCompletions.challengeId })
    .from(userChallengeCompletions)
    .where(eq(userChallengeCompletions.userProfileId, profile.id));
  const completedChallengeIds = challengeCompletionRows.map((r) => r.challengeId);

  const welcomeName = profile.displayName ?? displayName;
  let subtitle = "Pick a module on the curriculum page to start your journey.";
  if (activeModuleRow) {
    subtitle = `Your focus: ${activeModuleRow.title}. ${activeModuleRow.description.slice(0, 120)}${activeModuleRow.description.length > 120 ? "…" : ""}`;
  }

  return {
    user: {
      displayName: welcomeName,
      masteryLevel,
      totalXp: profile.totalXp,
      totalXpLabel: formatCompactXp(profile.totalXp),
      streakDays: profile.streakDays,
      globalRank,
      totalLearners: total,
      topPercentLabel,
    },
    headline: {
      welcomeName,
      subtitle,
    },
    activeModule: activeModuleRow
      ? {
          id: activeModuleRow.id,
          title: activeModuleRow.title,
          description: activeModuleRow.description,
          difficulty: activeModuleRow.difficulty,
          xpReward: activeModuleRow.xpReward,
          progressPercent: activeProgress,
          videoBriefAvailable: Boolean(activeModuleRow.videoUrl),
          resumeHref: getModuleResumeHref(activeModuleRow.id),
        }
      : null,
    learningPath,
    leaderboardPreview,
    recentActivity,
    heatmap,
    coachHint: pickCoachHint(clerkUserId),
    activityYearLabel,
    completedChallengeIds,
  };
}
