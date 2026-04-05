import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb, schema } from "../../../../../db/index";
import {
  allObjectivesMet,
  getInitialModifiedFromLesson,
  isGitSimState,
} from "@/lib/challenge-validation";
import {
  bumpActivityDayForProfile,
  recomputeModuleProgressFromCompletions,
} from "@/lib/challenge-progression";
import { corsHeaders } from "@/lib/cors";
import { masteryLevelFromXp } from "@/lib/dashboard-data";
import type { GitSimState } from "@/lib/git-emulator";
import {
  getChallengeContextById,
  getNextCurriculumHrefAfterChallengeDb,
} from "@/lib/challenges-db";
import { getLessonContent } from "@/lib/module-lesson-content";
import { getUserIdFromRequest } from "@/lib/server-auth";

const { modules, userProfiles, userChallengeCompletions, activityEvents } = schema;

async function catalogOrder(db: ReturnType<typeof getDb>): Promise<string[]> {
  const rows = await db
    .select({ id: modules.id })
    .from(modules)
    .orderBy(asc(modules.trackYear), asc(modules.sortOrder));
  return rows.map((r) => r.id);
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400, headers },
    );
  }

  if (
    body === null ||
    typeof body !== "object" ||
    !("challengeId" in body) ||
    !("gitState" in body)
  ) {
    return NextResponse.json(
      { error: "Expected { challengeId, gitState }" },
      { status: 400, headers },
    );
  }

  const challengeId = (body as { challengeId: unknown }).challengeId;
  const gitStateRaw = (body as { gitState: unknown }).gitState;

  if (typeof challengeId !== "string" || !challengeId.trim()) {
    return NextResponse.json(
      { error: "Invalid challengeId" },
      { status: 400, headers },
    );
  }

  if (!isGitSimState(gitStateRaw)) {
    return NextResponse.json(
      { error: "Invalid gitState" },
      { status: 400, headers },
    );
  }

  const gitState = gitStateRaw as GitSimState;

  const db = getDb();

  const resolved = await getChallengeContextById(db, challengeId.trim());
  if (!resolved) {
    return NextResponse.json(
      { error: "Unknown challenge" },
      { status: 404, headers },
    );
  }

  const { trackId, lessonSlug, moduleId, challenge } = resolved;
  const lessonContent = getLessonContent(trackId, lessonSlug);
  if (!lessonContent) {
    return NextResponse.json(
      { error: "Lesson content not found" },
      { status: 404, headers },
    );
  }

  const initialModified = getInitialModifiedFromLesson(lessonContent);
  if (!allObjectivesMet(challenge, gitState, initialModified)) {
    return NextResponse.json(
      { error: "Not all objectives are satisfied" },
      { status: 400, headers },
    );
  }

  const now = new Date();

  const existingProfile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  let profile = existingProfile[0];
  if (!profile) {
    const [inserted] = await db
      .insert(userProfiles)
      .values({
        clerkUserId: userId,
        displayName: "Learner",
        masteryLevel: masteryLevelFromXp(0),
      })
      .returning();
    profile = inserted;
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Could not load profile" },
      { status: 500, headers },
    );
  }

  const order = await catalogOrder(db);
  const nextHref = await getNextCurriculumHrefAfterChallengeDb(
    db,
    trackId,
    lessonSlug,
    challenge.slug,
    moduleId,
    order,
  );

  const [existingCompletion] = await db
    .select()
    .from(userChallengeCompletions)
    .where(
      and(
        eq(userChallengeCompletions.userProfileId, profile.id),
        eq(userChallengeCompletions.challengeId, challenge.id),
      ),
    )
    .limit(1);

  if (existingCompletion) {
    return NextResponse.json(
      {
        alreadyCompleted: true,
        totalXp: profile.totalXp,
        xpAwarded: 0,
        nextHref,
      },
      { status: 200, headers },
    );
  }

  const xpAward = challenge.xp;
  const newTotalXp = profile.totalXp + xpAward;
  const newMastery = masteryLevelFromXp(newTotalXp);

  try {
    await db.insert(userChallengeCompletions).values({
      userProfileId: profile.id,
      challengeId: challenge.id,
      xpAwarded: xpAward,
    });

    await db
      .update(userProfiles)
      .set({
        totalXp: newTotalXp,
        masteryLevel: newMastery,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, profile.id));

    await db.insert(activityEvents).values({
      userProfileId: profile.id,
      kind: "challenge_complete",
      title: `Completed: ${challenge.title}`,
    });

    await recomputeModuleProgressFromCompletions(db, profile.id);
    await bumpActivityDayForProfile(db, profile.id);
  } catch (e) {
    console.error("challenge submit:", e);
    return NextResponse.json(
      { error: "Could not save completion" },
      { status: 500, headers },
    );
  }

  return NextResponse.json(
    {
      alreadyCompleted: false,
      totalXp: newTotalXp,
      xpAwarded: xpAward,
      nextHref,
    },
    { status: 200, headers },
  );
}
