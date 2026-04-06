/** git remote, fetch, and push command handlers. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha, stripQuotes } from "../utils";

export function handleRemote(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
  rawInput: string,
): RunGitCommandResult {
  const rsub = args[0]?.toLowerCase();

  if (rsub === "-v" || rsub === "-vv" || rsub === "show") {
    const remotes = state.remotes ?? {};
    const names = Object.keys(remotes).sort();
    if (names.length === 0) {
      return { state, outputLines: [""] };
    }
    const lines: string[] = [];
    for (const name of names) {
      const r = remotes[name]!;
      lines.push(`${name}\t${r.fetch} (fetch)`);
      lines.push(`${name}\t${r.push} (push)`);
    }
    return { state, outputLines: lines };
  }

  if (rsub === "add") {
    const m = rawInput.match(/^\s*git\s+remote\s+add\s+(\S+)\s+(.+)$/i);
    if (!m) {
      return { state: prev, outputLines: ["usage: git remote add <name> <url>"] };
    }
    const name = m[1];
    const url = stripQuotes(m[2].trim());
    if (!state.remotes) state.remotes = {};
    if (state.remotes[name]) {
      return { state: prev, outputLines: [`error: remote ${name} already exists.`] };
    }
    state.remotes[name] = { fetch: url, push: url };
    return { state, outputLines: [] };
  }

  return {
    state: prev,
    outputLines: ["usage: git remote [-v | add <name> <url>]"],
  };
}

export function handleFetch(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const remoteName = args[0];
  if (!remoteName) {
    return { state: prev, outputLines: ["fatal: no remote specified"] };
  }

  const r = state.remotes?.[remoteName];
  if (!r) {
    return {
      state: prev,
      outputLines: [`fatal: '${remoteName}' does not appear to be a git repository`],
    };
  }

  if (!state.fetchedRemotes) state.fetchedRemotes = [];
  if (!state.fetchedRemotes.includes(remoteName)) {
    state.fetchedRemotes.push(remoteName);
  }
  if (!state.remoteRefs) state.remoteRefs = {};

  const headSha = getHeadSha(state);
  if (headSha) {
    state.remoteRefs[`${remoteName}/main`] = headSha;
  }

  return {
    state,
    outputLines: [
      `From ${r.fetch}`,
      ` * [new branch]      main       -> ${remoteName}/main`,
    ],
  };
}

export function handlePush(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  let remoteName = "origin";
  let branchToPush = state.HEAD;
  let setUpstream = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-u" || args[i] === "--set-upstream") {
      setUpstream = true;
    } else if (!args[i].startsWith("-")) {
      if (remoteName === "origin" && !state.remotes?.[args[i]]) {
        branchToPush = args[i];
      } else {
        remoteName = args[i];
        if (args[i + 1] && !args[i + 1].startsWith("-")) {
          branchToPush = args[i + 1];
          i++;
        }
      }
    }
  }

  if (!state.remotes?.[remoteName]) {
    return { state: prev, outputLines: [`fatal: '${remoteName}' does not appear to be a git repository`] };
  }

  const sha = state.refs[branchToPush];

  if (!sha) {
    return { state: prev, outputLines: [`error: src refspec ${branchToPush} does not match any`] };
  }

  if (!state.pushedRefs) state.pushedRefs = {};
  if (!state.remoteRefs) state.remoteRefs = {};

  state.pushedRefs[`${remoteName}/${branchToPush}`] = sha;
  state.remoteRefs[`${remoteName}/${branchToPush}`] = sha;

  const lines = [
    `To ${state.remotes[remoteName].push}`,
    ` * [new branch]      ${branchToPush} -> ${branchToPush}`,
  ];

  if (setUpstream) {
    lines.push(`Branch '${branchToPush}' set up to track remote branch '${branchToPush}' from '${remoteName}'.`);
  }

  return { state, outputLines: lines };
}
