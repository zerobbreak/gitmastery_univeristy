import { verifyToken } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export async function getUserIdFromRequest(
  request: NextRequest,
): Promise<string | null> {
  const raw = request.headers.get("authorization");
  if (!raw?.startsWith("Bearer ")) return null;
  const token = raw.slice(7);
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error("CLERK_SECRET_KEY is not set");
    return null;
  }
  try {
    const payload = await verifyToken(token, { secretKey });
    const sub = payload.sub;
    return typeof sub === "string" ? sub : null;
  } catch {
    return null;
  }
}
