/** git commit command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import {
  getHeadCommit,
  getHeadSha,
  createCommit,
  addReflogEntry,
  syncLegacyFiles,
  parseCommitMessageFromLine,
} from "../utils";

export function handleCommit(
  state: GitSimState,
  _args: string[],
  prev: GitSimState,
  rawInput: string,
): RunGitCommandResult {
  const parsed = parseCommitMessageFromLine(rawInput);
  if (!parsed.ok) {
    return { state: prev, outputLines: [parsed.err] };
  }

  const headCommit = getHeadCommit(state);
  const headTree = headCommit?.tree ?? {};
  const stagedChanges: string[] = [];

  for (const [filename, content] of Object.entries(state.index)) {
    if (headTree[filename] !== content) {
      stagedChanges.push(filename);
    }
  }

  if (stagedChanges.length === 0) {
    return {
      state: prev,
      outputLines: [
        `On branch ${state.HEAD}`,
        "nothing to commit, working tree clean",
      ],
    };
  }

  const parentSha = getHeadSha(state);
  const newCommit = createCommit(parsed.message, parentSha, state.index);
  state.commits[newCommit.sha] = newCommit;

  if (!state.detachedHead) {
    state.refs[state.HEAD] = newCommit.sha;
  } else {
    state.HEAD = newCommit.sha;
  }

  addReflogEntry(state, newCommit.sha, parentSha, "commit", parsed.message);

  state.lastCommitMessage = parsed.message;
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [
      `[${state.HEAD} ${newCommit.sha}] ${parsed.message}`,
      `${stagedChanges.length} file${stagedChanges.length === 1 ? "" : "s"} changed`,
    ],
  };
}
