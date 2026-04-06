/** git config — minimal key/value for challenges (e.g. rerere.enabled). */

import type { GitSimState, RunGitCommandResult } from "../types";

export function handleConfig(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const a0 = args[0]?.toLowerCase();
  if (a0 === "--global" || a0 === "--local") {
    const key = args[1];
    const value = args[2];
    if (!key || value === undefined) {
      return { state: prev, outputLines: ["usage: git config [--global] <key> <value>"] };
    }
    if (!state.gitConfig) state.gitConfig = {};
    state.gitConfig[key] = value;
    return { state, outputLines: [] };
  }

  const key = args[0];
  const value = args[1];
  if (!key || value === undefined) {
    return { state: prev, outputLines: ["usage: git config <key> <value>"] };
  }
  if (!state.gitConfig) state.gitConfig = {};
  state.gitConfig[key] = value;
  return { state, outputLines: [] };
}
