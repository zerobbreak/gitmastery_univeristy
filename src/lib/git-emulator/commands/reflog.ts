/** git reflog command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";

export function handleReflog(state: GitSimState): RunGitCommandResult {
  const lines: string[] = [];
  const maxEntries = 10;

  for (let i = 0; i < Math.min(state.reflog.length, maxEntries); i++) {
    const entry = state.reflog[i];
    lines.push(`${entry.sha.slice(0, 7)} HEAD@{${i}}: ${entry.action}: ${entry.message}`);
  }

  return { state, outputLines: lines };
}
