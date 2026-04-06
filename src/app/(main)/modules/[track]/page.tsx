import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ModuleTrackView } from "@/components/ModuleTrackView";
import { recomputeModuleProgressFromCompletions } from "@/lib/challenge-progression";
import { getTrack, TRACKS, type ModuleStatus } from "@/lib/module-routes";
import { getWorkshopPillsForModules } from "@/lib/workshop-mastery";
import { getDb, schema } from "../../../../../db/index";
import type { ModuleWorkshopPill } from "@/lib/dashboard-types";

const { userChallengeCompletions, userModuleProgress, userProfiles } = schema;

export default async function ModuleTrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track: trackParam } = await params;
  const track = getTrack(trackParam);
  if (!track) notFound();

  const db = getDb();
  const { userId } = await auth();
  let progressMap = new Map<string, ModuleStatus>();
  let intermediateComplete = false;
  let workshopPills: Record<string, ModuleWorkshopPill> | undefined;

  if (userId) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);

    if (profile) {
      await recomputeModuleProgressFromCompletions(db, profile.id);

      const intermediateIds = TRACKS.intermediate.modules.map((m) => m.id);
      const interRows = await db
        .select()
        .from(userModuleProgress)
        .where(
          and(
            eq(userModuleProgress.userProfileId, profile.id),
            inArray(userModuleProgress.moduleId, intermediateIds),
          ),
        );
      const interMap = new Map(interRows.map((r) => [r.moduleId, r.status]));
      intermediateComplete = TRACKS.intermediate.modules.every(
        (m) => interMap.get(m.id) === "completed",
      );

      const moduleIds = track.modules.map((m) => m.id);
      if (moduleIds.length > 0) {
        const progressRows = await db
          .select()
          .from(userModuleProgress)
          .where(
            and(
              eq(userModuleProgress.userProfileId, profile.id),
              inArray(userModuleProgress.moduleId, moduleIds),
            ),
          );

        for (const row of progressRows) {
          const s = row.status;
          if (s === "completed" || s === "active" || s === "next" || s === "locked") {
            progressMap.set(row.moduleId, s);
          }
        }

        const chRows = await db
          .select({ challengeId: userChallengeCompletions.challengeId })
          .from(userChallengeCompletions)
          .where(eq(userChallengeCompletions.userProfileId, profile.id));
        const challengeDone = new Set(chRows.map((r) => r.challengeId));
        workshopPills = await getWorkshopPillsForModules(
          db,
          profile.id,
          moduleIds,
          challengeDone,
          progressMap,
        );
      }
    }
  }

  const trackLocked = track.id === "pro" ? !intermediateComplete : track.locked;

  return (
    <ModuleShell>
      <ModuleTrackView
        track={track}
        progressMap={progressMap}
        trackLocked={trackLocked}
        workshopPills={workshopPills}
      />
    </ModuleShell>
  );
}
