import "server-only";

import { getGeminiGenerativeModel } from "@/lib/ai/gemini";

/**
 * Dynamic Git tutor copy via Gemini. Call only when `GEMINI_API_KEY` is set.
 */
export async function generateTutorHelp(studentQueryAfterTutor: string): Promise<string> {
  const model = getGeminiGenerativeModel();
  const q = studentQueryAfterTutor.trim();

  const prompt = `You are a Git tutor for beginners in a web-based learning app. The student is in a simulated terminal (sandbox), not a real repository on their machine.

Rules:
- Explain in plain English. Be friendly and concise (aim under 220 words unless the question clearly needs more).
- Use short paragraphs. Avoid markdown headings (#). You may use bullet lines with a leading "- " if helpful.
- When showing a command, use backticks like \`git status\`.
- If the question is empty or very vague, briefly say what Git is for, then mention: status, add, commit, branch, checkout/switch, and that branches isolate work.
- Do not claim you can see their files or branch; speak about Git concepts in general.

Student input after the activation word "tutor":
${q || "(empty — give a welcoming overview and suggest they ask about a specific command)"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.trim();
}
