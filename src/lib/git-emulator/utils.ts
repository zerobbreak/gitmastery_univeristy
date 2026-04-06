/** Core utilities for the Git simulator. */

import type { Commit, GitSimState, ReflogEntry, TrackedFileState } from "./types";

/** Generate a short SHA-like hash. */
export function generateSha(): string {
  return Math.random().toString(36).substring(2, 9);
}

/** Create a commit object. */
export function createCommit(
  message: string,
  parentSha: string | null,
  tree: Record<string, string>,
): Commit {
  return {
    sha: generateSha(),
    message,
    timestamp: Date.now(),
    parentSha,
    tree: { ...tree },
  };
}

/** Get the current commit SHA from HEAD. */
export function getHeadSha(state: GitSimState): string | null {
  if (state.detachedHead) {
    return state.HEAD;
  }
  return state.refs[state.HEAD] ?? null;
}

/** Get the current commit object. */
export function getHeadCommit(state: GitSimState): Commit | null {
  const sha = getHeadSha(state);
  return sha ? state.commits[sha] ?? null : null;
}

/** Resolve a ref (branch name, SHA, HEAD, HEAD~n) to a SHA. */
export function resolveRef(state: GitSimState, ref: string): string | null {
  if (ref === "HEAD") {
    return getHeadSha(state);
  }

  const headMatch = ref.match(/^HEAD~(\d+)$/);
  if (headMatch) {
    const n = parseInt(headMatch[1], 10);
    let sha = getHeadSha(state);
    for (let i = 0; i < n && sha; i++) {
      const commit = state.commits[sha];
      sha = commit?.parentSha ?? null;
    }
    return sha;
  }

  if (state.refs[ref]) {
    return state.refs[ref];
  }

  if (state.commits[ref]) {
    return ref;
  }

  /** Short SHA / prefix match so reflog lines (7 chars) work with checkout. */
  if (/^[0-9a-f]{4,40}$/i.test(ref)) {
    const lower = ref.toLowerCase();
    for (const sha of Object.keys(state.commits)) {
      if (sha.toLowerCase().startsWith(lower)) return sha;
    }
  }

  if (state.remoteRefs?.[ref]) {
    return state.remoteRefs[ref];
  }

  return null;
}

export function addReflogEntry(
  state: GitSimState,
  sha: string,
  prevSha: string | null,
  action: string,
  message: string,
): void {
  state.reflog.unshift({
    sha,
    prevSha,
    action,
    message,
    timestamp: Date.now(),
  } satisfies ReflogEntry);
}

export function computeFileState(
  filename: string,
  state: GitSimState,
): TrackedFileState {
  const headCommit = getHeadCommit(state);
  const headTree = headCommit?.tree ?? {};

  const inWorkingTree = filename in state.workingTree;
  const inIndex = filename in state.index;
  const isUntracked = state.untrackedFiles?.includes(filename);
  const isDeleted = state.deletedFiles?.includes(filename);

  if (isDeleted) return "deleted";
  if (isUntracked) return "untracked";

  if (inIndex) {
    const indexContent = state.index[filename];
    const headContent = headTree[filename];
    if (indexContent !== headContent) {
      return "staged";
    }
  }

  if (inWorkingTree) {
    const workingContent = state.workingTree[filename];
    const indexContent = state.index[filename] ?? headTree[filename];
    if (workingContent !== indexContent) {
      return "modified";
    }
  }

  return "clean";
}

export function syncLegacyFiles(state: GitSimState): void {
  const allFiles = new Set([
    ...Object.keys(state.workingTree),
    ...Object.keys(state.index),
    ...(state.untrackedFiles ?? []),
  ]);

  state.files = {};
  for (const filename of allFiles) {
    state.files[filename] = computeFileState(filename, state);
  }

  state.fileContents = { ...state.workingTree };
}

/** Recompute `files` and mirror `fileContents` from `workingTree` — use after Files-tab edits. */
export function syncFileStatesFromWorkingTree(state: GitSimState): void {
  syncLegacyFiles(state);
}

export function cloneState(s: GitSimState): GitSimState {
  return {
    HEAD: s.HEAD,
    detachedHead: s.detachedHead,
    refs: { ...s.refs },
    commits: { ...s.commits },
    reflog: [...s.reflog],
    workingTree: { ...s.workingTree },
    index: { ...s.index },
    stash: s.stash.map((e) => ({
      ...e,
      workingTree: { ...e.workingTree },
      index: { ...e.index },
    })),
    remotes: s.remotes ? { ...s.remotes } : undefined,
    fetchedRemotes: s.fetchedRemotes ? [...s.fetchedRemotes] : [],
    remoteRefs: s.remoteRefs ? { ...s.remoteRefs } : undefined,
    pushedRefs: s.pushedRefs ? { ...s.pushedRefs } : undefined,
    gitConfig: s.gitConfig ? { ...s.gitConfig } : undefined,
    submodules: s.submodules
      ? Object.fromEntries(
          Object.entries(s.submodules).map(([k, v]) => [k, { ...v }]),
        )
      : undefined,
    annotatedTags: s.annotatedTags ? { ...s.annotatedTags } : undefined,
    interactiveRebaseSquashed: s.interactiveRebaseSquashed,
    lastMergeSource: s.lastMergeSource ?? null,
    fsckCompleted: s.fsckCompleted,
    catFileInspectCount: s.catFileInspectCount,
    filterRepoRan: s.filterRepoRan,
    hooksInstalled: s.hooksInstalled ? [...s.hooksInstalled] : undefined,
    conflictFiles: s.conflictFiles ? [...s.conflictFiles] : undefined,
    untrackedFiles: s.untrackedFiles ? [...s.untrackedFiles] : [],
    deletedFiles: s.deletedFiles ? [...s.deletedFiles] : [],
    branch: s.branch,
    files: { ...s.files },
    lastCommitMessage: s.lastCommitMessage,
    fileContents: s.fileContents ? { ...s.fileContents } : undefined,
  };
}

export function countUnstagedModified(s: GitSimState): number {
  return Object.values(s.files).filter((x) => x === "modified").length;
}

export function countStaged(s: GitSimState): number {
  return Object.values(s.files).filter((x) => x === "staged").length;
}

export function stripQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

export function parseCommitMessageFromLine(
  rawInput: string,
): { ok: true; message: string } | { ok: false; err: string } {
  const m = rawInput.match(/git\s+commit\s+-m\s+(.+)$/i);
  if (!m) {
    return { ok: false, err: "error: switch `m' requires a value" };
  }
  return { ok: true, message: stripQuotes(m[1].trim()) };
}

export function hasConflictMarkers(content: string): boolean {
  return /<<<<<<<|=======|>>>>>>>/.test(content);
}

export function countUnresolvedConflicts(state: GitSimState): number {
  if (!state.workingTree || !state.conflictFiles) return 0;
  return state.conflictFiles.filter((f) => {
    const content = state.workingTree?.[f];
    return content && hasConflictMarkers(content);
  }).length;
}

export function getBranches(state: GitSimState): string[] {
  return Object.keys(state.refs);
}

export function getCommitHistory(state: GitSimState, maxCount = 50): Commit[] {
  const history: Commit[] = [];
  let sha = getHeadSha(state);

  while (sha && history.length < maxCount) {
    const commit = state.commits[sha];
    if (!commit) break;
    history.push(commit);
    sha = commit.parentSha;
  }

  return history;
}

export function getWorkingTreeFiles(state: GitSimState): string[] {
  return Object.keys(state.workingTree);
}
