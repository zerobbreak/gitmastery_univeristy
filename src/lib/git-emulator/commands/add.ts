/** git add command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { syncLegacyFiles } from "../utils";

export function handleAdd(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const target = args[0];
  if (!target) {
    return { state: prev, outputLines: ["Nothing specified, nothing added."] };
  }

  const paths =
    target === "." || target === "-A" || target === "--all"
      ? [...Object.keys(state.workingTree), ...(state.untrackedFiles ?? [])]
      : [target];

  for (const p of paths) {
    if (state.untrackedFiles?.includes(p)) {
      state.index[p] = state.workingTree[p] ?? "";
      state.untrackedFiles = state.untrackedFiles.filter((f) => f !== p);
      state.files[p] = "staged";
      continue;
    }

    if (!(p in state.workingTree) && !(p in state.index)) {
      return { state: prev, outputLines: [`fatal: pathspec '${p}' did not match any files`] };
    }

    if (p in state.workingTree) {
      state.index[p] = state.workingTree[p];
    }
  }

  syncLegacyFiles(state);
  return { state, outputLines: [] };
}
