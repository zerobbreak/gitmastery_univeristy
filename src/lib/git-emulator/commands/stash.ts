/** git stash command handler. */

import type { GitSimState, StashEntry, RunGitCommandResult } from "../types";
import { getHeadSha, syncLegacyFiles } from "../utils";

export function handleStash(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const stashSub = args[0]?.toLowerCase();

  if (!stashSub || stashSub === "push") {
    const headSha = getHeadSha(state);
    if (!headSha) {
      return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
    }

    const headCommit = state.commits[headSha];
    const headTree = headCommit?.tree ?? {};

    let hasChanges = false;
    for (const [f, c] of Object.entries(state.workingTree)) {
      if (c !== headTree[f]) {
        hasChanges = true;
        break;
      }
    }
    for (const [f, c] of Object.entries(state.index)) {
      if (c !== headTree[f]) {
        hasChanges = true;
        break;
      }
    }

    if (!hasChanges) {
      return { state: prev, outputLines: ["No local changes to save"] };
    }

    const entry: StashEntry = {
      id: state.stash.length,
      message: `WIP on ${state.HEAD}`,
      timestamp: Date.now(),
      workingTree: { ...state.workingTree },
      index: { ...state.index },
      baseSha: headSha,
    };

    state.stash.unshift(entry);

    if (headCommit) {
      state.workingTree = { ...headCommit.tree };
      state.index = { ...headCommit.tree };
    }

    syncLegacyFiles(state);
    return { state, outputLines: [`Saved working directory and index state ${entry.message}`] };
  }

  if (stashSub === "pop" || stashSub === "apply") {
    const stashIndex = 0;
    if (state.stash.length === 0) {
      return { state: prev, outputLines: ["No stash entries found."] };
    }

    const entry = stashSub === "pop" ? state.stash.shift()! : state.stash[stashIndex];
    state.workingTree = { ...entry.workingTree };
    state.index = { ...entry.index };

    syncLegacyFiles(state);

    if (stashSub === "pop") {
      return { state, outputLines: [`Dropped refs/stash@{0} (${entry.message})`] };
    }
    return { state, outputLines: [`Applied stash@{0}`] };
  }

  if (stashSub === "list") {
    const lines = state.stash.map((e, i) => `stash@{${i}}: ${e.message}`);
    return { state, outputLines: lines };
  }

  if (stashSub === "drop") {
    if (state.stash.length === 0) {
      return { state: prev, outputLines: ["No stash entries found."] };
    }
    const dropped = state.stash.shift()!;
    return { state, outputLines: [`Dropped refs/stash@{0} (${dropped.message})`] };
  }

  if (stashSub === "clear") {
    state.stash = [];
    return { state, outputLines: [] };
  }

  return { state: prev, outputLines: ["usage: git stash [push|pop|apply|list|drop|clear]"] };
}
