/** git submodule — minimal add for challenges. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { stripQuotes } from "../utils";

export function handleSubmodule(
  state: GitSimState,
  args: string[],
  prev: GitSimState,
): RunGitCommandResult {
  const sub = args[0]?.toLowerCase();
  if (sub === "add") {
    const url = stripQuotes(args[1] ?? "");
    const path = args[2]?.replace(/\/$/, "") ?? "";
    if (!url || !path) {
      return { state: prev, outputLines: ["usage: git submodule add <url> <path>"] };
    }
    if (!state.submodules) state.submodules = {};
    if (state.submodules[path]) {
      return { state: prev, outputLines: [`fatal: '${path}' already exists in the index`] };
    }
    state.submodules[path] = { url, path };
    return {
      state,
      outputLines: [
        `Cloning into '${path}'...`,
        "Submodule path '" + path + "' registered",
      ],
    };
  }
  if (sub === "update" || sub === "init") {
    return {
      state,
      outputLines: ["Submodule paths registered (simulator)."],
    };
  }
  if (sub === "status") {
    const sm = state.submodules ?? {};
    const keys = Object.keys(sm);
    if (keys.length === 0) {
      return { state, outputLines: ["No submodule"] };
    }
    return {
      state,
      outputLines: keys.map((p) => ` ${p} (${sm[p]!.url})`),
    };
  }
  return {
    state: prev,
    outputLines: ["usage: git submodule [add <url> <path> | update | status]"],
  };
}
