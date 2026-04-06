/** git diff command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadCommit } from "../utils";

export function handleDiff(
  state: GitSimState,
  args: string[],
): RunGitCommandResult {
  const staged = args.includes("--staged") || args.includes("--cached");
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
