import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { ModuleShell } from "@/components/ModuleShell";
import { ModuleQuizClient, type ModuleQuizMode } from "@/components/ModuleQuizClient";
import { assertLesson } from "@/lib/module-routes";
import { getDb, schema } from "../../../../../../../db/index";
import { getImproveQuizQuestions } from "@/lib/workshop-mastery";
import { getQuizForModule, stripQuizAnswers } from "@/lib/workshop-quizzes";

const { userProfiles } = schema;

export default async function ModuleQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ track: string; lesson: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { track, lesson } = await params;
  const { mode: modeParam } = await searchParams;
  const { track: trackId, lesson: moduleDef } = assertLesson(track, lesson);

  const mode: ModuleQuizMode =
    modeParam === "improve" ? "improve" : "learning";

  const db = getDb();
  const { userId } = await auth();
  let profileId: number | null = null;
  if (userId) {
    const [p] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkUserId, userId))
      .limit(1);
    profileId = p?.id ?? null;
  }

  let questions = stripQuizAnswers(getQuizForModule(moduleDef.id));
  if (mode === "improve" && profileId != null) {
    const imp = await getImproveQuizQuestions(db, profileId, moduleDef.id);
    questions = stripQuizAnswers(imp);
  }

  return (
    <ModuleShell>
      <ModuleQuizClient
        trackId={trackId}
        lessonSlug={moduleDef.lessonSlug}
        moduleId={moduleDef.id}
        moduleTitle={moduleDef.title}
        mode={mode}
        questions={questions}
      />
    </ModuleShell>
  );
}
