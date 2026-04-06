import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { ModuleShell } from "@/components/ModuleShell";
import { ReviewSessionClient } from "@/components/ReviewSessionClient";
import { getDb, schema } from "../../../../../db/index";
import { getDueReviewQuestions } from "@/lib/workshop-mastery";
import { stripQuizAnswers } from "@/lib/workshop-quizzes";

const { userProfiles } = schema;

export default async function LearnReviewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    redirect("/sign-in");
  }

  const { segments } = await getDueReviewQuestions(db, profile.id);
  const publicSegs = segments.map((s) => ({
    moduleId: s.moduleId,
    questions: stripQuizAnswers(s.questions),
  }));

  return (
    <ModuleShell>
      <ReviewSessionClient segments={publicSegs} />
    </ModuleShell>
  );
}
