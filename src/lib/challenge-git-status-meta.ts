import type { ChallengeDef } from "@/lib/module-routes";

export interface ChallengeStatusScenario {
  headline: string;
  summary: string;
  /** Always show the remotes block (even if empty) for fork/remote challenges */
  emphasizeRemotes: boolean;
}

/** Copy + layout hints for the Git Status tab per challenge. */
export function getChallengeStatusScenario(challenge: ChallengeDef): ChallengeStatusScenario {
  switch (challenge.slug) {
    case "feature-branching-101":
      return {
        headline: "Working tree",
        summary:
          "Snapshot of your simulated repo: branch, staged/unstaged files, and last commit — same information `git status` uses.",
        emphasizeRemotes: false,
      };
    case "configure-fork-remotes":
      return {
        headline: "Remotes & working tree",
        summary:
          "After a fork, origin points at your GitHub fork. Add upstream to track the original repository, then use this view to confirm both remotes and your fetch activity.",
        emphasizeRemotes: true,
      };
    case "pr-workflow":
      return {
        headline: "Branch & changes",
        summary:
          "PR-style challenges track your feature branch, what is committed locally, and whether the working tree is clean.",
        emphasizeRemotes: false,
      };
    case "recover-lost-commit":
      return {
        headline: "Repository state",
        summary:
          "Recovery drills focus on history and branches; this panel mirrors `git status` for your simulated working tree.",
        emphasizeRemotes: false,
      };
    case "github-ecosystem-lab":
      return {
        headline: "Working tree",
        summary:
          "Before remotes and pushes, your local branch, index, and last commit must line up — same as `git status` reflects.",
        emphasizeRemotes: false,
      };
    case "ci-merge-workflow":
      return {
        headline: "Branch & index",
        summary:
          "Pre-merge discipline: your simulator state shows whether work is isolated on a branch and staged appropriately.",
        emphasizeRemotes: false,
      };
    case "governance-signoff":
      return {
        headline: "Audit-ready snapshot",
        summary:
          "Governance challenges still map to branch, staging, and commit - what you see here is your local truth before policy review.",
        emphasizeRemotes: false,
      };
    case "resolve-merge-conflicts":
      return {
        headline: "Merge in progress",
        summary:
          "A merge has left conflict markers in your files. Edit each conflicted file in the Files tab to remove the markers, then stage and commit.",
        emphasizeRemotes: false,
      };
    default:
      return {
        headline: "Git status",
        summary: challenge.description.slice(0, 160) + (challenge.description.length > 160 ? "…" : ""),
        emphasizeRemotes: false,
      };
  }
}
