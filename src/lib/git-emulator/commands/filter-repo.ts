/** Simulated git filter-repo — marks sensitive history rewrite. */

import type { GitSimState, RunGitCommandResult } from "../types";

export function handleFilterRepo(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const force = args.includes("--force") || args.includes("-f");
  if (!force) {
    return {
      state: prev,
      outputLines: ["Aborting: specify --force to rewrite history (simulator)."],
    };
  }
  state.filterRepoRan = true;
  return {
    state,
    outputLines: [
      "Parsed 1 commits",
      "New history written (simulator — no real blobs removed).",
    ],
  };
}
