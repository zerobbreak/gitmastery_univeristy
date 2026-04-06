/** git branch command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha } from "../utils";

export function handleBranch(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const arg = args[0];

  if (!arg || arg === "-a" || arg === "--all") {
    const lines: string[] = [];
    const branches = Object.keys(state.refs).sort();
    for (const b of branches) {
      if (b === state.HEAD && !state.detachedHead) {
        lines.push(`* ${b}`);
      } else {
        lines.push(`  ${b}`);
      }
    }
    if (arg === "-a" || arg === "--all") {
      const remoteRefs = Object.keys(state.remoteRefs ?? {}).sort();
      for (const r of remoteRefs) {
        lines.push(`  remotes/${r}`);
      }
    }
    return { state, outputLines: lines };
  }

  if (arg === "-d" || arg === "-D") {
    const branchName = args[1];
    if (!branchName) {
      return { state: prev, outputLines: ["fatal: branch name required"] };
    }
    if (!state.refs[branchName]) {
      return { state: prev, outputLines: [`error: branch '${branchName}' not found.`] };
    }
    if (branchName === state.HEAD && !state.detachedHead) {
      return { state: prev, outputLines: [`error: Cannot delete branch '${branchName}' checked out`] };
    }
    const sha = state.refs[branchName];
    delete state.refs[branchName];
    return { state, outputLines: [`Deleted branch ${branchName} (was ${sha.slice(0, 7)}).`] };
  }

  const currentSha = getHeadSha(state);
  if (!currentSha) {
    return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
  }
  if (state.refs[arg]) {
    return { state: prev, outputLines: [`fatal: a branch named '${arg}' already exists`] };
  }
  state.refs[arg] = currentSha;
  return { state, outputLines: [] };
}
