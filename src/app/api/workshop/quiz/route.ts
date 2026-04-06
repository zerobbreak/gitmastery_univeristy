import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDb, schema } from "../../../../../db/index";
import { corsHeaders } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/server-auth";
import {
  submitWorkshopQuiz,
  type WorkshopQuizMode,
} from "@/lib/workshop-mastery";

const { userProfiles } = schema;

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("mode" in body) ||
    !("segments" in body)
  ) {
    return NextResponse.json(
      { error: "Expected { mode, segments }" },
      { status: 400, headers },
    );
  }

  const mode = (body as { mode: string }).mode as WorkshopQuizMode;
  if (mode !== "learning" && mode !== "review" && mode !== "improve") {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400, headers });
  }

  const segments = (body as { segments: unknown }).segments;
  if (!Array.isArray(segments) || segments.length === 0) {
    return NextResponse.json(
      { error: "segments must be a non-empty array" },
      { status: 400, headers },
    );
  }

  const normalized: Array<{ moduleId: string; answers: Record<string, number> }> =
    [];
  for (const seg of segments) {
    if (typeof seg !== "object" || seg === null) continue;
    const moduleId = (seg as { moduleId?: unknown }).moduleId;
    const answers = (seg as { answers?: unknown }).answers;
    if (typeof moduleId !== "string" || typeof answers !== "object" || answers === null) {
      continue;
    }
    const ansMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(answers)) {
      if (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 3) {
        ansMap[k] = v;
      }
    }
    normalized.push({ moduleId, answers: ansMap });
  }

  if (normalized.length === 0) {
    return NextResponse.json(
      { error: "No valid segments" },
      { status: 400, headers },
    );
  }

  const db = getDb();
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404, headers });
  }

  try {
    const results = await submitWorkshopQuiz(db, profile.id, mode, normalized);
    return NextResponse.json(results, { status: 200, headers });
  } catch (e) {
    console.error("workshop quiz POST:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers },
    );
  }
}
