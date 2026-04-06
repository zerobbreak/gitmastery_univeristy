/** git reset command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha, resolveRef, addReflogEntry, syncLegacyFiles } from "../utils";

export function handleReset(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  let mode: "soft" | "mixed" | "hard" = "mixed";
  let targetRef = "HEAD";

  for (const arg of args) {
    if (arg === "--soft") mode = "soft";
    else if (arg === "--mixed") mode = "mixed";
    else if (arg === "--hard") mode = "hard";
    else if (!arg.startsWith("-")) targetRef = arg;
  }

  const targetSha = resolveRef(state, targetRef);
  if (!targetSha) {
    return { state: prev, outputLines: [`fatal: ambiguous argument '${targetRef}'`] };
  }

  const prevSha = getHeadSha(state);
  const targetCommit = state.commits[targetSha];

  if (!state.detachedHead) {
    state.refs[state.HEAD] = targetSha;
  } else {
    state.HEAD = targetSha;
  }

  if (mode === "mixed" || mode === "hard") {
    state.index = { ...(targetCommit?.tree ?? {}) };
  }

  if (mode === "hard") {
    state.workingTree = { ...(targetCommit?.tree ?? {}) };
  }

  addReflogEntry(state, targetSha, prevSha, `reset: moving to ${targetRef}`, targetCommit?.message ?? "");
  syncLegacyFiles(state);

  return {
    state,
    outputLines: mode === "hard" ? [`HEAD is now at ${targetSha.slice(0, 7)} ${targetCommit?.message ?? ""}`] : [],
  };
}
