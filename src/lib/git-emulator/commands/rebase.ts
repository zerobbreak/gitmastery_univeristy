/** git rebase — interactive squash (simplified). */

import type { GitSimState, RunGitCommandResult } from "../types";
import {
  createCommit,
  getHeadSha,
  addReflogEntry,
  syncLegacyFiles,
} from "../utils";

/**
 * `git rebase -i HEAD~N` squashes the last N commits (excluding their shared base)
 * into a single commit with parent = parent of the oldest squashed commit.
 */
export function handleRebase(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
  rawInput: string,
): RunGitCommandResult {
  const joined = args.join(" ");
  const interactive = args[0] === "-i" || args[0] === "--interactive";
  if (!interactive) {
    return {
      state: prev,
      outputLines: ["usage: git rebase -i HEAD~<n>  (simulator: interactive squash only)"],
    };
  }

  const m = rawInput.match(/HEAD~(\d+)/i);
  if (!m) {
    return {
      state: prev,
      outputLines: ["fatal: invalid upstream HEAD~N"],
    };
  }
  const n = parseInt(m[1], 10);
  if (n < 2 || Number.isNaN(n)) {
    return {
      state: prev,
      outputLines: ["fatal: need at least 2 commits to squash (HEAD~2 or higher)"],
    };
  }

  if (state.detachedHead) {
    return { state: prev, outputLines: ["fatal: rebase in detached HEAD not supported in simulator"] };
  }

  const pick: string[] = [];
  let cur: string | null = getHeadSha(state);
  for (let i = 0; i < n; i++) {
    if (!cur) {
      return { state: prev, outputLines: ["fatal: not enough commits to squash"] };
    }
    pick.push(cur);
    const c = state.commits[cur];
    cur = c?.parentSha ?? null;
  }
  const baseParent = cur;

  const tipSha = pick[0]!;
  const tipCommit = state.commits[tipSha];
  if (!tipCommit || baseParent === undefined) {
    return { state: prev, outputLines: ["fatal: cannot resolve squash range"] };
  }

  const newCommit = createCommit(
    "Squashed interactive rebase",
    baseParent,
    { ...tipCommit.tree },
  );
  state.commits[newCommit.sha] = newCommit;
  state.refs[state.HEAD] = newCommit.sha;
  state.workingTree = { ...tipCommit.tree };
  state.index = { ...tipCommit.tree };
  state.interactiveRebaseSquashed = true;
  state.lastCommitMessage = newCommit.message;
  addReflogEntry(state, newCommit.sha, tipSha, "rebase -i (finish)", newCommit.message);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [
      "Successfully rebased and updated refs/heads/" + state.HEAD + ".",
      `Squashed ${n} commits.`,
    ],
  };
}
