/** Lightweight Git simulator for challenge terminals (no real repo). */

export type TrackedFileState = "clean" | "modified" | "staged";

export interface GitSimState {
  branch: string;
  /** Tracked paths -> working tree / index state */
  files: Record<string, TrackedFileState>;
  lastCommitMessage: string | null;
  /** Named remotes (fork / upstream challenges). Omitted when unused. */
  remotes?: Record<string, { fetch: string; push: string }>;
  /** Remotes that have received a successful `git fetch <name>` in this session. */
  fetchedRemotes?: string[];
  /** Actual text content of each file (for editable / merge-conflict challenges). */
  fileContents?: Record<string, string>;
  /** Files that started with conflict markers (for merge challenges). */
  conflictFiles?: string[];
}

const DEFAULT_TRACKED = ["style.css", "index.html", "package.json", "README.md"] as const;

export function createInitialGitState(overrides?: {
  modifiedPaths?: string[];
  remotes?: Record<string, { fetch: string; push: string }>;
  fileContents?: Record<string, string>;
  conflictFiles?: string[];
}): GitSimState {
  const modified = new Set(overrides?.modifiedPaths ?? ["style.css", "index.html", "package.json"]);
  const files: Record<string, TrackedFileState> = {};
  for (const p of DEFAULT_TRACKED) {
    files[p] = modified.has(p) ? "modified" : "clean";
  }
  if (overrides?.fileContents) {
    for (const p of Object.keys(overrides.fileContents)) {
      if (!(p in files)) {
        files[p] = modified.has(p) ? "modified" : "clean";
      }
    }
  }
  return {
    branch: "main",
    files,
    lastCommitMessage: null,
    remotes: overrides?.remotes ? { ...overrides.remotes } : undefined,
    fetchedRemotes: [],
    fileContents: overrides?.fileContents ? { ...overrides.fileContents } : undefined,
    conflictFiles: overrides?.conflictFiles ? [...overrides.conflictFiles] : undefined,
  };
}

function cloneState(s: GitSimState): GitSimState {
  return {
    branch: s.branch,
    files: { ...s.files },
    lastCommitMessage: s.lastCommitMessage,
    remotes: s.remotes ? { ...s.remotes } : undefined,
    fetchedRemotes: s.fetchedRemotes ? [...s.fetchedRemotes] : [],
    fileContents: s.fileContents ? { ...s.fileContents } : undefined,
    conflictFiles: s.conflictFiles ? [...s.conflictFiles] : undefined,
  };
}

function countUnstagedModified(s: GitSimState): number {
  return Object.values(s.files).filter((x) => x === "modified").length;
}

function countStaged(s: GitSimState): number {
  return Object.values(s.files).filter((x) => x === "staged").length;
}

/** Lines for `git status` (simplified porcelain-like). */
export function formatGitStatus(state: GitSimState): string[] {
  const lines: string[] = [];
  lines.push(`On branch ${state.branch}`);
  const staged = Object.entries(state.files).filter(([, st]) => st === "staged");
  const unstaged = Object.entries(state.files).filter(([, st]) => st === "modified");
  if (staged.length > 0) {
    lines.push("Changes to be committed:");
    lines.push('  (use "git restore --staged <file>..." to unstage)');
    for (const [path] of staged) {
      lines.push(`\tmodified:   ${path}`);
    }
    lines.push("");
  }
  if (unstaged.length > 0) {
    lines.push("Changes not staged for commit:");
    lines.push('  (use "git add <file>..." to update what will be committed)');
    lines.push('  (use "git restore <file>..." to discard changes in working directory)');
    for (const [path] of unstaged) {
      lines.push(`\tmodified:   ${path}`);
    }
    lines.push("");
    lines.push('no changes added to commit (use "git add" and/or "git commit -a")');
  } else if (staged.length === 0 && unstaged.length === 0) {
    lines.push("nothing to commit, working tree clean");
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

/**
 * Parse `git commit -m "msg"` from full input line (handles spaces inside quotes).
 */
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

/**
 * Run one shell line; only `git ...` is simulated, rest gets a short error.
 */
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
    state.branch = name;
    return {
      state,
      outputLines: [`Switched to a new branch '${name}'`],
    };
  }

  if ((sub === "switch" && parts[2] === "-c" && parts[3]) || (sub === "switch" && parts[2] === "-C" && parts[3])) {
    const name = parts[3];
    state.branch = name;
    return {
      state,
      outputLines: [`Switched to a new branch '${name}'`],
    };
  }

  if (sub === "add") {
    const target = parts[2];
    if (!target) {
      return { state: prev, outputLines: ["Nothing specified, nothing added."] };
    }
    const paths =
      target === "." || target === "-A" || target === "--all"
        ? Object.keys(state.files)
        : [target];

    for (const p of paths) {
      if (!(p in state.files)) {
        return { state: prev, outputLines: [`fatal: pathspec '${p}' did not match any files`] };
      }
      if (state.files[p] === "modified") {
        state.files[p] = "staged";
      }
    }
    return { state, outputLines: [] };
  }

  if (sub === "commit") {
    const parsed = parseCommitMessageFromLine(rawInput);
    if (!parsed.ok) {
      return { state: prev, outputLines: [parsed.err] };
    }
    const stagedPaths = Object.entries(state.files).filter(([, st]) => st === "staged");
    if (stagedPaths.length === 0) {
      return {
        state: prev,
        outputLines: [
          "On branch " + state.branch,
          "nothing to commit, working tree clean",
        ],
      };
    }
    for (const [path] of stagedPaths) {
      state.files[path] = "clean";
    }
    state.lastCommitMessage = parsed.message;
    return {
      state,
      outputLines: [
        `[${state.branch} ${(Math.random() * 1e12).toString(36).slice(0, 7)}] ${parsed.message}`,
        `${stagedPaths.length} file${stagedPaths.length === 1 ? "" : "s"} changed`,
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
    return {
      state,
      outputLines: [
        `From ${r.fetch}`,
        ` * [new branch]      main       -> ${remoteName}/main`,
      ],
    };
  }

  if (sub === "branch") {
    const lines = [`* ${state.branch}`];
    return { state, outputLines: lines };
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

/** Check if file content contains unresolved conflict markers. */
export function hasConflictMarkers(content: string): boolean {
  return /<<<<<<<|=======|>>>>>>>/.test(content);
}

/** Count files with unresolved conflicts in state.fileContents. */
export function countUnresolvedConflicts(state: GitSimState): number {
  if (!state.fileContents || !state.conflictFiles) return 0;
  return state.conflictFiles.filter((f) => {
    const content = state.fileContents?.[f];
    return content && hasConflictMarkers(content);
  }).length;
}
