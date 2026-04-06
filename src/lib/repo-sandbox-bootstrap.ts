import { createInitialGitState, type GitSimState } from "@/lib/git-emulator";

/** Normalize GitHub repo page URL to a .git remote URL for the simulator. */
export function githubRepoPageToGitRemote(htmlUrl: string): string {
  const t = htmlUrl.trim();
  if (t.endsWith(".git")) return t;
  return `${t.replace(/\/$/, "")}.git`;
}

/**
 * Fresh simulated repo for practicing git commands in the browser.
 * Not a real clone — `origin` is set so `git remote -v` matches the linked GitHub repo.
 */
export function createRepoSandboxGitState(repo: {
  full_name: string;
  html_url: string;
  default_branch: string;
}): GitSimState {
  const url = githubRepoPageToGitRemote(repo.html_url);
  return createInitialGitState({
    modifiedPaths: [],
    remotes: {
      origin: { fetch: url, push: url },
    },
    fileContents: {
      "README.md": `# ${repo.full_name}

**Practice sandbox** — this is a browser simulator, not your live GitHub files.

Default branch on GitHub: \`${repo.default_branch}\`

Try \`git status\`, \`git remote -v\`, and \`tutor\` for help.
`,
    },
  });
}
