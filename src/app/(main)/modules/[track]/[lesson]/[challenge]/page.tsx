import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ChallengeView } from "@/components/ChallengeView";
import { assertChallenge } from "@/lib/module-routes";
import { getLessonContent } from "@/lib/module-lesson-content";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ track: string; lesson: string; challenge: string }>;
}) {
  const { track, lesson, challenge } = await params;
  const {
    track: trackId,
    lesson: moduleDef,
    challenge: challengeDef,
  } = assertChallenge(track, lesson, challenge);

  const lessonContent = getLessonContent(trackId, moduleDef.lessonSlug);

  if (!lessonContent) {
    notFound();
  }

  return (
    <ModuleShell hideHeader>
      <ChallengeView
        trackId={trackId}
        challenge={challengeDef}
        lessonContent={lessonContent}
      />
    </ModuleShell>
  );
}
