import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { LessonStepView } from "@/components/LessonStepView";
import { listChallengesForModule } from "@/lib/challenges-db";
import { assertStep, firstChallengePathOrLesson, getStepNavigation } from "@/lib/module-routes";
import { getStep, getTotalSteps, hasSteps } from "@/lib/module-steps";
import { getDb } from "../../../../../../../../db/index";

export default async function StepPage({
  params,
}: {
  params: Promise<{ track: string; lesson: string; step: string }>;
}) {
  const { track, lesson, step } = await params;
  const { track: trackId, lesson: moduleDef, stepNumber } = assertStep(track, lesson, step);

  if (!hasSteps(moduleDef.id)) {
    notFound();
  }

  const totalSteps = getTotalSteps(moduleDef.id);
  if (stepNumber > totalSteps) {
    notFound();
  }

  const stepData = getStep(moduleDef.id, stepNumber);
  if (!stepData) {
    notFound();
  }

  const navigation = getStepNavigation(trackId, moduleDef.lessonSlug, stepNumber, totalSteps);

  const db = getDb();
  const moduleChallenges = await listChallengesForModule(db, moduleDef.id);
  const afterStepsHref = firstChallengePathOrLesson(
    trackId,
    moduleDef.lessonSlug,
    moduleChallenges[0]?.slug ?? null,
  );
  const afterStepsLabel = moduleChallenges.length > 0 ? "Start Challenge" : "Complete Module";

  return (
    <ModuleShell>
      <LessonStepView
        trackId={trackId}
        moduleDef={moduleDef}
        step={stepData}
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        navigation={navigation}
        afterStepsHref={afterStepsHref}
        afterStepsLabel={afterStepsLabel}
      />
    </ModuleShell>
  );
}
