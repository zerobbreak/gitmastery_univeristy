/** git status command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";

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

export function handleStatus(state: GitSimState): RunGitCommandResult {
  return { state, outputLines: formatGitStatus(state) };
}
