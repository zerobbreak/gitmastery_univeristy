/** Lightweight Git simulator for challenge terminals (no real repo). */

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

const DEFAULT_FILE_CONTENTS: Record<string, string> = {
  "style.css": `/* Main styles */
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 20px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
}
`,
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to My Project</h1>
    <p>This is a sample project.</p>
  </div>
</body>
</html>
`,
  "package.json": `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "author": "",
  "license": "MIT"
}
`,
  "README.md": `# My Project

A sample project for learning Git.

## Getting Started

1. Clone this repository
2. Run \`npm install\`
3. Run \`npm start\`
`,
};

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
  
  if (state.remoteRefs?.[ref]) {
    return state.remoteRefs[ref];
  }
  
  return null;
}

function addReflogEntry(
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
  });
}

function computeFileState(
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

function syncLegacyFiles(state: GitSimState): void {
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

export function createInitialGitState(overrides?: {
  modifiedPaths?: string[];
  remotes?: Record<string, { fetch: string; push: string }>;
  fileContents?: Record<string, string>;
  conflictFiles?: string[];
}): GitSimState {
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

function cloneState(s: GitSimState): GitSimState {
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
    conflictFiles: s.conflictFiles ? [...s.conflictFiles] : undefined,
    untrackedFiles: s.untrackedFiles ? [...s.untrackedFiles] : [],
    deletedFiles: s.deletedFiles ? [...s.deletedFiles] : [],
    branch: s.branch,
    files: { ...s.files },
    lastCommitMessage: s.lastCommitMessage,
    fileContents: s.fileContents ? { ...s.fileContents } : undefined,
  };
}

function countUnstagedModified(s: GitSimState): number {
  return Object.values(s.files).filter((x) => x === "modified").length;
}

function countStaged(s: GitSimState): number {
  return Object.values(s.files).filter((x) => x === "staged").length;
}

export function formatGitStatus(state: GitSimState): string[] {
  const lines: string[] = [];
  const branchDisplay = state.detachedHead
    ? `HEAD detached at ${state.HEAD.slice(0, 7)}`
    : `On branch ${state.HEAD}`;
  lines.push(branchDisplay);
  
  const staged = Object.entries(state.files).filter(([, st]) => st === "staged");
  const unstaged = Object.entries(state.files).filter(([, st]) => st === "modified");
  const untracked = state.untrackedFiles ?? [];
  const deleted = state.deletedFiles ?? [];
  
  if (staged.length > 0) {
    lines.push("Changes to be committed:");
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    for (const [path] of staged) {
      lines.push(`\tmodified:   ${path}`);
    }
    lines.push("");
  }
  
  if (unstaged.length > 0 || deleted.length > 0) {
    lines.push("Changes not staged for commit:");
    lines.push('  (use "git add <file>..." to update what will be committed)');
    lines.push('  (use "git restore <file>..." to discard changes in working directory)');
    for (const [path] of unstaged) {
      lines.push(`\tmodified:   ${path}`);
    }
    for (const path of deleted) {
      lines.push(`\tdeleted:    ${path}`);
    }
    lines.push("");
  }
  
  if (untracked.length > 0) {
    lines.push("Untracked files:");
    lines.push('  (use "git add <file>..." to include in what will be committed)');
    for (const path of untracked) {
      lines.push(`\t${path}`);
    }
    lines.push("");
  }
  
  if (staged.length === 0 && unstaged.length === 0 && untracked.length === 0 && deleted.length === 0) {
    lines.push("nothing to commit, working tree clean");
  } else if (staged.length === 0) {
    lines.push('no changes added to commit (use "git add" and/or "git commit -a")');
  }
  
  return lines;
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function parseCommitMessageFromLine(rawInput: string): { ok: true; message: string } | { ok: false; err: string } {
  const m = rawInput.match(/git\s+commit\s+-m\s+(.+)$/i);
  if (!m) {
    return { ok: false, err: "error: switch `m' requires a value" };
  }
  return { ok: true, message: stripQuotes(m[1].trim()) };
}

export interface RunGitCommandResult {
  state: GitSimState;
  outputLines: string[];
}

export function runGitCommand(prev: GitSimState, rawInput: string): RunGitCommandResult {
  const input = rawInput.trim();
  if (!input) {
    return { state: prev, outputLines: [] };
  }

  const state = cloneState(prev);
  const parts = input.split(/\s+/).filter(Boolean);
  const cmd0 = parts[0]?.toLowerCase();

  if (cmd0 !== "git") {
    return {
      state: prev,
      outputLines: [`${parts[0] ?? "command"}: command not found`],
    };
  }

  const sub = parts[1]?.toLowerCase();

  if (!sub) {
    return {
      state: prev,
      outputLines: ["usage: git <command> [<args>]"],
    };
  }

  if (sub === "status") {
    return { state, outputLines: formatGitStatus(state) };
  }

  if (sub === "checkout" && parts[2] === "-b" && parts[3]) {
    const name = parts[3];
    const currentSha = getHeadSha(state);
    if (!currentSha) {
      return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
    }
    if (state.refs[name]) {
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

  if (sub === "checkout" && parts[2] && parts[2] !== "-b") {
    const target = parts[2];
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

  if ((sub === "switch" && (parts[2] === "-c" || parts[2] === "-C") && parts[3])) {
    const name = parts[3];
    const currentSha = getHeadSha(state);
    if (!currentSha) {
      return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
    }
    if (state.refs[name] && parts[2] === "-c") {
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

  if (sub === "switch" && parts[2] && parts[2] !== "-c" && parts[2] !== "-C") {
    const target = parts[2];
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

  if (sub === "add") {
    const target = parts[2];
    if (!target) {
      return { state: prev, outputLines: ["Nothing specified, nothing added."] };
    }
    
    const paths =
      target === "." || target === "-A" || target === "--all"
        ? [...Object.keys(state.workingTree), ...(state.untrackedFiles ?? [])]
        : [target];

    for (const p of paths) {
      if (state.untrackedFiles?.includes(p)) {
        state.index[p] = state.workingTree[p] ?? "";
        state.untrackedFiles = state.untrackedFiles.filter((f) => f !== p);
        state.files[p] = "staged";
        continue;
      }
      
      if (!(p in state.workingTree) && !(p in state.index)) {
        return { state: prev, outputLines: [`fatal: pathspec '${p}' did not match any files`] };
      }
      
      if (p in state.workingTree) {
        state.index[p] = state.workingTree[p];
      }
    }
    
    syncLegacyFiles(state);
    return { state, outputLines: [] };
  }

  if (sub === "commit") {
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

  if (sub === "remote") {
    const rsub = parts[2]?.toLowerCase();
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

  if (sub === "fetch") {
    const remoteName = parts[2];
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

  if (sub === "branch") {
    const arg = parts[2];
    
    if (!arg || arg === "-a" || arg === "--all") {
      const lines: string[] = [];
      const branches = Object.keys(state.refs).sort();
      for (const b of branches) {
        if (b === state.HEAD && !state.detachedHead) {
          lines.push(`* ${b}`);
        } else {
          lines.push(`  ${b}`);
        }
      }
      if (arg === "-a" || arg === "--all") {
        const remoteRefs = Object.keys(state.remoteRefs ?? {}).sort();
        for (const r of remoteRefs) {
          lines.push(`  remotes/${r}`);
        }
      }
      return { state, outputLines: lines };
    }
    
    if (arg === "-d" || arg === "-D") {
      const branchName = parts[3];
      if (!branchName) {
        return { state: prev, outputLines: ["fatal: branch name required"] };
      }
      if (!state.refs[branchName]) {
        return { state: prev, outputLines: [`error: branch '${branchName}' not found.`] };
      }
      if (branchName === state.HEAD && !state.detachedHead) {
        return { state: prev, outputLines: [`error: Cannot delete branch '${branchName}' checked out`] };
      }
      const sha = state.refs[branchName];
      delete state.refs[branchName];
      return { state, outputLines: [`Deleted branch ${branchName} (was ${sha.slice(0, 7)}).`] };
    }
    
    const currentSha = getHeadSha(state);
    if (!currentSha) {
      return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
    }
    if (state.refs[arg]) {
      return { state: prev, outputLines: [`fatal: a branch named '${arg}' already exists`] };
    }
    state.refs[arg] = currentSha;
    return { state, outputLines: [] };
  }

  if (sub === "log") {
    const lines: string[] = [];
    let sha = getHeadSha(state);
    let count = 0;
    let maxCount = 10;
    const oneline = parts.includes("--oneline");
    
    for (let i = 2; i < parts.length; i++) {
      const p = parts[i];
      if (p.startsWith("-") && !p.startsWith("--")) {
        const num = parseInt(p.slice(1), 10);
        if (!isNaN(num)) maxCount = num;
      }
      if (p.startsWith("-n")) {
        const num = parseInt(p.slice(2), 10);
        if (!isNaN(num)) maxCount = num;
      }
    }
    
    while (sha && count < maxCount) {
      const commit = state.commits[sha];
      if (!commit) break;
      
      if (oneline) {
        const refs = Object.entries(state.refs)
          .filter(([, s]) => s === sha)
          .map(([name]) => name);
        const headMarker = sha === getHeadSha(state) ? "HEAD -> " : "";
        const refStr = refs.length > 0 ? ` (${headMarker}${refs.join(", ")})` : "";
        lines.push(`${sha.slice(0, 7)}${refStr} ${commit.message}`);
      } else {
        lines.push(`commit ${sha}`);
        const refs = Object.entries(state.refs)
          .filter(([, s]) => s === sha)
          .map(([name]) => name);
        if (refs.length > 0 || sha === getHeadSha(state)) {
          const headMarker = sha === getHeadSha(state) ? "HEAD -> " : "";
          lines[lines.length - 1] += ` (${headMarker}${refs.join(", ")})`;
        }
        lines.push(`Date:   ${new Date(commit.timestamp).toUTCString()}`);
        lines.push("");
        lines.push(`    ${commit.message}`);
        lines.push("");
      }
      
      sha = commit.parentSha;
      count++;
    }
    
    return { state, outputLines: lines };
  }

  if (sub === "diff") {
    const staged = parts.includes("--staged") || parts.includes("--cached");
    const lines: string[] = [];
    const headCommit = getHeadCommit(state);
    const headTree = headCommit?.tree ?? {};
    
    if (staged) {
      for (const [filename, content] of Object.entries(state.index)) {
        if (headTree[filename] !== content) {
          lines.push(`diff --git a/${filename} b/${filename}`);
          lines.push(`--- a/${filename}`);
          lines.push(`+++ b/${filename}`);
          const oldLines = (headTree[filename] ?? "").split("\n");
          const newLines = content.split("\n");
          lines.push(`@@ -1,${oldLines.length} +1,${newLines.length} @@`);
          for (const ol of oldLines.slice(0, 3)) {
            lines.push(`-${ol}`);
          }
          for (const nl of newLines.slice(0, 3)) {
            lines.push(`+${nl}`);
          }
        }
      }
    } else {
      for (const [filename, content] of Object.entries(state.workingTree)) {
        const indexContent = state.index[filename] ?? headTree[filename] ?? "";
        if (content !== indexContent) {
          lines.push(`diff --git a/${filename} b/${filename}`);
          lines.push(`--- a/${filename}`);
          lines.push(`+++ b/${filename}`);
          const oldLines = indexContent.split("\n");
          const newLines = content.split("\n");
          lines.push(`@@ -1,${oldLines.length} +1,${newLines.length} @@`);
          for (const ol of oldLines.slice(0, 3)) {
            lines.push(`-${ol}`);
          }
          for (const nl of newLines.slice(0, 3)) {
            lines.push(`+${nl}`);
          }
        }
      }
    }
    
    return { state, outputLines: lines };
  }

  if (sub === "reflog") {
    const lines: string[] = [];
    const maxEntries = 10;
    for (let i = 0; i < Math.min(state.reflog.length, maxEntries); i++) {
      const entry = state.reflog[i];
      lines.push(`${entry.sha.slice(0, 7)} HEAD@{${i}}: ${entry.action}: ${entry.message}`);
    }
    return { state, outputLines: lines };
  }

  if (sub === "show") {
    const ref = parts[2] ?? "HEAD";
    const sha = resolveRef(state, ref);
    if (!sha) {
      return { state: prev, outputLines: [`fatal: bad revision '${ref}'`] };
    }
    const commit = state.commits[sha];
    if (!commit) {
      return { state: prev, outputLines: [`fatal: bad object ${sha}`] };
    }
    
    const lines = [
      `commit ${sha}`,
      `Date:   ${new Date(commit.timestamp).toUTCString()}`,
      "",
      `    ${commit.message}`,
      "",
    ];
    
    if (commit.parentSha) {
      const parent = state.commits[commit.parentSha];
      if (parent) {
        for (const [filename, content] of Object.entries(commit.tree)) {
          if (parent.tree[filename] !== content) {
            lines.push(`diff --git a/${filename} b/${filename}`);
            lines.push(`--- a/${filename}`);
            lines.push(`+++ b/${filename}`);
          }
        }
      }
    }
    
    return { state, outputLines: lines };
  }

  if (sub === "merge") {
    const target = parts[2];
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
    syncLegacyFiles(state);
    
    return {
      state,
      outputLines: [`Merge made by the 'ort' strategy.`],
    };
  }

  if (sub === "reset") {
    let mode: "soft" | "mixed" | "hard" = "mixed";
    let targetRef = "HEAD";
    
    for (let i = 2; i < parts.length; i++) {
      if (parts[i] === "--soft") mode = "soft";
      else if (parts[i] === "--mixed") mode = "mixed";
      else if (parts[i] === "--hard") mode = "hard";
      else if (!parts[i].startsWith("-")) targetRef = parts[i];
    }
    
    const targetSha = resolveRef(state, targetRef);
    if (!targetSha) {
      return { state: prev, outputLines: [`fatal: ambiguous argument '${targetRef}'`] };
    }
    
    const prevSha = getHeadSha(state);
    const targetCommit = state.commits[targetSha];
    
    if (!state.detachedHead) {
      state.refs[state.HEAD] = targetSha;
    } else {
      state.HEAD = targetSha;
    }
    
    if (mode === "mixed" || mode === "hard") {
      state.index = { ...targetCommit?.tree ?? {} };
    }
    
    if (mode === "hard") {
      state.workingTree = { ...targetCommit?.tree ?? {} };
    }
    
    addReflogEntry(state, targetSha, prevSha, `reset: moving to ${targetRef}`, targetCommit?.message ?? "");
    syncLegacyFiles(state);
    
    return {
      state,
      outputLines: mode === "hard" ? [`HEAD is now at ${targetSha.slice(0, 7)} ${targetCommit?.message ?? ""}`] : [],
    };
  }

  if (sub === "restore") {
    const staged = parts.includes("--staged");
    const fileArgs = parts.filter((p, i) => i >= 2 && !p.startsWith("-"));
    
    if (fileArgs.length === 0) {
      return { state: prev, outputLines: ["fatal: you must specify path(s) to restore"] };
    }
    
    const headCommit = getHeadCommit(state);
    const headTree = headCommit?.tree ?? {};
    
    for (const fileArg of fileArgs) {
      if (staged) {
        if (fileArg in state.index || fileArg in headTree) {
          state.index[fileArg] = headTree[fileArg] ?? "";
          if (!headTree[fileArg]) {
            delete state.index[fileArg];
          }
        }
      } else {
        if (fileArg in state.workingTree || fileArg in state.index) {
          state.workingTree[fileArg] = state.index[fileArg] ?? headTree[fileArg] ?? "";
        }
      }
    }
    
    syncLegacyFiles(state);
    return { state, outputLines: [] };
  }

  if (sub === "stash") {
    const stashSub = parts[2]?.toLowerCase();
    
    if (!stashSub || stashSub === "push") {
      const headSha = getHeadSha(state);
      if (!headSha) {
        return { state: prev, outputLines: ["fatal: not a valid object name: 'HEAD'"] };
      }
      
      const headCommit = state.commits[headSha];
      const headTree = headCommit?.tree ?? {};
      
      let hasChanges = false;
      for (const [f, c] of Object.entries(state.workingTree)) {
        if (c !== headTree[f]) {
          hasChanges = true;
          break;
        }
      }
      for (const [f, c] of Object.entries(state.index)) {
        if (c !== headTree[f]) {
          hasChanges = true;
          break;
        }
      }
      
      if (!hasChanges) {
        return { state: prev, outputLines: ["No local changes to save"] };
      }
      
      const entry: StashEntry = {
        id: state.stash.length,
        message: `WIP on ${state.HEAD}`,
        timestamp: Date.now(),
        workingTree: { ...state.workingTree },
        index: { ...state.index },
        baseSha: headSha,
      };
      
      state.stash.unshift(entry);
      
      if (headCommit) {
        state.workingTree = { ...headCommit.tree };
        state.index = { ...headCommit.tree };
      }
      
      syncLegacyFiles(state);
      return { state, outputLines: [`Saved working directory and index state ${entry.message}`] };
    }
    
    if (stashSub === "pop" || stashSub === "apply") {
      const stashIndex = 0;
      if (state.stash.length === 0) {
        return { state: prev, outputLines: ["No stash entries found."] };
      }
      
      const entry = stashSub === "pop" ? state.stash.shift()! : state.stash[stashIndex];
      state.workingTree = { ...entry.workingTree };
      state.index = { ...entry.index };
      
      syncLegacyFiles(state);
      
      if (stashSub === "pop") {
        return { state, outputLines: [`Dropped refs/stash@{0} (${entry.message})`] };
      }
      return { state, outputLines: [`Applied stash@{0}`] };
    }
    
    if (stashSub === "list") {
      const lines = state.stash.map((e, i) => `stash@{${i}}: ${e.message}`);
      return { state, outputLines: lines };
    }
    
    if (stashSub === "drop") {
      if (state.stash.length === 0) {
        return { state: prev, outputLines: ["No stash entries found."] };
      }
      const dropped = state.stash.shift()!;
      return { state, outputLines: [`Dropped refs/stash@{0} (${dropped.message})`] };
    }
    
    if (stashSub === "clear") {
      state.stash = [];
      return { state, outputLines: [] };
    }
    
    return { state: prev, outputLines: ["usage: git stash [push|pop|apply|list|drop|clear]"] };
  }

  if (sub === "push") {
    let remoteName = "origin";
    let branchToPush = state.HEAD;
    let setUpstream = false;
    
    for (let i = 2; i < parts.length; i++) {
      if (parts[i] === "-u" || parts[i] === "--set-upstream") {
        setUpstream = true;
      } else if (!parts[i].startsWith("-")) {
        if (remoteName === "origin" && !state.remotes?.[parts[i]]) {
          branchToPush = parts[i];
        } else {
          remoteName = parts[i];
          if (parts[i + 1] && !parts[i + 1].startsWith("-")) {
            branchToPush = parts[i + 1];
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

  if (sub === "revert") {
    const ref = parts[2];
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

  if (sub === "cherry-pick") {
    const ref = parts[2];
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

  return {
    state: prev,
    outputLines: [`git: '${sub}' is not a git command. See 'git --help'.`],
  };
}

export function statusBarModifiedCount(state: GitSimState): number {
  return countUnstagedModified(state);
}

export function statusBarStagedCount(state: GitSimState): number {
  return countStaged(state);
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
