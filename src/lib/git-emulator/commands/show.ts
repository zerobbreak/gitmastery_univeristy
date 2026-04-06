/** git show command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { resolveRef } from "../utils";

export function handleShow(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const ref = args[0] ?? "HEAD";
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
