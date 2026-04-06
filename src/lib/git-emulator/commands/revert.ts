/** git revert command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { resolveRef, getHeadSha, createCommit, addReflogEntry, syncLegacyFiles } from "../utils";

export function handleRevert(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const ref = args[0];
  if (!ref) {
    return { state: prev, outputLines: ["fatal: no commit specified"] };
  }

  const sha = resolveRef(state, ref);
  if (!sha) {
    return { state: prev, outputLines: [`fatal: bad revision '${ref}'`] };
  }

  const commit = state.commits[sha];
  if (!commit) {
    return { state: prev, outputLines: [`fatal: bad object ${sha}`] };
  }

  const parentSha = commit.parentSha;
  const parentCommit = parentSha ? state.commits[parentSha] : null;
  const parentTree = parentCommit?.tree ?? {};

  const currentSha = getHeadSha(state);
  const revertTree = { ...state.workingTree };

  for (const [filename, content] of Object.entries(commit.tree)) {
    if (parentTree[filename] !== content) {
      revertTree[filename] = parentTree[filename] ?? "";
      if (!parentTree[filename]) {
        delete revertTree[filename];
      }
    }
  }

  const revertCommit = createCommit(`Revert "${commit.message}"`, currentSha, revertTree);
  state.commits[revertCommit.sha] = revertCommit;

  if (!state.detachedHead) {
    state.refs[state.HEAD] = revertCommit.sha;
  } else {
    state.HEAD = revertCommit.sha;
  }

  state.workingTree = { ...revertTree };
  state.index = { ...revertTree };
  state.lastCommitMessage = revertCommit.message;

  addReflogEntry(state, revertCommit.sha, currentSha, "revert", commit.message);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [`[${state.HEAD} ${revertCommit.sha}] Revert "${commit.message}"`],
  };
}
