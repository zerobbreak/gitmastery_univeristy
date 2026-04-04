import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb, schema } from "../../../../db/index";
import { corsHeaders } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/server-auth";

const { userProfiles } = schema;

async function parseBody(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function getOrCreateProfile(clerkUserId: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.clerkUserId, clerkUserId))
    .limit(1);
  if (existing[0]) return existing[0];
  const [row] = await db
    .insert(userProfiles)
    .values({ clerkUserId })
    .returning();
  return row;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(req: NextRequest) {
  const headers = corsHeaders(req);
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers },
    );
  }

  try {
    const row = await getOrCreateProfile(userId);
    return NextResponse.json(
      {
        onboardingStep: row.onboardingStep,
        onboardingCompletedAt: row.onboardingCompletedAt?.toISOString() ?? null,
      },
      { status: 200, headers },
    );
  } catch (e) {
    console.error("onboarding GET:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers },
    );
  }
}

export async function PUT(req: NextRequest) {
  const headers = corsHeaders(req);
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers },
    );
  }

  try {
    const body = await parseBody(req);
    const db = getDb();
    await getOrCreateProfile(userId);

    const stepRaw = body["onboardingStep"];
    const completedRaw = body["onboardingCompleted"];

    const onboardingStep =
      typeof stepRaw === "number" && Number.isFinite(stepRaw)
        ? Math.max(0, Math.min(10, Math.floor(stepRaw)))
        : undefined;

    const onboardingCompleted =
      typeof completedRaw === "boolean" ? completedRaw : undefined;

    const setPayload: {
      onboardingStep?: number;
      onboardingCompletedAt?: Date | null;
      updatedAt: Date;
    } = { updatedAt: new Date() };

    if (onboardingStep !== undefined) {
      setPayload.onboardingStep = onboardingStep;
    }
    if (onboardingCompleted === true) {
      setPayload.onboardingCompletedAt = new Date();
    } else if (onboardingCompleted === false) {
      setPayload.onboardingCompletedAt = null;
    }

    const [row] = await db
      .update(userProfiles)
      .set(setPayload)
      .where(eq(userProfiles.clerkUserId, userId))
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "Update failed" },
        { status: 500, headers },
      );
    }

    return NextResponse.json(
      {
        onboardingStep: row.onboardingStep,
        onboardingCompletedAt: row.onboardingCompletedAt?.toISOString() ?? null,
      },
      { status: 200, headers },
    );
  } catch (e) {
    console.error("onboarding PUT:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers },
    );
  }
}
