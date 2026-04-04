/** Lightweight Git simulator for challenge terminals (no real repo). */

export type TrackedFileState = "clean" | "modified" | "staged";

export interface GitSimState {
  branch: string;
  /** Tracked paths -> working tree / index state */
  files: Record<string, TrackedFileState>;
  lastCommitMessage: string | null;
}

const DEFAULT_TRACKED = ["style.css", "index.html", "package.json", "README.md"] as const;

export function createInitialGitState(overrides?: {
  modifiedPaths?: string[];
}): GitSimState {
  const modified = new Set(overrides?.modifiedPaths ?? ["style.css", "index.html", "package.json"]);
  const files: Record<string, TrackedFileState> = {};
  for (const p of DEFAULT_TRACKED) {
    files[p] = modified.has(p) ? "modified" : "clean";
  }
  return {
    branch: "main",
    files,
    lastCommitMessage: null,
  };
}

function cloneState(s: GitSimState): GitSimState {
  return {
    branch: s.branch,
    files: { ...s.files },
    lastCommitMessage: s.lastCommitMessage,
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
