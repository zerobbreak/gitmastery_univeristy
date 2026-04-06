/** Custom `git hook` — install named hooks for automation drills. */

import type { GitSimState, RunGitCommandResult } from "../types";

export function handleHook(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const sub = args[0]?.toLowerCase();
  if (sub === "install" && args[1]) {
    const name = args[1];
    if (!state.hooksInstalled) state.hooksInstalled = [];
    if (!state.hooksInstalled.includes(name)) {
      state.hooksInstalled.push(name);
    }
    return {
      state,
      outputLines: [`Installed hook: ${name} (simulator)`],
    };
  }
  return {
    state: prev,
    outputLines: ["usage: git hook install <hook-name>  (e.g. pre-commit)"],
  };
}
