import type { ChallengeDef } from "@/lib/module-routes";

/** One-line hint under each challenge on the lesson “Challenges” list. */
export function getChallengeListHint(challenge: ChallengeDef): string {
  switch (challenge.slug) {
    case "feature-branching-101":
      return "About keeping work off main, lining up the index, then recording a deliberate commit.";
    case "configure-fork-remotes":
      return "About wiring your fork to the original project and pulling its updates safely.";
    case "pr-workflow":
      return "About branching from main, recording a commit (you pick the message), then pushing with upstream tracking.";
    case "recover-lost-commit":
      return "About finding a commit Git still remembers and getting your tree back to a good state.";
    case "github-ecosystem-lab":
      return "About branching, staging, and committing before your first push workflow.";
    case "ci-merge-workflow":
      return "About treating a branch like your pre-merge safety lane before integrating.";
    case "governance-signoff":
      return "About auditable branches and messages in a governed repository.";
    case "resolve-merge-conflicts":
      return "About editing files to remove conflict markers and completing a merge by hand.";
    default:
      return challenge.objectives.length > 0
        ? `This challenge checks ${challenge.objectives.length} separate ideas in the simulator.`
        : "Interactive Git practice in the browser terminal.";
  }
}
