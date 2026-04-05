import { NextRequest, NextResponse } from "next/server";

import { isGeminiConfigured } from "@/lib/ai/gemini";
import { corsHeaders } from "@/lib/cors";
import { runTutorStaticFallback } from "@/lib/git-tutor";
import { getUserIdFromRequest } from "@/lib/server-auth";
import { generateTutorHelp } from "@/lib/tutor-gemini";

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

function splitLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  return lines.length ? lines : [text];
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

  const line =
    typeof body === "object" &&
    body !== null &&
    "line" in body &&
    typeof (body as { line: unknown }).line === "string"
      ? (body as { line: string }).line
      : null;

  let recentCommands: string[] = [];
  if (
    typeof body === "object" &&
    body !== null &&
    "recentCommands" in body &&
    Array.isArray((body as { recentCommands: unknown }).recentCommands)
  ) {
    const rc = (body as { recentCommands: unknown[] }).recentCommands;
    if (rc.every((x) => typeof x === "string")) {
      recentCommands = rc
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30)
        .map((s) => (s.length > 500 ? s.slice(0, 500) : s));
    }
  }

  if (!line?.trim().toLowerCase().startsWith("tutor")) {
    return NextResponse.json(
      { error: "Line must start with tutor" },
      { status: 400, headers },
    );
  }

  const rest = line.trim().slice("tutor".length).trim();

  if (!isGeminiConfigured()) {
    const staticLines = runTutorStaticFallback(line);
    return NextResponse.json(
      {
        lines: staticLines ?? ["Tutor unavailable."],
        source: "static" as const,
        hint: "Add GEMINI_API_KEY to .env.local for dynamic explanations.",
      },
      { status: 200, headers },
    );
  }

  try {
    const text = await generateTutorHelp(rest, recentCommands);
    return NextResponse.json(
      {
        lines: splitLines(text),
        source: "gemini" as const,
      },
      { status: 200, headers },
    );
  } catch (e) {
    console.error("tutor POST:", e);
    const fallback = runTutorStaticFallback(line);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      {
        lines: [
          ...(fallback ?? ["Tutor hit an error."]),
          "",
          `(Falling back to static help. ${msg})`,
        ],
        source: "static" as const,
      },
      { status: 200, headers },
    );
  }
}
