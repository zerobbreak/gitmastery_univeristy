import { createClerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

import { corsHeaders } from "@/lib/cors";
import { getUserIdFromRequest } from "@/lib/server-auth";

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  updated_at: string | null;
};

function getClerk() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY is not set");
  return createClerkClient({ secretKey });
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

  let oauthToken: string | undefined;
  try {
    const clerk = getClerk();
    const { data } = await clerk.users.getUserOauthAccessToken(userId, "github");
    oauthToken = data[0]?.token;
  } catch (e) {
    console.error("Clerk OAuth token error:", e);
    return NextResponse.json(
      { error: "Could not read GitHub connection from Clerk" },
      { status: 502, headers },
    );
  }

  if (!oauthToken) {
    return NextResponse.json(
      {
        error: "GitHub not connected",
        code: "GITHUB_NOT_CONNECTED",
      },
      { status: 400, headers },
    );
  }

  const ghRes = await fetch(
    "https://api.github.com/user/repos?per_page=100&sort=updated",
    {
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!ghRes.ok) {
    const text = await ghRes.text();
    console.error("GitHub API error:", ghRes.status, text);
    return NextResponse.json(
      { error: "GitHub API request failed" },
      { status: 502, headers },
    );
  }

  const raw = (await ghRes.json()) as GitHubRepo[];
  const repos = raw.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    private: r.private,
    default_branch: r.default_branch,
    updated_at: r.updated_at,
  }));

  return NextResponse.json({ repos }, { status: 200, headers });
}
