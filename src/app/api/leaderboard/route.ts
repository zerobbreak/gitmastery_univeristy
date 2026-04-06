import { NextRequest, NextResponse } from "next/server";

import { buildLeaderboardPayload } from "@/lib/leaderboard-data";
import { corsHeaders } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/server-auth";

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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20),
  );
  const query = searchParams.get("q") ?? "";

  try {
    const payload = await buildLeaderboardPayload(userId, {
      page,
      pageSize,
      query,
    });
    return NextResponse.json(payload, { status: 200, headers });
  } catch (e) {
    console.error("leaderboard GET:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers },
    );
  }
}
