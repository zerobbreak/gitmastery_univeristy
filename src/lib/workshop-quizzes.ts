/**
 * One quiz bank per module: 5 MCQ items, each tied to a concept id.
 * Used for learning checks, spaced review, and improve retries.
 */

export type WorkshopQuizQuestion = {
  id: string;
  moduleId: string;
  conceptId: string;
  prompt: string;
  choices: readonly [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

function q(
  moduleId: string,
  localId: string,
  conceptId: string,
  prompt: string,
  choices: [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
): WorkshopQuizQuestion {
  return {
    id: `${moduleId}__${localId}`,
    moduleId,
    conceptId,
    prompt,
    choices,
    correctIndex,
  };
}

export const QUIZZES_BY_MODULE: Record<string, WorkshopQuizQuestion[]> = {
  PROG5112: [
    q("PROG5112", "q1", "PROG5112__repo_basics", "What does `git init` do?", ["Create a new remote", "Create a new local repository", "Delete history", "Merge two branches"], 1),
    q("PROG5112", "q2", "PROG5112__staging_commit", "Which command stages all tracked changes?", ["git add -A", "git commit -a", "git stash", "git clean -fd"], 0),
    q("PROG5112", "q3", "PROG5112__history", "What does `git log` show?", ["Stash entries", "Commit history", "Remote URLs", "Ignored files"], 1),
    q("PROG5112", "q4", "PROG5112__branching", "Creating a branch without switching uses:", ["git switch -c", "git branch <name>", "git checkout --", "git merge --abort"], 1),
    q("PROG5112", "q5", "PROG5112__working_tree", "The staging area is also called:", ["The cloud", "The index", "HEAD~2", "The reflog"], 1),
  ],
  IMAD5112: [
    q("IMAD5112", "q1", "IMAD5112__remote_origin", "The default name for your GitHub clone remote is often:", ["upstream", "origin", "main", "fork"], 1),
    q("IMAD5112", "q2", "IMAD5112__push_pull", "`git pull` is equivalent to fetch plus:", ["rebase", "merge/rebase into current branch", "tag", "clean"], 1),
    q("IMAD5112", "q3", "IMAD5112__auth", "HTTPS pushes typically authenticate via:", ["Only SSH keys", "Credentials or tokens", "git config email", "Branch protection"], 1),
    q("IMAD5112", "q4", "IMAD5112__branching_remote", "Pushing a new branch the first time usually needs:", ["--set-upstream / -u", "--force only", "git init", "git submodule"], 0),
    q("IMAD5112", "q5", "IMAD5112__actions_intro", "CI workflows often run on:", ["Only local laptops", "Push and pull request events", "git stash", "git fsck"], 1),
  ],
  PROG6212: [
    q("PROG6212", "q1", "PROG6212__fork_upstream", "The remote pointing to the original repo you forked from is commonly named:", ["origin", "fork", "upstream", "deploy"], 2),
    q("PROG6212", "q2", "PROG6212__remotes", "Why use multiple remotes?", ["To delete branches", "To collaborate across forks and canonical repos", "To disable CI", "To skip merges"], 1),
    q("PROG6212", "q3", "PROG6212__fetch_merge", "`git fetch upstream` updates:", ["Your working tree only", "Remote-tracking branches", "package.json", "Nothing"], 1),
    q("PROG6212", "q4", "PROG6212__sync", "Syncing a fork often means merging or rebasing from:", ["upstream into your branch", "only tags", "stash", "clean"], 0),
    q("PROG6212", "q5", "PROG6212__tracking", "Upstream tracking links a local branch to:", ["A stash entry", "A remote branch for push/pull defaults", "A submodule path", "A tag only"], 1),
  ],
  PROG6112: [
    q("PROG6112", "q1", "PROG6112__ci_gates", "CI often blocks merges when:", ["Tests fail or checks don’t pass", "You use SSH", "You have two remotes", "You use tags"], 0),
    q("PROG6112", "q2", "PROG6112__merge_conflicts", "Conflict markers in a file typically look like:", ["<<< === >>>", "HEAD~1", "[remote \"origin\"]", "feature/"], 0),
    q("PROG6112", "q3", "PROG6112__resolution", "After fixing conflicts you should:", ["Only git pull again", "Stage resolved files then commit", "git clean -fd", "Delete .git"], 1),
    q("PROG6112", "q4", "PROG6112__merge_commit", "A merge commit usually has:", ["No parents", "Two parents", "Only tags", "No message"], 1),
    q("PROG6112", "q5", "PROG6112__branch_before_merge", "Why branch before merging to main?", ["To run checks on isolated work", "To delete history", "To avoid remotes", "To skip CI"], 0),
  ],
  PROG6213: [
    q("PROG6213", "q1", "PROG6213__pr_basics", "A pull request proposes:", ["Deleting the remote", "Merging a branch into a target branch", "Only tags", "git init"], 1),
    q("PROG6213", "q2", "PROG6213__review", "Code review primarily improves:", ["Only local speed", "Quality and shared understanding", "Packfile size", "Credential storage"], 1),
    q("PROG6213", "q3", "PROG6213__merge_strategies", "Squash merge produces:", ["A merge commit with two parents always", "A single commit on the target branch", "Only tags", "A submodule"], 1),
    q("PROG6213", "q4", "PROG6213__push_upstream", "`-u` on first push sets:", ["stash", "upstream tracking for the branch", "clean", "bisect"], 1),
    q("PROG6213", "q5", "PROG6213__collaboration", "Effective PRs usually include:", ["No description", "Clear intent and test notes", "Only binary files", "Conflict markers"], 1),
  ],
  PROG6214: [
    q("PROG6214", "q1", "PROG6214__log_history", "`git log --oneline` is useful for:", ["Deleting remotes", "Scanning recent commits briefly", "Installing hooks", "Submodules"], 1),
    q("PROG6214", "q2", "PROG6214__reflog", "Reflog helps recover:", ["Only stashes", "Moved HEAD and lost commits", "Only tags", "Packfiles"], 1),
    q("PROG6214", "q3", "PROG6214__reset_revert", "`git revert` creates:", ["A hard reset", "A new commit that undoes a change", "A submodule", "A clean wipe"], 1),
    q("PROG6214", "q4", "PROG6214__cherry_pick", "Cherry-pick applies:", ["A whole remote", "Specific commits by hash", "Only tags", "All stashes"], 1),
    q("PROG6214", "q5", "PROG6214__bisect", "git bisect helps:", ["Find which commit introduced a bug", "Delete branches", "Add submodules", "Sign commits"], 0),
  ],
  PROG7313: [
    q("PROG7313", "q1", "PROG7313__branch_protection", "Branch protection can require:", ["No remotes", "Reviews and status checks before merge", "Only SSH", "Deleting main"], 1),
    q("PROG7313", "q2", "PROG7313__codeowners", "CODEOWNERS is used to:", ["Encrypt the repo", "Auto-request reviewers for paths", "Remove history", "Disable CI"], 1),
    q("PROG7313", "q3", "PROG7313__releases", "Release tags typically mark:", ["Stash entries", "Named snapshots for users", "Only local branches", "Conflicts"], 1),
    q("PROG7313", "q4", "PROG7313__governance", "Governance rules aim to:", ["Remove all branches", "Reduce risk and clarify ownership", "Disable forks", "Skip reviews"], 1),
    q("PROG7313", "q5", "PROG7313__signoff", "Auditable sign-off means commits should be:", ["Untraceable", "Traceable with clear authorship and policy", "Only on tags", "Binary-only"], 1),
  ],
  PROG7314: [
    q("PROG7314", "q1", "PROG7314__interactive_rebase", "Interactive rebase lets you:", ["Only delete the repo", "Edit, squash, or reorder commits", "Skip fetch", "Add submodules only"], 1),
    q("PROG7314", "q2", "PROG7314__squash", "Squash combines:", ["Two remotes", "Multiple commits into fewer", "Only tags", "Conflict markers"], 1),
    q("PROG7314", "q3", "PROG7314__reword", "During rebase -i, reword changes:", ["Remote URLs", "Commit messages", "Only branch names", "Packfiles"], 1),
    q("PROG7314", "q4", "PROG7314__rebase_vs_merge", "Rebase often:", ["Adds merge commits always", "Replays commits on top of another base", "Deletes upstream", "Disables hooks"], 1),
    q("PROG7314", "q5", "PROG7314__history_rewrite", "Safe rewrite avoids:", ["Pushing cleaned public history others rely on without coordination", "Using branches", "Fetch", "Tags"], 0),
  ],
  PROG7315: [
    q("PROG7315", "q1", "PROG7315__merge_strategies_adv", "Merge strategies differ in how:", ["Remotes are named", "Git combines branch histories", "Stash works", "Tags are deleted"], 1),
    q("PROG7315", "q2", "PROG7315__rerere", "Rerere helps by:", ["Caching conflict resolutions for reuse", "Removing remotes", "Signing tags only", "Cleaning ignored files"], 0),
    q("PROG7315", "q3", "PROG7315__complex_merges", "Messy integrations may need:", ["Ignoring conflicts", "Careful merges and sometimes rerere", "Deleting .git", "Only fast-forward"], 1),
    q("PROG7315", "q4", "PROG7315__policy", "Team merge policy should clarify:", ["Only colors", "When to merge vs rebase vs squash", "SSH port", "Editor font"], 1),
    q("PROG7315", "q5", "PROG7315__integration", "Long-running branches risk:", ["Nothing", "More drift and harder merges", "Only tag issues", "Submodule removal"], 1),
  ],
  PROG7316: [
    q("PROG7316", "q1", "PROG7316__hooks_lifecycle", "Git hooks run at:", ["Random times", "Specific Git lifecycle points", "Only on GitHub", "Never locally"], 1),
    q("PROG7316", "q2", "PROG7316__pre_commit", "pre-commit often runs:", ["Remote fetch", "Fast local checks before the commit is created", "git bisect", "filter-repo"], 1),
    q("PROG7316", "q3", "PROG7316__pre_push", "pre-push can block:", ["Local stash", "Pushes that fail checks", "git log", "Tags only"], 1),
    q("PROG7316", "q4", "PROG7316__commit_msg", "commit-msg hooks can enforce:", ["Remote deletion", "Message format conventions", "Submodule URLs", "Packfiles"], 1),
    q("PROG7316", "q5", "PROG7316__hooks_vs_ci", "Hooks are local; CI is:", ["Identical to hooks always", "Centralized verification on the server", "Only for tags", "Disabled"], 1),
  ],
  PROG7317: [
    q("PROG7317", "q1", "PROG7317__submodules", "A submodule pins:", ["A remote name only", "Another repo at a specific commit", "Stash entries", "Conflict markers"], 1),
    q("PROG7317", "q2", "PROG7317__subtree", "Subtree merges content:", ["Without a nested .git in the main tree", "Only via SSH keys", "Using only tags", "By deleting history"], 0),
    q("PROG7317", "q3", "PROG7317__monorepo", "Large monorepos often need:", ["No tooling", "Scaling strategies like sparse checkout", "Only one branch", "No CI"], 1),
    q("PROG7317", "q4", "PROG7317__sparse", "Sparse checkout limits:", ["Which paths exist in your working tree", "Remote count", "Tag names", "SSH"], 0),
    q("PROG7317", "q5", "PROG7317__vendor", "Vendoring records dependencies:", ["Only in README", "In-repo (submodule/subtree) for reproducibility", "Via stash", "By deleting remotes"], 1),
  ],
  PROG7318: [
    q("PROG7318", "q1", "PROG7318__secrets_leaks", "Secrets in git history should be:", ["Ignored without action", "Rotated and removed from history if needed", "Only in tags", "Left as-is always"], 1),
    q("PROG7318", "q2", "PROG7318__filter_repo", "filter-repo style tools rewrite:", ["Only remotes", "History to remove sensitive blobs", "Stash only", "Branch names only"], 1),
    q("PROG7318", "q3", "PROG7318__signed_commits", "Signed commits help prove:", ["Packfile size", "Integrity and authorship with keys", "Submodule paths only", "Clean ignores"], 1),
    q("PROG7318", "q4", "PROG7318__rotation", "After a leak, rotate:", ["Only branch names", "Credentials and invalidate old secrets", "Only tags", "Remotes only"], 1),
    q("PROG7318", "q5", "PROG7318__prevention", "Prevention includes:", ["Committing secrets faster", "Pre-commit secret scanning and hygiene", "Disabling CI", "Removing hooks"], 1),
  ],
  PROG7319: [
    q("PROG7319", "q1", "PROG7319__objects", "Git stores content as:", ["Only filenames", "Objects addressed by hash", "Stash ids only", "Random UUIDs"], 1),
    q("PROG7319", "q2", "PROG7319__cat_file", "`git cat-file -p` prints:", ["Only remotes", "Object contents", "Stash list", "Hooks"], 1),
    q("PROG7319", "q3", "PROG7319__fsck", "`git fsck` helps find:", ["Only branches", "Corruption and dangling objects", "Submodule stars", "PR titles"], 1),
    q("PROG7319", "q4", "PROG7319__packs", "Packfiles:", ["Store objects compressed for efficiency", "Remove all history", "Replace remotes", "Disable bisect"], 0),
    q("PROG7319", "q5", "PROG7319__tags", "Annotated tags store:", ["Only a name", "A tag object with message and metadata", "Only branches", "Conflict markers"], 1),
  ],
  PROG7320: [
    q("PROG7320", "q1", "PROG7320__fork_flow", "Contributing via fork usually means:", ["Push to upstream directly always", "Push to your fork and open a PR", "Only tags", "git init each time"], 1),
    q("PROG7320", "q2", "PROG7320__remotes_cap", "You typically push to:", ["upstream always", "origin (your fork)", "Only git config", "stash"], 1),
    q("PROG7320", "q3", "PROG7320__branch_pr", "Feature branches isolate:", ["Packfiles", "Your work from main until review", "Only tags", "Hooks"], 1),
    q("PROG7320", "q4", "PROG7320__integrate", "Before the PR merges you often:", ["Ignore conflicts", "Rebase or merge latest main as needed", "Delete .git", "Only use tags"], 1),
    q("PROG7320", "q5", "PROG7320__push_pr", "Pushing updates the:", ["Local stash only", "Remote branch backing the PR", "Only CODEOWNERS file", "Packfile count"], 1),
  ],
};

export function getQuizForModule(moduleId: string): WorkshopQuizQuestion[] {
  return QUIZZES_BY_MODULE[moduleId] ?? [];
}

export function getQuestionById(
  questionId: string,
): WorkshopQuizQuestion | undefined {
  const [mod] = questionId.split("__");
  if (!mod) return undefined;
  const list = QUIZZES_BY_MODULE[mod];
  return list?.find((q) => q.id === questionId);
}

export type PublicWorkshopQuizQuestion = Omit<
  WorkshopQuizQuestion,
  "correctIndex"
>;

export function stripQuizAnswers(
  questions: WorkshopQuizQuestion[],
): PublicWorkshopQuizQuestion[] {
  return questions.map(({ correctIndex: _c, ...rest }) => rest);
}

/** Score 0–100 from map of questionId -> selected index. */
export function scoreQuiz(
  moduleId: string,
  answers: Record<string, number>,
  questionFilter?: (q: WorkshopQuizQuestion) => boolean,
): {
  totalPercent: number;
  byConcept: Record<string, { correct: number; total: number; percent: number }>;
} {
  const all = getQuizForModule(moduleId);
  const questions = questionFilter ? all.filter(questionFilter) : all;
  if (questions.length === 0) {
    return { totalPercent: 0, byConcept: {} };
  }
  let correct = 0;
  const byConcept: Record<string, { correct: number; total: number; percent: number }> = {};
  for (const qu of questions) {
    const sel = answers[qu.id];
    const ok = sel === qu.correctIndex;
    if (ok) correct++;
    const agg = byConcept[qu.conceptId] ?? { correct: 0, total: 0, percent: 0 };
    agg.total++;
    if (ok) agg.correct++;
    agg.percent = Math.round((100 * agg.correct) / agg.total);
    byConcept[qu.conceptId] = agg;
  }
  return {
    totalPercent: Math.round((100 * correct) / questions.length),
    byConcept,
  };
}
