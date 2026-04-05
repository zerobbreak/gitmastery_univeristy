import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { getDb, schema } from "../../db/index";
import {
  TRACKS,
  challengePath,
  getTrackModuleDefByModuleId,
  lessonPath,
  type ChallengeDef,
  type TrackId,
} from "@/lib/module-routes";

const { challenges } = schema;

export type ChallengeObjectiveRow = { id: string; text: string };

function parseObjectivesJson(raw: string): ChallengeObjectiveRow[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (o): o is { id: string; text: string } =>
          o !== null &&
          typeof o === "object" &&
          typeof (o as { id?: unknown }).id === "string" &&
          typeof (o as { text?: unknown }).text === "string",
      )
      .map((o) => ({ id: o.id, text: o.text }));
  } catch {
    return [];
  }
}

export function rowToChallengeDef(row: {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  xp: number;
  objectivesJson: string;
}): ChallengeDef {
  const objectives = parseObjectivesJson(row.objectivesJson).map((o) => ({
    ...o,
    completed: false,
  }));
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty as ChallengeDef["difficulty"],
    xp: row.xp,
    description: row.description,
    objectives,
  };
}

export async function listChallengesForModule(
  db: ReturnType<typeof getDb>,
  moduleId: string,
): Promise<ChallengeDef[]> {
  const rows = await db
    .select()
    .from(challenges)
    .where(eq(challenges.moduleId, moduleId))
    .orderBy(asc(challenges.sortOrder), asc(challenges.slug));
  return rows.map(rowToChallengeDef);
}

export async function getChallengeContextById(
  db: ReturnType<typeof getDb>,
  challengeId: string,
): Promise<{
  trackId: TrackId;
  lessonSlug: string;
  moduleId: string;
  challenge: ChallengeDef;
} | null> {
  const [row] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .limit(1);
  if (!row) return null;
  const tm = getTrackModuleDefByModuleId(row.moduleId);
  if (!tm) return null;
  return {
    trackId: tm.track,
    lessonSlug: tm.lesson.lessonSlug,
    moduleId: row.moduleId,
    challenge: rowToChallengeDef(row),
  };
}

export async function getFirstChallengeSlugForModule(
  db: ReturnType<typeof getDb>,
  moduleId: string,
): Promise<string | null> {
  const list = await listChallengesForModule(db, moduleId);
  return list[0]?.slug ?? null;
}

export async function getNextCurriculumHrefAfterChallengeDb(
  db: ReturnType<typeof getDb>,
  trackId: TrackId,
  lessonSlug: string,
  currentChallengeSlug: string,
  currentModuleId: string,
  catalogOrder: string[],
): Promise<string> {
  const list = await listChallengesForModule(db, currentModuleId);
  const idx = list.findIndex((c) => c.slug === currentChallengeSlug);
  if (idx !== -1 && idx + 1 < list.length) {
    return challengePath(trackId, lessonSlug, list[idx + 1]!.slug);
  }
  const modIdx = catalogOrder.indexOf(currentModuleId);
  if (modIdx === -1) return "/modules";
  for (let i = modIdx + 1; i < catalogOrder.length; i++) {
    const mid = catalogOrder[i]!;
    const tm = getTrackModuleDefByModuleId(mid);
    if (!tm) continue;
    const { track, lesson } = tm;
    if (TRACKS[track].locked) continue;
    const firstSlug = await getFirstChallengeSlugForModule(db, mid);
    if (firstSlug) {
      return challengePath(track, lesson.lessonSlug, firstSlug);
    }
    return lessonPath(track, lesson.lessonSlug);
  }
  return "/modules";
}

export async function getChallengeByModuleAndSlug(
  db: ReturnType<typeof getDb>,
  moduleId: string,
  slug: string,
): Promise<ChallengeDef | null> {
  const [row] = await db
    .select()
    .from(challenges)
    .where(and(eq(challenges.moduleId, moduleId), eq(challenges.slug, slug)))
    .limit(1);
  return row ? rowToChallengeDef(row) : null;
}
