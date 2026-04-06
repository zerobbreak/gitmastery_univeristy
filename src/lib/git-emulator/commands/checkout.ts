/** git checkout and git switch command handlers. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha, resolveRef, addReflogEntry, syncLegacyFiles } from "../utils";

export function handleCheckoutNewBranch(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const name = args[1]; // -b is args[0]
  const startRef = args[2];
  const prevSha = getHeadSha(state);
  const startSha = startRef ? resolveRef(state, startRef) : prevSha;

  if (!startSha) {
    return {
      state: prev,
      outputLines: [`fatal: not a valid object name: '${startRef ?? "HEAD"}'`],
    };
  }
  if (!prevSha) {
    return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
  }
  if (state.refs[name]) {
    return { state: prev, outputLines: [`fatal: a branch named '${name}' already exists`] };
  }

  state.refs[name] = startSha;
  state.HEAD = name;
  state.detachedHead = false;
  state.branch = name;

  const targetCommit = state.commits[startSha];
  if (targetCommit) {
    state.workingTree = { ...targetCommit.tree };
    state.index = { ...targetCommit.tree };
  }

  addReflogEntry(state, startSha, prevSha, "checkout", `moving from ${prev.HEAD} to ${name}`);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [`Switched to a new branch '${name}'`],
  };
}

export function handleCheckout(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const target = args[0];
  const targetSha = resolveRef(state, target);

  if (!targetSha) {
    return { state: prev, outputLines: [`error: pathspec '${target}' did not match any file(s) known to git`] };
  }

  const prevSha = getHeadSha(state);
  if (state.refs[target]) {
    state.HEAD = target;
    state.detachedHead = false;
    state.branch = target;
  } else {
    state.HEAD = targetSha;
    state.detachedHead = true;
    state.branch = targetSha.slice(0, 7);
  }

  const targetCommit = state.commits[targetSha];
  if (targetCommit) {
    state.workingTree = { ...targetCommit.tree };
    state.index = { ...targetCommit.tree };
  }

  addReflogEntry(state, targetSha, prevSha, "checkout", `moving from ${prev.HEAD} to ${target}`);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: state.detachedHead
      ? [`Note: switching to '${target}'.`, "", `HEAD is now at ${targetSha.slice(0, 7)} ${targetCommit?.message ?? ""}`]
      : [`Switched to branch '${target}'`],
  };
}

export function handleSwitchNewBranch(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const flag = args[0]; // -c or -C
  const name = args[1];
  const currentSha = getHeadSha(state);

  if (!currentSha) {
    return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
  }
  if (state.refs[name] && flag === "-c") {
    return { state: prev, outputLines: [`fatal: a branch named '${name}' already exists`] };
  }

  state.refs[name] = currentSha;
  state.HEAD = name;
  state.detachedHead = false;
  state.branch = name;

  addReflogEntry(state, currentSha, currentSha, "checkout", `moving from ${prev.HEAD} to ${name}`);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [`Switched to a new branch '${name}'`],
  };
}

export function handleSwitch(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const target = args[0];

  if (!state.refs[target]) {
    return { state: prev, outputLines: [`fatal: invalid reference: ${target}`] };
  }

  const targetSha = state.refs[target];
  const prevSha = getHeadSha(state);

  state.HEAD = target;
  state.detachedHead = false;
  state.branch = target;

  const targetCommit = state.commits[targetSha];
  if (targetCommit) {
    state.workingTree = { ...targetCommit.tree };
    state.index = { ...targetCommit.tree };
  }

  addReflogEntry(state, targetSha, prevSha, "checkout", `moving from ${prev.HEAD} to ${target}`);
  syncLegacyFiles(state);

  return {
    state,
    outputLines: [`Switched to branch '${target}'`],
  };
}
