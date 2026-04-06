import type { GitSimState } from "@/lib/git-emulator";
import {
  hasConflictMarkers,
  RECOVER_LOST_COMMIT_MESSAGE,
} from "@/lib/git-emulator";
import type { ChallengeDef } from "@/lib/module-routes";
import type { LessonContent } from "@/lib/module-lesson-content";

const DEFAULT_MODIFIED = ["style.css", "index.html", "package.json"] as const;

export function getInitialModifiedFromLesson(lessonContent: LessonContent): string[] {
  const fromLesson = lessonContent.files
    ?.filter((f) => f.name !== "README.md")
    .slice(0, 3)
    .map((f) => f.name);
  return fromLesson?.length ? fromLesson : [...DEFAULT_MODIFIED];
}

function parseExpectedBranchFromObjective(text: string): string | null {
  // "Create branch NAME" — e.g. Create branch feature-login
  let m = text.match(/create\s+branch\s+([\w./-]+)/i);
  if (m) return m[1];

  // "Create NAME branch ..." — e.g. Create feature branch from main (must not match before "Create branch NAME")
  m = text.match(/create\s+([\w./-]+)\s+branch\b/i);
  if (m) return m[1];

  // Fallback: word after "branch " (reject "from" from phrases like "branch from main")
  m = text.match(/branch\s+([\w./-]+)/i);
  if (m) {
    const name = m[1];
    if (name.toLowerCase() === "from") return null;
    return name;
  }
  return null;
}

function parseExpectedCommitMessageFromObjective(text: string): string | null {
  const m = text.match(/["']([^"']+)["']/);
  return m?.[1] ?? null;
}

function isStageAllObjective(text: string): boolean {
  return /stage\s+all/i.test(text);
}

function parseResolveConflictFile(text: string): string | null {
  const m = text.match(/resolve\s+conflicts?\s+in\s+(\S+)/i);
  return m?.[1] ?? null;
}

function isResolveAllConflictsObjective(text: string): boolean {
  return /resolve\s+all\s+conflict\s*markers?/i.test(text);
}

/** Same source as Git: working tree, with legacy `fileContents` fallback. */
function conflictFileContent(state: GitSimState, filename: string): string | undefined {
  return state.workingTree?.[filename] ?? state.fileContents?.[filename];
}

function headAtLostCommit(state: GitSimState): boolean {
  const headSha = state.detachedHead
    ? state.HEAD
    : state.refs[state.HEAD] ?? null;
  const c = headSha ? state.commits[headSha] : null;
  return c?.message === RECOVER_LOST_COMMIT_MESSAGE;
}

function recoveryBranchAtLostCommit(state: GitSimState): boolean {
  for (const [branchName, refSha] of Object.entries(state.refs ?? {})) {
    if (!/recovery|recover/i.test(branchName)) continue;
    const c = state.commits[refSha];
    if (c?.message === RECOVER_LOST_COMMIT_MESSAGE) return true;
  }
  return false;
}

export function objectiveDone(
  text: string,
  state: GitSimState,
  initialModified: string[],
): boolean {
  // Use HEAD for branch name (new state) with fallback to branch (legacy)
  const currentBranch = state.HEAD ?? state.branch;

  if (/recovery branch/i.test(text) || /create.*branch.*from.*commit/i.test(text)) {
    return recoveryBranchAtLostCommit(state);
  }

  if (/interactive rebase/i.test(text) || /squash last three commits/i.test(text)) {
    return Boolean(state.interactiveRebaseSquashed);
  }
  if (/rerere/i.test(text) && /enable/i.test(text)) {
    return state.gitConfig?.["rerere.enabled"] === "true";
  }
  if (/merge branch feature-x/i.test(text)) {
    return state.lastMergeSource === "feature-x";
  }
  if (/pre-commit/i.test(text) && (/install/i.test(text) || /git hook/i.test(text))) {
    return state.hooksInstalled?.includes("pre-commit") ?? false;
  }
  if (/submodule/i.test(text) && /vendor\/lib/i.test(text)) {
    return Boolean(state.submodules?.["vendor/lib"]);
  }
  if (/filter-repo/i.test(text)) {
    return Boolean(state.filterRepoRan);
  }
  if (/cat-file/i.test(text)) {
    return (state.catFileInspectCount ?? 0) >= 1;
  }
  if (/\bfsck\b/i.test(text)) {
    return Boolean(state.fsckCompleted);
  }
  if (/annotated tag/i.test(text) && /v1\.0\.0/i.test(text)) {
    return Boolean(state.annotatedTags?.["v1.0.0"]);
  }

  const branch = parseExpectedBranchFromObjective(text);
  // Require "create" so lines like "Push branch with upstream tracking" are not parsed as branch name "with"
  if (branch && /create/i.test(text)) {
    return currentBranch === branch;
  }
  if (isStageAllObjective(text)) {
    const relevantFiles = state.conflictFiles?.length ? state.conflictFiles : initialModified;
    const allStaged = relevantFiles.every((p) => state.files[p] === "staged" || state.files[p] === "clean");
    const committed = state.lastCommitMessage !== null;
    return allStaged || committed;
  }
  if (/commit/i.test(text)) {
    const expected = parseExpectedCommitMessageFromObjective(text);
    if (expected) return state.lastCommitMessage === expected;
    if (/make\s+and\s+commit/i.test(text)) {
      return state.lastCommitMessage !== null;
    }
  }
  if (/upstream remote/i.test(text) && /add/i.test(text)) {
    return Boolean(state.remotes?.upstream);
  }
  if (/verify both origin and upstream/i.test(text)) {
    return Boolean(state.remotes?.origin && state.remotes?.upstream);
  }
  if (/fetch from upstream/i.test(text)) {
    return Boolean(state.fetchedRemotes?.includes("upstream"));
  }
  
  // Push objectives
  if (/push/i.test(text) && /upstream tracking/i.test(text)) {
    return Boolean(state.pushedRefs && Object.keys(state.pushedRefs).length > 0);
  }
  
  // Reflog objectives
  if (/reflog/i.test(text) && /find/i.test(text)) {
    return state.reflog && state.reflog.length > 1;
  }

  if (/verify\s+recovered/i.test(text)) {
    return headAtLostCommit(state) || recoveryBranchAtLostCommit(state);
  }

  const resolveFile = parseResolveConflictFile(text);
  if (resolveFile) {
    const content = conflictFileContent(state, resolveFile);
    if (!content) return false;
    return !hasConflictMarkers(content);
  }
  if (isResolveAllConflictsObjective(text)) {
    if (!state.conflictFiles || state.conflictFiles.length === 0) return true;
    return state.conflictFiles.every((f) => {
      const content = conflictFileContent(state, f);
      return content && !hasConflictMarkers(content);
    });
  }
  return false;
}

export function allObjectivesMet(
  challenge: ChallengeDef,
  state: GitSimState,
  initialModified: string[],
): boolean {
  return challenge.objectives.every((obj) =>
    objectiveDone(obj.text, state, initialModified),
  );
}

/** Known objective copy from DB seeds - conceptual only (no commands / answers). */
const STATIC_OBJECTIVE_HINTS: Record<string, string> = {
  "Create branch feature-login":
    "This is about isolating your work on a separate line of development so it doesn't land directly on main.",
  "Stage all current changes":
    "The idea is the staging area: you're choosing what goes into the next commit from everything that's changed.",
  'Commit changes with message "init login"':
    "You're recording a snapshot; the objective cares that the commit message matches the scenario, not just that a commit exists.",
  "Add upstream remote pointing to original repo":
    "In a fork setup, you need Git to know where the original project lives - separate from your fork's URL.",
  "Verify both origin and upstream are configured":
    "Sanity-check that your repo knows about both \"where I push\" and \"where upstream lives\" before syncing.",
  "Fetch from upstream":
    "You're pulling down new information from the source project's side - without merging yet.",
  "Create feature branch from main":
    "You're starting feature work from the main line so changes stay on a dedicated branch.",
  "Make and commit changes":
    "Stage your modified files, then run git commit with -m and a message you choose. The simulator only checks that a commit exists, not the exact wording of the message.",
  "Push branch with upstream tracking":
    "Publishing your branch and linking it to a remote branch so the repo knows where future pushes go.",
  "Use reflog to find lost commit":
    "When HEAD moved, Git still remembers recent positions - this step is about finding the commit you care about in that history.",
  "Create recovery branch from lost commit":
    "Branch from the lost commit's hash (see git reflog), not from current HEAD — e.g. git checkout -b recovery <hash>. The commit message should read Important feature work.",
  "Verify recovered changes":
    "HEAD or your recovery branch should point at the rescued commit (Important feature work). Try git log -1 on that branch.",
  "Create branch workshop-github":
    "You're separating this lesson's work from main so pushes and reviews stay scoped.",
  "Create branch fix-ci-merge":
    "CI and conflict work should happen on a dedicated line, not directly on main.",
  "Create branch governance-release":
    "Policy changes get their own branch so reviews and audit trails stay clear.",
  'Commit changes with message "ready push"':
    "The snapshot message is part of the scenario - it signals your branch is ready for the next automation step.",
  'Commit changes with message "ci green"':
    "The message records that checks passed on this branch before you integrate.",
  'Commit changes with message "policy ok"':
    "Governance flows often require an explicit, reviewable message on the policy commit.",
  "Resolve conflicts in config.js":
    "The file has conflict markers from a merge. You need to edit the file to pick which version to keep and remove all marker lines.",
  "Resolve conflicts in utils.js":
    "The file has conflict markers from a merge. You need to edit the file to pick which version to keep and remove all marker lines.",
  "Resolve all conflict markers":
    "Every file that started with conflict markers needs to have those markers removed - keep the code you want, delete the rest.",
  "Stage all resolved files":
    "After editing, the files need to be staged (added to the index) so Git knows you've handled the conflicts.",
  'Commit changes with message "merge complete"':
    "Once conflicts are resolved and staged, record a commit that finalizes the merge.",
  "Squash last three commits with git rebase -i HEAD~3":
    "Use the simulator's interactive rebase: git rebase -i HEAD~3 squashes the last three commits on your current branch.",
  "Enable rerere with git config rerere.enabled true":
    "Run exactly: git config rerere.enabled true (or add --global) so the simulator records rerere as enabled.",
  "Merge branch feature-x":
    "Checkout main (or your base), then git merge feature-x so the merge source is recorded.",
  "Install pre-commit hook with git hook install pre-commit":
    "This repo exposes a helper: git hook install pre-commit (simulator shortcut for wiring a hook).",
  "Add submodule for vendor/lib at https://github.com/example/lib.git":
    "Run git submodule add with that URL and path vendor/lib.",
  "Run git filter-repo with --force":
    "History rewrite in the simulator: git filter-repo --force (install filter-repo in real life).",
  "Run git cat-file -p HEAD":
    "Plumbing: git cat-file -p HEAD prints the commit object.",
  "Run git fsck":
    "Repository health check: git fsck.",
  "Create annotated tag v1.0.0":
    "Example: git tag -a v1.0.0 -m \"Release\" while HEAD points at the commit to tag.",
  "Create branch feature/oss-contribution":
    "Create and switch to feature/oss-contribution before committing capstone work.",
  'Commit changes with message "Add contribution"':
    "Stage CONTRIBUTING.md (or all changes), then commit with that exact message.",
};

/**
 * Short, always-visible hint for an objective (does not depend on simulator state).
 * Shown on the challenge page next to each task.
 */
export function staticObjectiveHint(objectiveText: string): string {
  const exact = STATIC_OBJECTIVE_HINTS[objectiveText];
  if (exact) return exact;

  const branch = parseExpectedBranchFromObjective(objectiveText);
  if (branch && /create/i.test(objectiveText)) {
    return "You need a named branch for this work and your HEAD should be on it - not still on the default line.";
  }
  if (isStageAllObjective(objectiveText)) {
    return "Everything that should ship in the next commit needs to be in the staging area, not only in the working tree.";
  }
  if (/commit/i.test(objectiveText)) {
    const expected = parseExpectedCommitMessageFromObjective(objectiveText);
    if (expected) {
      return "After staging, the recorded message must match what the objective specifies - character-for-character.";
    }
  }
  if (/upstream remote/i.test(objectiveText) && /add/i.test(objectiveText)) {
    return "Register the original project as its own remote so your clone can talk to both your fork and upstream.";
  }
  if (/verify both origin and upstream/i.test(objectiveText)) {
    return "Both relationships should show up when you list what remotes Git knows about.";
  }
  if (/fetch from upstream/i.test(objectiveText)) {
    return "You still need to download refs from the upstream side in this session.";
  }
  const resolveFile = parseResolveConflictFile(objectiveText);
  if (resolveFile) {
    return "The file has conflict markers (<<<<<<, =======, >>>>>>) from a merge. Edit it to keep only the code you want.";
  }
  if (isResolveAllConflictsObjective(objectiveText)) {
    return "All files with conflict markers need to have those markers removed before you can commit.";
  }
  if (/interactive rebase|squash last three/i.test(objectiveText)) {
    return "Run git rebase -i HEAD~3 on a branch that has at least four commits (three to squash).";
  }
  if (/rerere/i.test(objectiveText) && /enable/i.test(objectiveText)) {
    return "Set rerere.enabled to true via git config (local or --global).";
  }
  if (/merge branch feature-x/i.test(objectiveText)) {
    return "From your base branch, run git merge feature-x after rerere is enabled.";
  }
  if (/git hook install/i.test(objectiveText)) {
    return "Use the simulator command git hook install pre-commit.";
  }
  if (/submodule/i.test(objectiveText) && /vendor\/lib/i.test(objectiveText)) {
    return "git submodule add <url> vendor/lib with the URL from the objective.";
  }
  if (/filter-repo/i.test(objectiveText)) {
    return "Run git filter-repo --force in this environment.";
  }
  if (/cat-file/i.test(objectiveText)) {
    return "Run git cat-file -p HEAD (or -t) to inspect objects.";
  }
  if (/\bfsck\b/i.test(objectiveText)) {
    return "Run git fsck once.";
  }
  if (/annotated tag/i.test(objectiveText) && /v1\.0\.0/i.test(objectiveText)) {
    return "git tag -a v1.0.0 -m \"...\" tags the current HEAD.";
  }
  return "Work in the terminal simulator; objectives map to Git concepts from your course material.";
}

/** Plain-language hint when an objective is not yet satisfied (for "Run checks" coaching). */
export function hintForObjectiveIncomplete(
  objectiveText: string,
  state: GitSimState,
  initialModified: string[],
): string {
  if (objectiveDone(objectiveText, state, initialModified)) {
    return "";
  }
  const branch = parseExpectedBranchFromObjective(objectiveText);
  if (branch && /create/i.test(objectiveText)) {
    const on = state.HEAD ?? state.branch;
    return `Right now you're on "${on}"; the task expects you to be on the branch named in the objective.`;
  }
  if (isStageAllObjective(objectiveText)) {
    return "Some modified files still aren't staged - the next commit should include all of them.";
  }
  if (/commit/i.test(objectiveText)) {
    const expected = parseExpectedCommitMessageFromObjective(objectiveText);
    if (expected) {
      return "Either nothing is committed yet, or the last commit message doesn't match what the objective asked for.";
    }
    if (/make\s+and\s+commit/i.test(objectiveText)) {
      return "Stage your changes (git add), then git commit -m with any message you like. The simulator only checks that a commit was recorded, not the exact message text.";
    }
  }
  if (/upstream remote/i.test(objectiveText) && /add/i.test(objectiveText)) {
    return "The simulator doesn't see an upstream remote yet - you still need to register the original repo.";
  }
  if (/verify both origin and upstream/i.test(objectiveText)) {
    return "Git should know about both your fork and the source repo; one of those links is still missing or incomplete.";
  }
  if (/fetch from upstream/i.test(objectiveText)) {
    return "You haven't completed a fetch from upstream in this run yet.";
  }
  if (/recovery branch/i.test(objectiveText) || /create.*branch.*from.*commit/i.test(objectiveText)) {
    return `The recovery branch must tip at the lost commit (message: "${RECOVER_LOST_COMMIT_MESSAGE}"). Use the 7-character hash from git reflog on that commit line: git checkout -b recovery <hash>. With no hash, the new branch only copies your current HEAD.`;
  }
  if (/verify\s+recovered/i.test(objectiveText)) {
    return `Either checkout the lost commit (HEAD shows "${RECOVER_LOST_COMMIT_MESSAGE}" in git log -1) or point recovery/recover at that commit.`;
  }
  const resolveFile = parseResolveConflictFile(objectiveText);
  if (resolveFile) {
    const content = conflictFileContent(state, resolveFile);
    if (!content) return `The file "${resolveFile}" doesn't exist in this challenge.`;
    if (hasConflictMarkers(content)) {
      return `The file still contains conflict markers. Open the Files tab, edit "${resolveFile}", and remove all <<<<<<, ======, >>>>>> lines.`;
    }
    return "Conflict markers removed - this objective should now pass.";
  }
  if (isResolveAllConflictsObjective(objectiveText)) {
    const unresolved = state.conflictFiles?.filter((f) => {
      const c = conflictFileContent(state, f);
      return c && hasConflictMarkers(c);
    }) ?? [];
    if (unresolved.length > 0) {
      return `Still have conflict markers in: ${unresolved.join(", ")}. Edit those files in the Files tab.`;
    }
    return "All conflict markers removed.";
  }
  if (/interactive rebase|squash last three/i.test(objectiveText)) {
    return "Run git rebase -i HEAD~3; the simulator will squash the last three commits.";
  }
  if (/rerere/i.test(objectiveText) && /enable/i.test(objectiveText)) {
    return "git config rerere.enabled true has not been recorded yet.";
  }
  if (/merge branch feature-x/i.test(objectiveText)) {
    return "Run git merge feature-x from your base branch after rerere is enabled.";
  }
  if (/git hook install/i.test(objectiveText)) {
    return "Run git hook install pre-commit.";
  }
  if (/submodule/i.test(objectiveText) && /vendor\/lib/i.test(objectiveText)) {
    return state.submodules?.["vendor/lib"]
      ? "Submodule registered."
      : "Run git submodule add with the given URL and path vendor/lib.";
  }
  if (/filter-repo/i.test(objectiveText)) {
    return "Run git filter-repo --force.";
  }
  if (/cat-file/i.test(objectiveText)) {
    return "Run git cat-file -p HEAD at least once.";
  }
  if (/\bfsck\b/i.test(objectiveText)) {
    return "Run git fsck.";
  }
  if (/annotated tag/i.test(objectiveText) && /v1\.0\.0/i.test(objectiveText)) {
    return "Create the tag with git tag -a v1.0.0 -m \"...\".";
  }
  return "Compare what you've done in the terminal to the wording of the objective.";
}

export function isGitSimState(value: unknown): value is GitSimState {
  if (value === null || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  
  // Support both new (HEAD) and legacy (branch) state
  const hasBranch = typeof o.branch === "string";
  const hasHead = typeof o.HEAD === "string";
  if (!hasBranch && !hasHead) return false;
  
  if (o.lastCommitMessage !== null && typeof o.lastCommitMessage !== "string") return false;
  if (typeof o.files !== "object" || o.files === null) return false;
  for (const v of Object.values(o.files)) {
    if (v !== "clean" && v !== "modified" && v !== "staged" && v !== "untracked" && v !== "deleted") return false;
  }
  if (o.remotes !== undefined) {
    if (typeof o.remotes !== "object" || o.remotes === null) return false;
    for (const v of Object.values(o.remotes)) {
      if (v === null || typeof v !== "object") return false;
      const r = v as Record<string, unknown>;
      if (typeof r.fetch !== "string" || typeof r.push !== "string") return false;
    }
  }
  if (o.fetchedRemotes !== undefined) {
    if (!Array.isArray(o.fetchedRemotes)) return false;
    if (!o.fetchedRemotes.every((x) => typeof x === "string")) return false;
  }
  return true;
}
