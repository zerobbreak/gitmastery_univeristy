import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ChallengeView } from "@/components/ChallengeView";
import {
  getChallengeByModuleAndSlug,
  listChallengesForModule,
} from "@/lib/challenges-db";
import { assertLesson, lessonPath } from "@/lib/module-routes";
import { getLessonContent } from "@/lib/module-lesson-content";
import { getDb, schema } from "../../../../../../../db/index";

const { userChallengeCompletions, userProfiles } = schema;

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ track: string; lesson: string; challenge: string }>;
}) {
  const { track, lesson, challenge: challengeSlug } = await params;
  const { track: trackId, lesson: moduleDef } = assertLesson(track, lesson);

  const db = getDb();
  const challengeDef = await getChallengeByModuleAndSlug(
    db,
    moduleDef.id,
    challengeSlug,
  );
  if (!challengeDef) {
    notFound();
  }

  const lessonContent = getLessonContent(trackId, moduleDef.lessonSlug);

  if (!lessonContent) {
    notFound();
  }

  const ordered = await listChallengesForModule(db, moduleDef.id);
  const challengeSlugsOrdered = ordered.map((c) => c.slug);

  const { userId } = await auth();
  let completedChallengeIds: string[] = [];
  let isAlreadyCompleted = false;

  if (userId) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);

    if (profile) {
      const rows = await db
        .select({ challengeId: userChallengeCompletions.challengeId })
        .from(userChallengeCompletions)
        .where(eq(userChallengeCompletions.userProfileId, profile.id));
      completedChallengeIds = rows.map((r) => r.challengeId);
    }
  }

  const doneSet = new Set(completedChallengeIds);
  isAlreadyCompleted = doneSet.has(challengeDef.id);

  const challengeIndex = ordered.findIndex((c) => c.id === challengeDef.id);
  const isFirstChallenge = challengeIndex === 0;
  const prevChallengeDone =
    challengeIndex > 0 && doneSet.has(ordered[challengeIndex - 1]!.id);
  const isUnlocked = isFirstChallenge || prevChallengeDone || isAlreadyCompleted;

  if (!isUnlocked) {
    redirect(lessonPath(trackId, moduleDef.lessonSlug));
  }

  return (
    <ModuleShell hideHeader>
      <ChallengeView
        trackId={trackId}
        lessonSlug={moduleDef.lessonSlug}
        lessonTitle={moduleDef.title}
        challenge={challengeDef}
        lessonContent={lessonContent}
        challengeSlugsOrdered={challengeSlugsOrdered}
        isAlreadyCompleted={isAlreadyCompleted}
      />
    </ModuleShell>
  );
}
