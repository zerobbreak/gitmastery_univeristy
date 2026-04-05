import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";

import { ModuleShell } from "@/components/ModuleShell";
import { ModuleLessonView } from "@/components/ModuleLessonView";
import { recomputeModuleProgressFromCompletions } from "@/lib/challenge-progression";
import { listChallengesForModule } from "@/lib/challenges-db";
import { assertLesson, type ModuleStatus } from "@/lib/module-routes";
import { getDb, schema } from "../../../../../../db/index";

const { userChallengeCompletions, userModuleProgress, userProfiles } = schema;

export default async function ModuleLessonPage({
  params,
}: {
  params: Promise<{ track: string; lesson: string }>;
}) {
  const { track, lesson } = await params;
  const { track: trackId, lesson: moduleDef } = assertLesson(track, lesson);

  const db = getDb();
  const challengesList = await listChallengesForModule(db, moduleDef.id);

  const { userId } = await auth();
  let completedChallengeIds: string[] = [];
  let liveModuleStatus: ModuleStatus | null = null;

  if (userId) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);
    if (profile) {
      await recomputeModuleProgressFromCompletions(db, profile.id);
      const rows = await db
        .select({ challengeId: userChallengeCompletions.challengeId })
        .from(userChallengeCompletions)
        .where(eq(userChallengeCompletions.userProfileId, profile.id));
      completedChallengeIds = rows.map((r) => r.challengeId);

      const [progressRow] = await db
        .select()
        .from(userModuleProgress)
        .where(
          and(
            eq(userModuleProgress.userProfileId, profile.id),
            eq(userModuleProgress.moduleId, moduleDef.id),
          ),
        )
        .limit(1);
      if (progressRow) {
        const s = progressRow.status;
        if (s === "completed" || s === "active" || s === "next" || s === "locked") {
          liveModuleStatus = s;
        }
      }
    }
  }

  return (
    <ModuleShell>
      <ModuleLessonView
        trackId={trackId}
        moduleDef={moduleDef}
        challenges={challengesList}
        completedChallengeIds={completedChallengeIds}
        liveModuleStatus={liveModuleStatus}
      />
    </ModuleShell>
  );
}
