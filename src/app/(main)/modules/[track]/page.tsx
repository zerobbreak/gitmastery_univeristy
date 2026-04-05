import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ModuleTrackView } from "@/components/ModuleTrackView";
import { recomputeModuleProgressFromCompletions } from "@/lib/challenge-progression";
import { getTrack, type ModuleStatus } from "@/lib/module-routes";
import { getDb, schema } from "../../../../../db/index";

const { userModuleProgress, userProfiles } = schema;

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

  if (userId) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);

    if (profile) {
      await recomputeModuleProgressFromCompletions(db, profile.id);

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
      }
    }
  }

  return (
    <ModuleShell>
      <ModuleTrackView track={track} progressMap={progressMap} />
    </ModuleShell>
  );
}
