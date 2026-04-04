import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Google AI Studio / Gemini API key. Never expose to the client — keep in `.env.local` only.
 * @see https://ai.google.dev/gemini-api/docs/api-key
 */
const apiKey = process.env.GEMINI_API_KEY;

/**
 * Model id for the assistant (override per env). No network I/O until you call the model.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

export function isGeminiConfigured(): boolean {
  return Boolean(apiKey?.trim());
}

/**
 * Returns a GenerativeModel instance for server-side use (Route Handlers, Server Actions).
 * Instantiating this does not call the API; requests happen only when you call e.g. `generateContent`.
 *
 * @throws If `GEMINI_API_KEY` is missing — wire auth and call sites before production use.
 */
export function getGeminiGenerativeModel() {
  if (!isGeminiConfigured()) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local to enable the Gemini assistant.",
    );
  }

  const client = new GoogleGenerativeAI(apiKey!);
  return client.getGenerativeModel({ model: GEMINI_MODEL });
}
