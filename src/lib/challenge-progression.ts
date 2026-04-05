import { and, asc, eq } from "drizzle-orm";

import { getDb, schema } from "../../db/index";
import { ensureModuleProgressForUser } from "@/lib/dashboard-data";
import { TRACK_IDS, TRACKS, type TrackId } from "@/lib/module-routes";

const {
  challenges,
  modules,
  userActivityDays,
  userChallengeCompletions,
  userModuleProgress,
  userProfiles,
} = schema;

export function getTrackIdForModuleId(moduleId: string): TrackId | null {
  for (const trackId of TRACK_IDS) {
    if (TRACKS[trackId].modules.some((m) => m.id === moduleId)) {
      return trackId;
    }
  }
  return null;
}

/** UTC calendar day string, matching dashboard heatmap keys. */
function todayUtcDay(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Bump heatmap intensity for today (cap 4).
 */
export async function bumpActivityDayForProfile(
  db: ReturnType<typeof getDb>,
  profileId: number,
): Promise<void> {
  const day = todayUtcDay();
  const [existing] = await db
    .select()
    .from(userActivityDays)
    .where(
      and(eq(userActivityDays.userProfileId, profileId), eq(userActivityDays.day, day)),
    )
    .limit(1);

  if (existing) {
    const next = Math.min(4, existing.intensity + 1);
    if (next !== existing.intensity) {
      await db
        .update(userActivityDays)
        .set({ intensity: next })
        .where(
          and(eq(userActivityDays.userProfileId, profileId), eq(userActivityDays.day, day)),
        );
    }
  } else {
    await db.insert(userActivityDays).values({
      userProfileId: profileId,
      day,
      intensity: 1,
    });
  }
}

/**
 * Recompute every module row from challenge completions + catalog order.
 * No-challenge modules are treated as complete (100%) so they never block progression.
 */
export async function recomputeModuleProgressFromCompletions(
  db: ReturnType<typeof getDb>,
  profileId: number,
): Promise<void> {
  await ensureModuleProgressForUser(db, profileId);

  const catalog = await db
    .select()
    .from(modules)
    .orderBy(asc(modules.trackYear), asc(modules.sortOrder));

  if (catalog.length === 0) return;

  const chRows = await db
    .select({ moduleId: challenges.moduleId, id: challenges.id })
    .from(challenges)
    .orderBy(asc(challenges.moduleId), asc(challenges.sortOrder), asc(challenges.slug));

  const challengeIdsByModule = new Map<string, string[]>();
  for (const r of chRows) {
    const list = challengeIdsByModule.get(r.moduleId) ?? [];
    list.push(r.id);
    challengeIdsByModule.set(r.moduleId, list);
  }

  const completionRows = await db
    .select({ challengeId: userChallengeCompletions.challengeId })
    .from(userChallengeCompletions)
    .where(eq(userChallengeCompletions.userProfileId, profileId));
  const doneSet = new Set(completionRows.map((r) => r.challengeId));

  type Slot = {
    moduleId: string;
    trackLocked: boolean;
    complete: boolean;
    progressPercent: number;
  };

  const slots: Slot[] = [];

  for (const cat of catalog) {
    const mid = cat.id;
    const tid = getTrackIdForModuleId(mid);
    const trackLocked = !tid || TRACKS[tid].locked;

    if (trackLocked) {
      slots.push({
        moduleId: mid,
        trackLocked: true,
        complete: false,
        progressPercent: 0,
      });
      continue;
    }

    const chIds = challengeIdsByModule.get(mid) ?? [];
    let complete = false;
    let progressPercent = 0;

    if (chIds.length === 0) {
      complete = true;
      progressPercent = 100;
    } else {
      const doneCount = chIds.filter((id) => doneSet.has(id)).length;
      progressPercent = Math.round((100 * doneCount) / chIds.length);
      complete = doneCount === chIds.length;
    }

    slots.push({
      moduleId: mid,
      trackLocked: false,
      complete,
      progressPercent,
    });
  }

  const unlockedIncompleteIndices: number[] = [];
  slots.forEach((s, i) => {
    if (!s.trackLocked && !s.complete) unlockedIncompleteIndices.push(i);
  });

  const activeIdx = unlockedIncompleteIndices[0];
  const nextIdx = unlockedIncompleteIndices[1];

  const now = new Date();

  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]!;
    let status: "locked" | "active" | "next" | "completed";
    if (s.trackLocked) {
      status = "locked";
    } else if (s.complete) {
      status = "completed";
    } else if (i === activeIdx) {
      status = "active";
    } else if (i === nextIdx) {
      status = "next";
    } else {
      status = "locked";
    }

    await db
      .update(userModuleProgress)
      .set({
        status,
        progressPercent: s.progressPercent,
        updatedAt: now,
      })
      .where(
        and(
          eq(userModuleProgress.userProfileId, profileId),
          eq(userModuleProgress.moduleId, s.moduleId),
        ),
      );
  }

  const activeModuleId =
    activeIdx !== undefined ? slots[activeIdx]!.moduleId : null;
  await db
    .update(userProfiles)
    .set({
      activeModuleId,
      updatedAt: now,
    })
    .where(eq(userProfiles.id, profileId));
}

