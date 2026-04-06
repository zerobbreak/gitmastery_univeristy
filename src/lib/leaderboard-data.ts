import { and, count, desc, gt, ilike, type SQL } from "drizzle-orm";

import type { LeaderboardPayload } from "@/lib/leaderboard-types";

import { getDb, schema } from "../../db/index";

const { userProfiles } = schema;

function formatCompactXp(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
  return String(xp);
}

function sanitizeSearch(q: string): string {
  return q.trim().slice(0, 64).replace(/[%_\\]/g, "");
}

export async function buildLeaderboardPayload(
  clerkUserId: string,
  options: { page: number; pageSize: number; query: string },
): Promise<LeaderboardPayload> {
  const db = getDb();
  const page = Math.max(1, options.page);
  const pageSize = Math.min(100, Math.max(1, options.pageSize));
  const safeQ = sanitizeSearch(options.query);

  const filter: SQL | undefined =
    safeQ.length > 0
      ? ilike(userProfiles.displayName, `%${safeQ}%`)
      : undefined;

  const countRow = await db
    .select({ totalCount: count() })
    .from(userProfiles)
    .where(filter);

  const total = Number(countRow[0]?.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageClamped = Math.min(page, totalPages);
  const offset = (pageClamped - 1) * pageSize;

  const rows = await db
    .select({
      clerkUserId: userProfiles.clerkUserId,
      displayName: userProfiles.displayName,
      totalXp: userProfiles.totalXp,
      streakDays: userProfiles.streakDays,
      masteryLevel: userProfiles.masteryLevel,
    })
    .from(userProfiles)
    .where(filter)
    .orderBy(desc(userProfiles.totalXp))
    .limit(pageSize)
    .offset(offset);

  async function rankForXp(xp: number): Promise<number> {
    const [{ ahead }] = await db
      .select({ ahead: count() })
      .from(userProfiles)
      .where(
        filter
          ? and(filter, gt(userProfiles.totalXp, xp))
          : gt(userProfiles.totalXp, xp),
      );
    return Number(ahead) + 1;
  }

  const entries: LeaderboardPayload["entries"] = await Promise.all(
    rows.map(async (r) => {
      const rank = await rankForXp(r.totalXp);
      const name = (r.displayName ?? "Learner").trim() || "Learner";
      return {
        rank,
        displayName: r.clerkUserId === clerkUserId ? "You" : name,
        totalXp: r.totalXp,
        totalXpLabel: formatCompactXp(r.totalXp),
        streakDays: r.streakDays,
        masteryLevel: r.masteryLevel,
        isYou: r.clerkUserId === clerkUserId,
      };
    }),
  );

  const top3 = await db
    .select({
      clerkUserId: userProfiles.clerkUserId,
      displayName: userProfiles.displayName,
      totalXp: userProfiles.totalXp,
      masteryLevel: userProfiles.masteryLevel,
    })
    .from(userProfiles)
    .where(filter)
    .orderBy(desc(userProfiles.totalXp))
    .limit(3);

  const podium: LeaderboardPayload["podium"] = await Promise.all(
    top3.map(async (r) => {
      const rank = await rankForXp(r.totalXp);
      const name = (r.displayName ?? "Learner").trim() || "Learner";
      return {
        rank,
        displayName: r.clerkUserId === clerkUserId ? "You" : name,
        totalXpLabel: formatCompactXp(r.totalXp),
        masteryLevel: r.masteryLevel,
        isYou: r.clerkUserId === clerkUserId,
      };
    }),
  );

  return {
    page: pageClamped,
    pageSize,
    totalCount: total,
    totalPages,
    query: safeQ,
    entries,
    podium,
  };
}
