/** git restore command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadCommit, syncLegacyFiles } from "../utils";

export function handleRestore(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const staged = args.includes("--staged");
  const fileArgs = args.filter((p) => !p.startsWith("-"));

  if (fileArgs.length === 0) {
    return { state: prev, outputLines: ["fatal: you must specify path(s) to restore"] };
  }

  const headCommit = getHeadCommit(state);
  const headTree = headCommit?.tree ?? {};

  for (const fileArg of fileArgs) {
    if (staged) {
      if (fileArg in state.index || fileArg in headTree) {
        state.index[fileArg] = headTree[fileArg] ?? "";
        if (!headTree[fileArg]) {
          delete state.index[fileArg];
        }
      }
    } else {
      if (fileArg in state.workingTree || fileArg in state.index) {
        state.workingTree[fileArg] = state.index[fileArg] ?? headTree[fileArg] ?? "";
      }
    }
  }

  syncLegacyFiles(state);
  return { state, outputLines: [] };
}
