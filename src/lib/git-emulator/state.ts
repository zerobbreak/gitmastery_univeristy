/** State factory functions for the Git simulator. */

import type { GitSimState, ReflogEntry, TrackedFileState } from "./types";
import { DEFAULT_FILE_CONTENTS, RECOVER_LOST_COMMIT_MESSAGE } from "./constants";
import { createCommit, syncLegacyFiles } from "./utils";

/**
 * CHAL202: main was reset back to the first commit, but a second commit still
 * exists in the object DB and appears in reflog — matches "lost commit" recovery drills.
 */
function createRecoverLostCommitInitialState(overrides?: {
  modifiedPaths?: string[];
  fileContents?: Record<string, string>;
}): GitSimState {
  const baseContents = { ...DEFAULT_FILE_CONTENTS };
  if (overrides?.fileContents) {
    Object.assign(baseContents, overrides.fileContents);
  }

  const commitA = createCommit("Initial commit", null, baseContents);
  const treeB = {
    ...baseContents,
    "README.md": `${baseContents["README.md"]}\n\n## Feature\nImportant work (this commit was \"lost\" after reset).\n`,
  };
  const commitB = createCommit(RECOVER_LOST_COMMIT_MESSAGE, commitA.sha, treeB);

  const modifiedSet = new Set(
    overrides?.modifiedPaths ?? ["style.css", "index.html", "package.json"],
  );

  const workingTree: Record<string, string> = {};
  for (const [filename, content] of Object.entries(commitA.tree)) {
    if (modifiedSet.has(filename)) {
      workingTree[filename] = content + "\n/* Modified */";
    } else {
      workingTree[filename] = content;
    }
  }
  if (overrides?.fileContents) {
    Object.assign(workingTree, overrides.fileContents);
  }

  const index = { ...commitA.tree };
  const files: Record<string, TrackedFileState> = {};
  for (const filename of Object.keys(workingTree)) {
    files[filename] = modifiedSet.has(filename) ? "modified" : "clean";
  }

  const now = Date.now();
  const reflog: ReflogEntry[] = [
    {
      sha: commitA.sha,
      prevSha: commitB.sha,
      action: "reset: moving to HEAD~1",
      message: commitA.message,
      timestamp: now,
    },
    {
      sha: commitB.sha,
      prevSha: commitA.sha,
      action: "commit",
      message: commitB.message,
      timestamp: now - 1000,
    },
    {
      sha: commitA.sha,
      prevSha: null,
      action: "commit (initial)",
      message: "Initial commit",
      timestamp: now - 2000,
    },
  ];

  return {
    HEAD: "main",
    detachedHead: false,
    refs: { main: commitA.sha },
    commits: { [commitA.sha]: commitA, [commitB.sha]: commitB },
    reflog,
    workingTree,
    index,
    stash: [],
    remotes: undefined,
    fetchedRemotes: [],
    conflictFiles: undefined,
    untrackedFiles: [],
    deletedFiles: [],
    branch: "main",
    files,
    lastCommitMessage: null,
    fileContents: { ...workingTree },
  };
}

export function createInitialGitState(overrides?: {
  modifiedPaths?: string[];
  remotes?: Record<string, { fetch: string; push: string }>;
  fileContents?: Record<string, string>;
  conflictFiles?: string[];
  /** When true, start after a simulated reset — reflog lists the lost commit (CHAL202). */
  recoverLostCommitScenario?: boolean;
}): GitSimState {
  if (overrides?.recoverLostCommitScenario) {
    return createRecoverLostCommitInitialState(overrides);
  }

  const baseContents = { ...DEFAULT_FILE_CONTENTS };
  if (overrides?.fileContents) {
    Object.assign(baseContents, overrides.fileContents);
  }

  const initialCommit = createCommit("Initial commit", null, baseContents);

  const modifiedSet = new Set(
    overrides?.modifiedPaths ?? ["style.css", "index.html", "package.json"],
  );

  const workingTree: Record<string, string> = {};
  for (const [filename, content] of Object.entries(baseContents)) {
    if (modifiedSet.has(filename)) {
      workingTree[filename] = content + "\n/* Modified */";
    } else {
      workingTree[filename] = content;
    }
  }

  if (overrides?.fileContents) {
    Object.assign(workingTree, overrides.fileContents);
  }

  const index = { ...initialCommit.tree };

  const files: Record<string, TrackedFileState> = {};
  for (const filename of Object.keys(workingTree)) {
    if (modifiedSet.has(filename)) {
      files[filename] = "modified";
    } else {
      files[filename] = "clean";
    }
  }

  const state: GitSimState = {
    HEAD: "main",
    detachedHead: false,
    refs: { main: initialCommit.sha },
    commits: { [initialCommit.sha]: initialCommit },
    reflog: [
      {
        sha: initialCommit.sha,
        prevSha: null,
        action: "commit (initial)",
        message: "Initial commit",
        timestamp: initialCommit.timestamp,
      },
    ],
    workingTree,
    index,
    stash: [],
    remotes: overrides?.remotes ? { ...overrides.remotes } : undefined,
    fetchedRemotes: [],
    conflictFiles: overrides?.conflictFiles ? [...overrides.conflictFiles] : undefined,
    untrackedFiles: [],
    deletedFiles: [],
    branch: "main",
    files,
    lastCommitMessage: null,
    fileContents: { ...workingTree },
  };

  return state;
}

/** CHAL401: linear history with 4 commits on main — use `git rebase -i HEAD~3` to squash the last three. */
export function createInteractiveRebaseDrillState(): GitSimState {
  const baseTree = { ...DEFAULT_FILE_CONTENTS };
  const c0 = createCommit("Initial import", null, baseTree);
  const t1 = { ...baseTree, "README.md": `${baseTree["README.md"]}\n\n[chunk 1]` };
  const c1 = createCommit("wip: chunk 1", c0.sha, t1);
  const t2 = { ...t1, "README.md": `${t1["README.md"]}\n[chunk 2]` };
  const c2 = createCommit("wip: chunk 2", c1.sha, t2);
  const t3 = { ...t2, "README.md": `${t2["README.md"]}\n[chunk 3]` };
  const c3 = createCommit("wip: chunk 3", c2.sha, t3);

  const workingTree = { ...t3 };
  const index = { ...t3 };
  const files: Record<string, TrackedFileState> = {};
  for (const k of Object.keys(workingTree)) {
    files[k] = "clean";
  }

  const now = Date.now();
  const state: GitSimState = {
    HEAD: "main",
    detachedHead: false,
    refs: { main: c3.sha },
    commits: { [c0.sha]: c0, [c1.sha]: c1, [c2.sha]: c2, [c3.sha]: c3 },
    reflog: [
      { sha: c3.sha, prevSha: c2.sha, action: "commit", message: c3.message, timestamp: now },
      { sha: c2.sha, prevSha: c1.sha, action: "commit", message: c2.message, timestamp: now - 1 },
      { sha: c1.sha, prevSha: c0.sha, action: "commit", message: c1.message, timestamp: now - 2 },
      { sha: c0.sha, prevSha: null, action: "commit (initial)", message: c0.message, timestamp: now - 3 },
    ],
    workingTree,
    index,
    stash: [],
    branch: "main",
    files,
    lastCommitMessage: c3.message,
    fileContents: { ...workingTree },
  };
  syncLegacyFiles(state);
  return state;
}

/** CHAL402: main behind feature-x — merge after enabling rerere. */
export function createRerereMergeLabState(): GitSimState {
  const baseTree = { ...DEFAULT_FILE_CONTENTS };
  const mainC = createCommit("Initial", null, baseTree);
  const featTree = {
    ...baseTree,
    "README.md": `${baseTree["README.md"]}\n\n## Feature-x`,
  };
  const featC = createCommit("Add feature-x section", mainC.sha, featTree);

  const workingTree = { ...mainC.tree };
  const index = { ...mainC.tree };
  const files: Record<string, TrackedFileState> = {};
  for (const filename of Object.keys(workingTree)) {
    files[filename] = "clean";
  }

  const now = Date.now();
  const state: GitSimState = {
    HEAD: "main",
    detachedHead: false,
    refs: { main: mainC.sha, "feature-x": featC.sha },
    commits: { [mainC.sha]: mainC, [featC.sha]: featC },
    reflog: [
      { sha: mainC.sha, prevSha: null, action: "commit (initial)", message: mainC.message, timestamp: now },
    ],
    workingTree,
    index,
    stash: [],
    branch: "main",
    files,
    lastCommitMessage: null,
    fileContents: { ...workingTree },
  };
  syncLegacyFiles(state);
  return state;
}
