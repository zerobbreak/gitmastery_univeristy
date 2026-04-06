/** git tag — annotated tags for releases. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { getHeadSha, stripQuotes } from "../utils";

export function handleTag(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
  rawInput: string,
): RunGitCommandResult {
  const list = args.length === 0 || (args[0] === "-l" && args.length <= 2);
  if (list) {
    const tags = Object.keys(state.annotatedTags ?? {}).sort();
    return { state, outputLines: tags.length ? tags : [""] };
  }

  if (args[0] === "-a" && args[1]) {
    const name = args[1];
    let msg = "tag";
    const mi = args.indexOf("-m");
    if (mi !== -1 && args[mi + 1]) {
      msg = stripQuotes(args[mi + 1]!);
    } else {
      const mm = rawInput.match(/-m\s+['"]([^'"]+)['"]/i) ?? rawInput.match(/-m\s+(\S+)/i);
      if (mm?.[1]) msg = stripQuotes(mm[1]);
    }
    const sha = getHeadSha(state);
    if (!sha) {
      return { state: prev, outputLines: ["fatal: HEAD not valid"] };
    }
    if (!state.annotatedTags) state.annotatedTags = {};
    state.annotatedTags[name] = sha;
    return { state, outputLines: [] };
  }

  return {
    state: prev,
    outputLines: ["usage: git tag [-a <name> -m <msg>] | git tag -l"],
  };
}
