/** Type definitions for the Git simulator. */

export type TrackedFileState = "clean" | "modified" | "staged" | "untracked" | "deleted";

/** A commit object with parent reference and tree snapshot. */
export interface Commit {
  sha: string;
  message: string;
  timestamp: number;
  parentSha: string | null;
  /** Snapshot of file contents at this commit. */
  tree: Record<string, string>;
}

/** Entry in the reflog tracking HEAD movements. */
export interface ReflogEntry {
  sha: string;
  prevSha: string | null;
  action: string;
  message: string;
  timestamp: number;
}

/** Stashed changes entry. */
export interface StashEntry {
  id: number;
  message: string;
  timestamp: number;
  workingTree: Record<string, string>;
  index: Record<string, string>;
  baseSha: string;
}

export interface GitSimState {
  /** Current HEAD - branch name or detached SHA. */
  HEAD: string;
  /** Whether HEAD is detached (pointing directly to a SHA). */
  detachedHead: boolean;
  /** Branch name -> commit SHA. */
  refs: Record<string, string>;
  /** SHA -> Commit object. */
  commits: Record<string, Commit>;
  /** HEAD movement history. */
  reflog: ReflogEntry[];
  /** Current working tree file contents. */
  workingTree: Record<string, string>;
  /** Staged file contents (index). */
  index: Record<string, string>;
  /** Stashed changes stack. */
  stash: StashEntry[];
  /** Named remotes. */
  remotes?: Record<string, { fetch: string; push: string }>;
  /** Remotes that have been fetched this session. */
  fetchedRemotes?: string[];
  /** Remote tracking refs: "origin/main" -> SHA. */
  remoteRefs?: Record<string, string>;
  /** Refs that have been pushed: "origin/branchname" -> SHA. */
  pushedRefs?: Record<string, string>;
  /** Simplified git config (e.g. rerere.enabled). */
  gitConfig?: Record<string, string>;
  /** Submodule path -> metadata (submodule add). */
  submodules?: Record<string, { url: string; path: string }>;
  /** Annotated tag name -> commit SHA. */
  annotatedTags?: Record<string, string>;
  /** Set after a successful interactive rebase squash. */
  interactiveRebaseSquashed?: boolean;
  /** Last branch merged with `git merge` (for challenge checks). */
  lastMergeSource?: string | null;
  /** After `git fsck`. */
  fsckCompleted?: boolean;
  /** After `git cat-file` inspection. */
  catFileInspectCount?: number;
  /** After simulated history rewrite (filter-repo). */
  filterRepoRan?: boolean;
  /** Hook names installed via `git hook install <name>`. */
  hooksInstalled?: string[];
  /** Files with unresolved conflict markers. */
  conflictFiles?: string[];
  /** Untracked files (not in any commit tree). */
  untrackedFiles?: string[];
  /** Deleted files (were tracked but removed from working tree). */
  deletedFiles?: string[];

  // Legacy compatibility fields
  /** @deprecated Use HEAD instead. */
  branch: string;
  /** @deprecated Use workingTree/index comparison instead. */
  files: Record<string, TrackedFileState>;
  /** @deprecated Use commits[refs[HEAD]].message instead. */
  lastCommitMessage: string | null;
  /** @deprecated Use workingTree instead. */
  fileContents?: Record<string, string>;
}

export interface RunGitCommandResult {
  state: GitSimState;
  outputLines: string[];
}

/** Command handler function signature. */
export type CommandHandler = (
  state: GitSimState,
  args: string[],
  rawInput: string,
) => RunGitCommandResult;
