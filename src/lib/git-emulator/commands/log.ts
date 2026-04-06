/** git log command handler. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha } from "../utils";

export function handleLog(
  state: GitSimState,
  args: string[],
): RunGitCommandResult {
  const lines: string[] = [];
  let sha = getHeadSha(state);
  let count = 0;
  let maxCount = 10;
  const oneline = args.includes("--oneline");

  for (const p of args) {
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
