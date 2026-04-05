import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ChallengeView } from "@/components/ChallengeView";
import {
  getChallengeByModuleAndSlug,
  listChallengesForModule,
} from "@/lib/challenges-db";
import { assertLesson } from "@/lib/module-routes";
import { getLessonContent } from "@/lib/module-lesson-content";
import { getDb } from "../../../../../../../db/index";

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

  return (
    <ModuleShell hideHeader>
      <ChallengeView
        trackId={trackId}
        lessonSlug={moduleDef.lessonSlug}
        lessonTitle={moduleDef.title}
        challenge={challengeDef}
        lessonContent={lessonContent}
        challengeSlugsOrdered={challengeSlugsOrdered}
      />
    </ModuleShell>
  );
}
