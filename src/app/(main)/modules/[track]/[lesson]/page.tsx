import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { ModuleShell } from "@/components/ModuleShell";
import { ModuleLessonView } from "@/components/ModuleLessonView";
import { recomputeModuleProgressFromCompletions } from "@/lib/challenge-progression";
import { listChallengesForModule } from "@/lib/challenges-db";
import { assertLesson } from "@/lib/module-routes";
import { getDb, schema } from "../../../../../../db/index";

const { userChallengeCompletions, userProfiles } = schema;

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
    }
  }

  return (
    <ModuleShell>
      <ModuleLessonView
        trackId={trackId}
        moduleDef={moduleDef}
        challenges={challengesList}
        completedChallengeIds={completedChallengeIds}
      />
    </ModuleShell>
  );
}
