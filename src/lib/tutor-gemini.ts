import "server-only";

import { getGeminiGenerativeModel } from "@/lib/ai/gemini";

/**
 * Dynamic Git tutor copy via Gemini. Call only when `GEMINI_API_KEY` is set.
 * @param recentCommands — Commands the student already ran in this session (oldest → newest); focus on the last one(s).
 */
export async function generateTutorHelp(
  studentQueryAfterTutor: string,
  recentCommands: string[] = [],
): Promise<string> {
  const model = getGeminiGenerativeModel();
  const q = studentQueryAfterTutor.trim();

  const historyBlock =
    recentCommands.length > 0
      ? recentCommands.map((c, i) => `${i + 1}. ${c}`).join("\n")
      : "(none yet — they have not run a non-tutor command in this terminal.)";

  const lastCmd =
    recentCommands.length > 0 ? recentCommands[recentCommands.length - 1]! : null;

  const prompt = `You are a Git tutor for beginners in a web-based learning app. The student is in a simulated terminal (sandbox), not a real repository on their machine.

Rules:
- Explain in plain English. Be friendly and concise (aim under 220 words unless the question clearly needs more).
- Use short paragraphs. Avoid markdown headings (#). You may use bullet lines with a leading "- " if helpful.
- When showing a command, use backticks like \`git status\`.
- **Focus on their recent commands:** You are given an ordered list of commands they already typed (below). Prefer explaining, clarifying, or asking about **the most recent command** (or the last few) over giving a lecture on all of Git. If their question after "tutor" is broad or empty, respond in the context of **that last command** — what it means, what happens next, or one short follow-up question about it — instead of listing every Git topic.
- If there are no prior commands yet, give a tiny orientation and invite them to run something like \`git status\` first, then ask again.
- Do not claim you can see their live files; you only know the command text they typed.

Commands they typed in this terminal before this tutor message (simulator; oldest first):
${historyBlock}
${lastCmd ? `\nThe command to prioritize if relevant: \`${lastCmd}\`\n` : ""}

Student input after the activation word "tutor":
${q || "(empty — respond in the context of their last command if any; otherwise a brief welcome and one suggested first step)"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return text.trim();
}
