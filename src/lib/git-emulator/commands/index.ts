/** Command dispatcher for the Git simulator. */

import type { GitSimState, RunGitCommandResult } from "../types";
import { cloneState } from "../utils";

import { handleStatus, formatGitStatus } from "./status";
import { handleAdd } from "./add";
import { handleCommit } from "./commit";
import { handleBranch } from "./branch";
import { handleCheckout, handleCheckoutNewBranch, handleSwitch, handleSwitchNewBranch } from "./checkout";
import { handleLog } from "./log";
import { handleDiff } from "./diff";
import { handleMerge } from "./merge";
import { handleReset } from "./reset";
import { handleRestore } from "./restore";
import { handleStash } from "./stash";
import { handleRemote, handleFetch, handlePush } from "./remote";
import { handleReflog } from "./reflog";
import { handleShow } from "./show";
import { handleRevert } from "./revert";
import { handleCherryPick } from "./cherry-pick";
import { handleConfig } from "./config";
import { handleRebase } from "./rebase";
import { handleSubmodule } from "./submodule";
import { handleTag } from "./tag";
import { handleCatFile } from "./cat-file";
import { handleFsck } from "./fsck";
import { handleFilterRepo } from "./filter-repo";
import { handleHook } from "./hook";

export { formatGitStatus };

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

  const args = parts.slice(2);

  switch (sub) {
    case "status":
      return handleStatus(state);

    case "add":
      return handleAdd(state, args, prev);

    case "commit":
      return handleCommit(state, args, prev, rawInput);

    case "branch":
      return handleBranch(state, args, prev);

    case "checkout":
      if (args[0] === "-b" && args[1]) {
        return handleCheckoutNewBranch(state, args, prev);
      }
      if (args[0] && args[0] !== "-b") {
        return handleCheckout(state, args, prev);
      }
      return { state: prev, outputLines: ["error: no branch or commit specified"] };

    case "switch":
      if ((args[0] === "-c" || args[0] === "-C") && args[1]) {
        return handleSwitchNewBranch(state, args, prev);
      }
      if (args[0] && args[0] !== "-c" && args[0] !== "-C") {
        return handleSwitch(state, args, prev);
      }
      return { state: prev, outputLines: ["fatal: missing branch name"] };

    case "log":
      return handleLog(state, args);

    case "diff":
      return handleDiff(state, args);

    case "merge":
      return handleMerge(state, args, prev);

    case "reset":
      return handleReset(state, args, prev);

    case "restore":
      return handleRestore(state, args, prev);

    case "stash":
      return handleStash(state, args, prev);

    case "remote":
      return handleRemote(state, args, prev, rawInput);

    case "fetch":
      return handleFetch(state, args, prev);

    case "push":
      return handlePush(state, args, prev);

    case "reflog":
      return handleReflog(state);

    case "show":
      return handleShow(state, args, prev);

    case "revert":
      return handleRevert(state, args, prev);

    case "cherry-pick":
      return handleCherryPick(state, args, prev);

    case "config":
      return handleConfig(state, args, prev);

    case "rebase":
      return handleRebase(state, args, prev, rawInput);

    case "submodule":
      return handleSubmodule(state, args, prev);

    case "tag":
      return handleTag(state, args, prev, rawInput);

    case "cat-file":
      return handleCatFile(state, args, prev);

    case "fsck":
      return handleFsck(state);

    case "filter-repo":
      return handleFilterRepo(state, args, prev);

    case "hook":
      return handleHook(state, args, prev);

    default:
      return {
        state: prev,
        outputLines: [`git: '${sub}' is not a git command. See 'git --help'.`],
      };
  }
}
