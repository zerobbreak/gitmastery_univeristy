/** git fsck — repository integrity (simulator). */

import type { GitSimState, RunGitCommandResult } from "../types";

export function handleFsck(state: GitSimState): RunGitCommandResult {
  state.fsckCompleted = true;
  return {
    state,
    outputLines: [
      "Checking object directories: 100%",
      "Verifying commits: 100%",
      "dangling commit 0000000 (simulator)",
    ],
  };
}
