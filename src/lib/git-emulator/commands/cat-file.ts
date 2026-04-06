/** git cat-file — inspect objects (simulator). */

import type { GitSimState, RunGitCommandResult } from "../types";
import { resolveRef } from "../utils";

export function handleCatFile(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const kind = args[0]?.toLowerCase();
  const ref = args[1] ?? "HEAD";
  if (!kind || (kind !== "-t" && kind !== "-p" && kind !== "-s")) {
    return {
      state: prev,
      outputLines: ["usage: git cat-file (-t|-p|-s) <object>"],
    };
  }

  const sha = resolveRef(state, ref);
  if (!sha || !state.commits[sha]) {
    return { state: prev, outputLines: [`fatal: Not a valid object name ${ref}`] };
  }

  if (!state.catFileInspectCount) state.catFileInspectCount = 0;
  state.catFileInspectCount += 1;

  if (kind === "-t") {
    return { state, outputLines: ["commit"] };
  }
  if (kind === "-s") {
    return { state, outputLines: ["256"] };
  }
  const commit = state.commits[sha];
  if (!commit) {
    return { state: prev, outputLines: ["fatal: missing commit"] };
  }
  const lines = [
    `tree ${sha.slice(0, 7)}`,
    `parent ${commit.parentSha ? commit.parentSha.slice(0, 7) : "(none)"}`,
    "",
    commit.message,
  ];
  return { state, outputLines: lines };
}
