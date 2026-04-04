import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { buildDashboardPayload } from "@/lib/dashboard-data";
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

  let displayName = "Learner";
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    displayName =
      clerkUser.firstName?.trim() ||
      clerkUser.username?.trim() ||
      clerkUser.emailAddresses[0]?.emailAddress?.split("@")[0]?.trim() ||
      "Learner";
  } catch (e) {
    console.warn("dashboard: Clerk user lookup failed", e);
  }

  try {
    const payload = await buildDashboardPayload(userId, displayName);
    return NextResponse.json(payload, { status: 200, headers });
  } catch (e) {
    console.error("dashboard GET:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers },
    );
  }
}
