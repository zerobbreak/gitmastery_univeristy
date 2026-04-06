/** Lightweight Git simulator for challenge terminals (no real repo). */

// Re-export types
export type {
  TrackedFileState,
  Commit,
  ReflogEntry,
  StashEntry,
  GitSimState,
  RunGitCommandResult,
  CommandHandler,
} from "./types";

// Re-export constants
export { RECOVER_LOST_COMMIT_MESSAGE } from "./constants";

// Re-export state factories
export {
  createInitialGitState,
  createInteractiveRebaseDrillState,
  createRerereMergeLabState,
} from "./state";

// Re-export utilities
export {
  generateSha,
  createCommit,
  getHeadSha,
  getHeadCommit,
  resolveRef,
  addReflogEntry,
  computeFileState,
  syncLegacyFiles,
  syncFileStatesFromWorkingTree,
  cloneState,
  countUnstagedModified,
  countStaged,
  stripQuotes,
  parseCommitMessageFromLine,
  hasConflictMarkers,
  countUnresolvedConflicts,
  getBranches,
  getCommitHistory,
  getWorkingTreeFiles,
} from "./utils";

// Re-export command dispatcher and formatters
export { runGitCommand, formatGitStatus } from "./commands";

// Legacy aliases for backward compatibility
export { countUnstagedModified as statusBarModifiedCount } from "./utils";
export { countStaged as statusBarStagedCount } from "./utils";
