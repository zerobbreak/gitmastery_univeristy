/**
 * Concept taxonomy: 5 assessable concepts per curriculum module (stable IDs).
 * IDs are globally unique: `${moduleId}__${slug}`.
 */

export type WorkshopConcept = {
  id: string;
  moduleId: string;
  title: string;
  order: number;
};

/** Challenge IDs that count as “practice labs” for each module (from DB seeds). */
export const LAB_CHALLENGE_IDS_BY_MODULE: Record<string, readonly string[]> = {
  PROG5112: ["CHAL101"],
  IMAD5112: ["CHAL301"],
  PROG6212: ["CHAL102"],
  PROG6112: ["CHAL302", "CHAL304"],
  PROG6213: ["CHAL201"],
  PROG6214: ["CHAL202"],
  PROG7313: ["CHAL303"],
  PROG7314: ["CHAL401"],
  PROG7315: ["CHAL402"],
  PROG7316: ["CHAL403"],
  PROG7317: ["CHAL404"],
  PROG7318: ["CHAL405"],
  PROG7319: ["CHAL406"],
  PROG7320: ["CHAL407"],
};

export const CONCEPTS_BY_MODULE: Record<string, WorkshopConcept[]> = {
  PROG5112: [
    { id: "PROG5112__repo_basics", moduleId: "PROG5112", title: "Repository basics", order: 0 },
    { id: "PROG5112__staging_commit", moduleId: "PROG5112", title: "Staging and commits", order: 1 },
    { id: "PROG5112__history", moduleId: "PROG5112", title: "History and commits", order: 2 },
    { id: "PROG5112__branching", moduleId: "PROG5112", title: "Branches", order: 3 },
    { id: "PROG5112__working_tree", moduleId: "PROG5112", title: "Working tree vs index", order: 4 },
  ],
  IMAD5112: [
    { id: "IMAD5112__remote_origin", moduleId: "IMAD5112", title: "Remotes and origin", order: 0 },
    { id: "IMAD5112__push_pull", moduleId: "IMAD5112", title: "Push and pull", order: 1 },
    { id: "IMAD5112__auth", moduleId: "IMAD5112", title: "Authentication", order: 2 },
    { id: "IMAD5112__branching_remote", moduleId: "IMAD5112", title: "Branches on GitHub", order: 3 },
    { id: "IMAD5112__actions_intro", moduleId: "IMAD5112", title: "CI / Actions mindset", order: 4 },
  ],
  PROG6212: [
    { id: "PROG6212__fork_upstream", moduleId: "PROG6212", title: "Forks and upstream", order: 0 },
    { id: "PROG6212__remotes", moduleId: "PROG6212", title: "Multiple remotes", order: 1 },
    { id: "PROG6212__fetch_merge", moduleId: "PROG6212", title: "Fetch and merge", order: 2 },
    { id: "PROG6212__sync", moduleId: "PROG6212", title: "Keeping a fork in sync", order: 3 },
    { id: "PROG6212__tracking", moduleId: "PROG6212", title: "Upstream tracking branches", order: 4 },
  ],
  PROG6112: [
    { id: "PROG6112__ci_gates", moduleId: "PROG6112", title: "CI and test gates", order: 0 },
    { id: "PROG6112__merge_conflicts", moduleId: "PROG6112", title: "Merge conflicts", order: 1 },
    { id: "PROG6112__resolution", moduleId: "PROG6112", title: "Resolving conflicts", order: 2 },
    { id: "PROG6112__merge_commit", moduleId: "PROG6112", title: "Merge commits", order: 3 },
    { id: "PROG6112__branch_before_merge", moduleId: "PROG6112", title: "Branch before merging", order: 4 },
  ],
  PROG6213: [
    { id: "PROG6213__pr_basics", moduleId: "PROG6213", title: "Pull request basics", order: 0 },
    { id: "PROG6213__review", moduleId: "PROG6213", title: "Code review", order: 1 },
    { id: "PROG6213__merge_strategies", moduleId: "PROG6213", title: "Merge strategies", order: 2 },
    { id: "PROG6213__push_upstream", moduleId: "PROG6213", title: "Push and tracking", order: 3 },
    { id: "PROG6213__collaboration", moduleId: "PROG6213", title: "Team collaboration", order: 4 },
  ],
  PROG6214: [
    { id: "PROG6214__log_history", moduleId: "PROG6214", title: "Log and history", order: 0 },
    { id: "PROG6214__reflog", moduleId: "PROG6214", title: "Reflog", order: 1 },
    { id: "PROG6214__reset_revert", moduleId: "PROG6214", title: "Reset vs revert", order: 2 },
    { id: "PROG6214__cherry_pick", moduleId: "PROG6214", title: "Cherry-pick", order: 3 },
    { id: "PROG6214__bisect", moduleId: "PROG6214", title: "Bisect", order: 4 },
  ],
  PROG7313: [
    { id: "PROG7313__branch_protection", moduleId: "PROG7313", title: "Branch protection", order: 0 },
    { id: "PROG7313__codeowners", moduleId: "PROG7313", title: "CODEOWNERS", order: 1 },
    { id: "PROG7313__releases", moduleId: "PROG7313", title: "Releases and tags", order: 2 },
    { id: "PROG7313__governance", moduleId: "PROG7313", title: "Governance policy", order: 3 },
    { id: "PROG7313__signoff", moduleId: "PROG7313", title: "Auditable sign-off", order: 4 },
  ],
  PROG7314: [
    { id: "PROG7314__interactive_rebase", moduleId: "PROG7314", title: "Interactive rebase", order: 0 },
    { id: "PROG7314__squash", moduleId: "PROG7314", title: "Squash and fixup", order: 1 },
    { id: "PROG7314__reword", moduleId: "PROG7314", title: "Reword commits", order: 2 },
    { id: "PROG7314__rebase_vs_merge", moduleId: "PROG7314", title: "Rebase vs merge", order: 3 },
    { id: "PROG7314__history_rewrite", moduleId: "PROG7314", title: "Safe history rewrite", order: 4 },
  ],
  PROG7315: [
    { id: "PROG7315__merge_strategies_adv", moduleId: "PROG7315", title: "Merge strategies", order: 0 },
    { id: "PROG7315__rerere", moduleId: "PROG7315", title: "Rerere", order: 1 },
    { id: "PROG7315__complex_merges", moduleId: "PROG7315", title: "Complex merges", order: 2 },
    { id: "PROG7315__policy", moduleId: "PROG7315", title: "Team merge policy", order: 3 },
    { id: "PROG7315__integration", moduleId: "PROG7315", title: "Long-running branches", order: 4 },
  ],
  PROG7316: [
    { id: "PROG7316__hooks_lifecycle", moduleId: "PROG7316", title: "Hook lifecycle", order: 0 },
    { id: "PROG7316__pre_commit", moduleId: "PROG7316", title: "Pre-commit hooks", order: 1 },
    { id: "PROG7316__pre_push", moduleId: "PROG7316", title: "Pre-push hooks", order: 2 },
    { id: "PROG7316__commit_msg", moduleId: "PROG7316", title: "Commit-msg conventions", order: 3 },
    { id: "PROG7316__hooks_vs_ci", moduleId: "PROG7316", title: "Hooks vs CI", order: 4 },
  ],
  PROG7317: [
    { id: "PROG7317__submodules", moduleId: "PROG7317", title: "Submodules", order: 0 },
    { id: "PROG7317__subtree", moduleId: "PROG7317", title: "Subtree basics", order: 1 },
    { id: "PROG7317__monorepo", moduleId: "PROG7317", title: "Monorepo scale", order: 2 },
    { id: "PROG7317__sparse", moduleId: "PROG7317", title: "Sparse checkout", order: 3 },
    { id: "PROG7317__vendor", moduleId: "PROG7317", title: "Vendoring dependencies", order: 4 },
  ],
  PROG7318: [
    { id: "PROG7318__secrets_leaks", moduleId: "PROG7318", title: "Secrets in history", order: 0 },
    { id: "PROG7318__filter_repo", moduleId: "PROG7318", title: "History filtering", order: 1 },
    { id: "PROG7318__signed_commits", moduleId: "PROG7318", title: "Signed commits", order: 2 },
    { id: "PROG7318__rotation", moduleId: "PROG7318", title: "Credential rotation", order: 3 },
    { id: "PROG7318__prevention", moduleId: "PROG7318", title: "Prevention", order: 4 },
  ],
  PROG7319: [
    { id: "PROG7319__objects", moduleId: "PROG7319", title: "Git objects", order: 0 },
    { id: "PROG7319__cat_file", moduleId: "PROG7319", title: "Plumbing (cat-file)", order: 1 },
    { id: "PROG7319__fsck", moduleId: "PROG7319", title: "fsck and integrity", order: 2 },
    { id: "PROG7319__packs", moduleId: "PROG7319", title: "Packfiles", order: 3 },
    { id: "PROG7319__tags", moduleId: "PROG7319", title: "Annotated tags", order: 4 },
  ],
  PROG7320: [
    { id: "PROG7320__fork_flow", moduleId: "PROG7320", title: "Fork workflow", order: 0 },
    { id: "PROG7320__remotes_cap", moduleId: "PROG7320", title: "Origin and upstream", order: 1 },
    { id: "PROG7320__branch_pr", moduleId: "PROG7320", title: "Feature branches", order: 2 },
    { id: "PROG7320__integrate", moduleId: "PROG7320", title: "Integrate and resolve", order: 3 },
    { id: "PROG7320__push_pr", moduleId: "PROG7320", title: "Push for review", order: 4 },
  ],
};

export function getConceptsForModule(moduleId: string): WorkshopConcept[] {
  return CONCEPTS_BY_MODULE[moduleId] ?? [];
}

export function isLabChallenge(moduleId: string, challengeId: string): boolean {
  const labs = LAB_CHALLENGE_IDS_BY_MODULE[moduleId];
  return labs?.includes(challengeId) ?? false;
}
