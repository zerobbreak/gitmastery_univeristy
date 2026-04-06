/** git cherry-pick command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { resolveRef, getHeadSha, createCommit, addReflogEntry, syncLegacyFiles } from "../utils";

export function handleCherryPick(
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

  const currentSha = getHeadSha(state);
  const cherryTree = { ...state.workingTree, ...commit.tree };

  const cherryCommit = createCommit(commit.message, currentSha, cherryTree);
  state.commits[cherryCommit.sha] = cherryCommit;

  if (!state.detachedHead) {
    state.refs[state.HEAD] = cherryCommit.sha;
  } else {
    state.HEAD = cherryCommit.sha;
  }

  state.workingTree = { ...cherryTree };
  state.index = { ...cherryTree };
  state.lastCommitMessage = commit.message;

  addReflogEntry(state, cherryCommit.sha, currentSha, "cherry-pick", commit.message);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [`[${state.HEAD} ${cherryCommit.sha}] ${commit.message}`],
  };
}
