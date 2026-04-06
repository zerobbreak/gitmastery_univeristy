import "server-only";

import { and, eq, inArray, isNotNull, lte, sql } from "drizzle-orm";

import { getDb, schema } from "../../db/index";
import {
  getModuleRouteById,
  isTrackId,
  LEARN_IMPROVE_PATH,
  lessonQuizPath,
  type TrackId,
} from "@/lib/module-routes";
import {
  getConceptsForModule,
  LAB_CHALLENGE_IDS_BY_MODULE,
} from "@/lib/workshop-concepts";
import {
  getQuizForModule,
  scoreQuiz,
  type WorkshopQuizQuestion,
} from "@/lib/workshop-quizzes";
import { WORKSHOP_PASS_PERCENT } from "@/lib/workshop-copy";
import type {
  ImproveItem,
  LearningModesPayload,
  LessonWorkshopExtras,
  ModuleWorkshopPill,
} from "@/lib/dashboard-types";

const { userConceptMastery, userModuleProgress } = schema;

/** Days after a successful review at level 0 → 1 → 2 → 3+. */
function daysAfterReviewSuccess(levelBefore: number): number {
  if (levelBefore <= 0) return 3;
  if (levelBefore === 1) return 7;
  return 14;
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

export async function scheduleSpacedReviewForModule(
  db: ReturnType<typeof getDb>,
  profileId: number,
  moduleId: string,
): Promise<void> {
  const concepts = getConceptsForModule(moduleId);
  if (concepts.length === 0) return;
  const firstDue = addUtcDays(new Date(), 1);
  for (const c of concepts) {
    await db
      .insert(userConceptMastery)
      .values({
        userProfileId: profileId,
        conceptId: c.id,
        moduleId,
        bestScorePercent: 0,
        reviewLevel: 0,
        reviewDueAt: firstDue,
      })
      .onConflictDoUpdate({
        target: [
          userConceptMastery.userProfileId,
          userConceptMastery.conceptId,
        ],
        set: {
          reviewDueAt: sql`COALESCE(${userConceptMastery.reviewDueAt}, ${firstDue})`,
        },
      });
  }
}

export type WorkshopQuizMode = "learning" | "review" | "improve";

export async function submitWorkshopQuiz(
  db: ReturnType<typeof getDb>,
  profileId: number,
  mode: WorkshopQuizMode,
  segments: Array<{ moduleId: string; answers: Record<string, number> }>,
): Promise<{
  results: Array<{
    moduleId: string;
    totalPercent: number;
    byConcept: Record<
      string,
      { correct: number; total: number; percent: number }
    >;
  }>;
}> {
  const results: Array<{
    moduleId: string;
    totalPercent: number;
    byConcept: Record<
      string,
      { correct: number; total: number; percent: number }
    >;
  }> = [];

  const now = new Date();

  for (const seg of segments) {
    const { moduleId, answers } = seg;
    const answeredIds = new Set(Object.keys(answers));
    const scored = scoreQuiz(
      moduleId,
      answers,
      (q) => answeredIds.has(q.id),
    );
    results.push({
      moduleId,
      totalPercent: scored.totalPercent,
      byConcept: scored.byConcept,
    });

    const concepts = getConceptsForModule(moduleId);
    const conceptById = new Map(concepts.map((c) => [c.id, c]));

    for (const [conceptId, agg] of Object.entries(scored.byConcept)) {
      const c = conceptById.get(conceptId);
      if (!c) continue;

      const [existing] = await db
        .select()
        .from(userConceptMastery)
        .where(
          and(
            eq(userConceptMastery.userProfileId, profileId),
            eq(userConceptMastery.conceptId, conceptId),
          ),
        )
        .limit(1);

      const prevBest = existing?.bestScorePercent ?? 0;
      const nextBest = Math.max(prevBest, agg.percent);

      await db
        .insert(userConceptMastery)
        .values({
          userProfileId: profileId,
          conceptId,
          moduleId,
          bestScorePercent: nextBest,
          lastAttemptAt: now,
          lastAttemptScore: agg.percent,
          reviewLevel: existing?.reviewLevel ?? 0,
          reviewDueAt: existing?.reviewDueAt ?? null,
        })
        .onConflictDoUpdate({
          target: [
            userConceptMastery.userProfileId,
            userConceptMastery.conceptId,
          ],
          set: {
            bestScorePercent: sql`GREATEST(COALESCE(${userConceptMastery.bestScorePercent}, 0), ${nextBest})`,
            lastAttemptAt: now,
            lastAttemptScore: agg.percent,
          },
        });

      const rowAfter = await db
        .select()
        .from(userConceptMastery)
        .where(
          and(
            eq(userConceptMastery.userProfileId, profileId),
            eq(userConceptMastery.conceptId, conceptId),
          ),
        )
        .limit(1);
      const cur = rowAfter[0];
      if (!cur) continue;

      if (mode === "review") {
        const levelBefore = cur.reviewLevel;
        if (agg.percent >= WORKSHOP_PASS_PERCENT) {
          const days = daysAfterReviewSuccess(levelBefore);
          const nextDue = addUtcDays(now, days);
          const nextLevel = Math.min(levelBefore + 1, 3);
          await db
            .update(userConceptMastery)
            .set({
              reviewDueAt: nextDue,
              reviewLevel: nextLevel,
            })
            .where(
              and(
                eq(userConceptMastery.userProfileId, profileId),
                eq(userConceptMastery.conceptId, conceptId),
              ),
            );
        } else {
          await db
            .update(userConceptMastery)
            .set({
              reviewDueAt: addUtcDays(now, 1),
            })
            .where(
              and(
                eq(userConceptMastery.userProfileId, profileId),
                eq(userConceptMastery.conceptId, conceptId),
              ),
            );
        }
      }
    }
  }

  return { results };
}

function lessonPathFromModuleId(moduleId: string): string | null {
  const r = getModuleRouteById(moduleId);
  if (!r) return null;
  return `/modules/${r.track}/${r.lessonSlug}`;
}

export async function buildLearningModesPayload(
  db: ReturnType<typeof getDb>,
  profileId: number,
  completedModuleIds: Set<string>,
): Promise<LearningModesPayload> {
  const now = new Date();

  const masteryRows = await db
    .select()
    .from(userConceptMastery)
    .where(eq(userConceptMastery.userProfileId, profileId));

  let reviewDueCount = 0;
  const improveConcepts: ImproveItem[] = [];

  for (const row of masteryRows) {
    if (!completedModuleIds.has(row.moduleId)) continue;

    const weak =
      row.lastAttemptAt != null &&
      (row.bestScorePercent < WORKSHOP_PASS_PERCENT ||
        (row.lastAttemptScore != null &&
          row.lastAttemptScore < WORKSHOP_PASS_PERCENT));

    if (weak) {
      const concepts = getConceptsForModule(row.moduleId);
      const title =
        concepts.find((c) => c.id === row.conceptId)?.title ?? row.conceptId;
      const base = lessonPathFromModuleId(row.moduleId);
      if (base) {
        improveConcepts.push({
          conceptId: row.conceptId,
          moduleId: row.moduleId,
          conceptTitle: title,
          href: `${base}/quiz?mode=improve`,
        });
      }
    }

    if (
      row.reviewDueAt &&
      row.reviewDueAt <= now &&
      completedModuleIds.has(row.moduleId)
    ) {
      reviewDueCount++;
    }
  }

  const dedupe = new Map<string, ImproveItem>();
  for (const it of improveConcepts) {
    if (!dedupe.has(it.conceptId)) dedupe.set(it.conceptId, it);
  }

  return {
    reviewDueCount,
    improveCount: dedupe.size,
    improveItems: [...dedupe.values()].slice(0, 8),
  };
}

export async function getWorkshopPillsForModules(
  db: ReturnType<typeof getDb>,
  profileId: number,
  moduleIds: string[],
  challengeDone: Set<string>,
  progressByModule: Map<string, string>,
): Promise<Record<string, ModuleWorkshopPill>> {
  const out: Record<string, ModuleWorkshopPill> = {};
  if (moduleIds.length === 0) return out;

  const rows = await db
    .select()
    .from(userConceptMastery)
    .where(
      and(
        eq(userConceptMastery.userProfileId, profileId),
        inArray(userConceptMastery.moduleId, moduleIds),
      ),
    );

  const byModule = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byModule.get(r.moduleId) ?? [];
    list.push(r);
    byModule.set(r.moduleId, list);
  }

  const now = new Date();

  for (const mid of moduleIds) {
    const concepts = getConceptsForModule(mid);
    const mrows = byModule.get(mid) ?? [];
    const status = progressByModule.get(mid);

    let quizDone = true;
    if (concepts.length > 0) {
      const scores = concepts.map((c) => {
        const mr = mrows.find((x) => x.conceptId === c.id);
        return mr?.bestScorePercent ?? 0;
      });
      quizDone = scores.every((s) => s >= WORKSHOP_PASS_PERCENT);
    }

    const labIds = LAB_CHALLENGE_IDS_BY_MODULE[mid] ?? [];
    const labsDone =
      labIds.length === 0 ||
      labIds.every((id) => challengeDone.has(id));

    let reviewDue = 0;
    if (status === "completed") {
      for (const mr of mrows) {
        if (mr.reviewDueAt && mr.reviewDueAt <= now) reviewDue++;
      }
    }

    out[mid] = { quizDone, labsDone, reviewDue };
  }

  return out;
}

export async function getLessonWorkshopExtras(
  db: ReturnType<typeof getDb>,
  profileId: number | null,
  moduleId: string,
  track: string,
  lessonSlug: string,
  completedChallengeIds: string[],
  moduleStatus: string | null,
): Promise<LessonWorkshopExtras | null> {
  if (!isTrackId(track)) return null;
  const tid = track as TrackId;

  const quizHref = lessonQuizPath(tid, lessonSlug);
  const improveHref = LEARN_IMPROVE_PATH;
  const labChallengeIds = LAB_CHALLENGE_IDS_BY_MODULE[moduleId] ?? [];

  const done = new Set(completedChallengeIds);
  const pillsRecord = profileId
    ? await getWorkshopPillsForModules(
        db,
        profileId,
        [moduleId],
        done,
        new Map([[moduleId, moduleStatus ?? "locked"]]),
      )
    : null;
  const pills = pillsRecord?.[moduleId] ?? {
    quizDone: false,
    labsDone: labChallengeIds.every((id) => done.has(id)),
    reviewDue: 0,
  };

  let reviewDueCount = 0;
  if (profileId && moduleStatus === "completed") {
    const now = new Date();
    const r = await db
      .select()
      .from(userConceptMastery)
      .where(
        and(
          eq(userConceptMastery.userProfileId, profileId),
          eq(userConceptMastery.moduleId, moduleId),
          isNotNull(userConceptMastery.reviewDueAt),
          lte(userConceptMastery.reviewDueAt, now),
        ),
      );
    reviewDueCount = r.length;
  }

  return {
    quizHref,
    improveHref,
    reviewDueCount,
    labChallengeIds,
    pills,
  };
}

/** Build cross-module review question list (due concepts only). */
export async function getDueReviewQuestions(
  db: ReturnType<typeof getDb>,
  profileId: number,
): Promise<{
  segments: Array<{ moduleId: string; questions: WorkshopQuizQuestion[] }>;
}> {
  const now = new Date();

  const completedMods = await db
    .select({ moduleId: userModuleProgress.moduleId })
    .from(userModuleProgress)
    .where(
      and(
        eq(userModuleProgress.userProfileId, profileId),
        eq(userModuleProgress.status, "completed"),
      ),
    );

  const completedSet = new Set(completedMods.map((r) => r.moduleId));

  const dueRows = await db
    .select()
    .from(userConceptMastery)
    .where(
      and(
        eq(userConceptMastery.userProfileId, profileId),
        isNotNull(userConceptMastery.reviewDueAt),
        lte(userConceptMastery.reviewDueAt, now),
      ),
    );

  const byModule = new Map<string, Set<string>>();
  for (const row of dueRows) {
    if (!completedSet.has(row.moduleId)) continue;
    const set = byModule.get(row.moduleId) ?? new Set();
    set.add(row.conceptId);
    byModule.set(row.moduleId, set);
  }

  const segments: Array<{
    moduleId: string;
    questions: WorkshopQuizQuestion[];
  }> = [];

  for (const [moduleId, conceptSet] of byModule) {
    const all = getQuizForModule(moduleId);
    const questions = all.filter((q) => conceptSet.has(q.conceptId));
    if (questions.length > 0) {
      segments.push({ moduleId, questions });
    }
  }

  return { segments };
}

export async function getImproveQuizQuestions(
  db: ReturnType<typeof getDb>,
  profileId: number,
  moduleId: string,
): Promise<WorkshopQuizQuestion[]> {
  const all = getQuizForModule(moduleId);
  const rows = await db
    .select()
    .from(userConceptMastery)
    .where(
      and(
        eq(userConceptMastery.userProfileId, profileId),
        eq(userConceptMastery.moduleId, moduleId),
      ),
    );
  const weak = new Set<string>();
  for (const r of rows) {
    if (
      r.lastAttemptAt != null &&
      (r.bestScorePercent < WORKSHOP_PASS_PERCENT ||
        (r.lastAttemptScore != null &&
          r.lastAttemptScore < WORKSHOP_PASS_PERCENT))
    ) {
      weak.add(r.conceptId);
    }
  }
  const filtered = all.filter((q) => weak.has(q.conceptId));
  return filtered.length > 0 ? filtered : all;
}
