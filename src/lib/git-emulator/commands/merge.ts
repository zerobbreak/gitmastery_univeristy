/** git merge command handler. */

import type { Commit, GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha, resolveRef, createCommit, addReflogEntry, syncLegacyFiles } from "../utils";

export function handleMerge(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const target = args[0];
  if (!target) {
    return { state: prev, outputLines: ["fatal: no branch specified"] };
  }

  const targetSha = resolveRef(state, target);
  if (!targetSha) {
    return { state: prev, outputLines: [`merge: ${target} - not something we can merge`] };
  }

  const currentSha = getHeadSha(state);
  if (!currentSha) {
    return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
  }

  if (currentSha === targetSha) {
    return { state, outputLines: ["Already up to date."] };
  }

  let canFastForward = false;
  let checkSha: string | null = targetSha;
  while (checkSha) {
    if (checkSha === currentSha) {
      canFastForward = true;
      break;
    }
    const checkCommit: Commit | undefined = state.commits[checkSha];
    checkSha = checkCommit?.parentSha ?? null;
  }

  if (canFastForward) {
    if (!state.detachedHead) {
      state.refs[state.HEAD] = targetSha;
    } else {
      state.HEAD = targetSha;
    }
    const targetCommit = state.commits[targetSha];
    if (targetCommit) {
      state.workingTree = { ...targetCommit.tree };
      state.index = { ...targetCommit.tree };
    }
    addReflogEntry(state, targetSha, currentSha, "merge", `merge ${target}: Fast-forward`);
    state.lastMergeSource = target;
    syncLegacyFiles(state);
    return {
      state,
      outputLines: [
        `Updating ${currentSha.slice(0, 7)}..${targetSha.slice(0, 7)}`,
        "Fast-forward",
      ],
    };
  }

  const targetCommit = state.commits[targetSha];
  const mergeTree = { ...state.workingTree, ...targetCommit?.tree };
  const mergeCommit = createCommit(`Merge branch '${target}'`, currentSha, mergeTree);
  state.commits[mergeCommit.sha] = mergeCommit;

  if (!state.detachedHead) {
    state.refs[state.HEAD] = mergeCommit.sha;
  } else {
    state.HEAD = mergeCommit.sha;
  }

  state.workingTree = { ...mergeTree };
  state.index = { ...mergeTree };
  addReflogEntry(state, mergeCommit.sha, currentSha, "merge", `merge ${target}`);
  state.lastMergeSource = target;
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [`Merge made by the 'ort' strategy.`],
  };
}
