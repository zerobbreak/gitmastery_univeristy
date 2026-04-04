import type { NextRequest } from "next/server";

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  const h: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin) {
    h["Access-Control-Allow-Origin"] = origin;
    h["Vary"] = "Origin";
  } else {
    h["Access-Control-Allow-Origin"] = "*";
  }
  return h;
}
