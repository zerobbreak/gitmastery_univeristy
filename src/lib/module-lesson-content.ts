export interface LessonContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; body: string }[];
  terminal: string[];
  files?: { name: string; content: string; active?: boolean }[];
}

const key = (track: string, slug: string) => `${track}/${slug}`;

const registry: Record<string, LessonContent> = {
  [key("foundations", "git-basics")]: {
    eyebrow: "PROG5112 · Getting Started with Git",
    title: "Git basics — from zero to your first commit",
    intro:
      "Every Git journey starts with `git init`. This module walks you through initializing a repository, understanding the staging area, making your first commit, and creating branches. Master these fundamentals before moving on to GitHub and team workflows.",
    sections: [
      {
        heading: "Initializing a repository",
        body:
          "`git init` turns any folder into a Git repository by creating a hidden `.git` directory that tracks all changes. You only run it once per project. From this point on, Git watches your working directory for modifications.",
      },
      {
        heading: "The staging area (index)",
        body:
          "Git doesn't commit everything automatically. You choose what to include with `git add`. Think of the staging area as a draft of your next commit — add files deliberately so each commit tells a clear story.",
      },
      {
        heading: "Making commits",
        body:
          "A commit is a snapshot of your staged changes with a message explaining what you did. Use imperative mood (\"Add feature\" not \"Added feature\") and keep the subject line short. Commits are the building blocks of your project history.",
      },
      {
        heading: "Branches as experiments",
        body:
          "A branch is a lightweight pointer to a commit. Create one for each feature or fix so you can experiment without affecting `main`. When the work is ready, merge it back. This keeps your main branch stable.",
      },
    ],
    terminal: [
      "git init",
      "git status",
      "git add index.html",
      "git add .",
      "git commit -m \"Initial commit\"",
      "git log --oneline",
      "git branch feature-login",
      "git switch feature-login",
    ],
    files: [
      { name: "index.html", content: "<html>\n  <head><title>My Project</title></head>\n  <body><h1>Hello Git!</h1></body>\n</html>", active: true },
      { name: "style.css", content: "body {\n  font-family: sans-serif;\n  color: #333;\n}", active: false },
      { name: "package.json", content: "{\n  \"name\": \"my-project\",\n  \"version\": \"1.0.0\"\n}", active: false },
      { name: "README.md", content: "# My Project\n\nA sample project for learning Git.", active: false },
    ],
  },
  [key("foundations", "github-ecosystem")]: {
    eyebrow: "IMAD5112 · GitHub Ecosystem Foundations",
    title: "GitHub ecosystem",
    intro:
      "Now that you can init, commit, and branch locally, it's time to connect Git to GitHub. Learn authentication, pushing to remotes, and a first look at automation with Actions.",
    sections: [
      {
        heading: "Authentication",
        body:
          "Prefer SSH keys or the GitHub CLI (`gh auth login`) for smoother pushes and fewer password prompts.",
      },
      {
        heading: "Remotes and upstream",
        body:
          "When you clone or push to GitHub, Git creates a remote called `origin`. It's just a nickname for the URL. Know what it points to, and track upstream branches when you fork open-source work.",
      },
      {
        heading: "Actions at a glance",
        body:
          "Workflows live in `.github/workflows`. Triggers, jobs, and steps turn pushes into repeatable pipelines.",
      },
    ],
    terminal: [
      "git remote add origin https://github.com/you/repo.git",
      "git remote -v",
      "git push -u origin main",
      "gh repo view --web",
    ],
  },
  [key("foundations", "remote-management")]: {
    eyebrow: "PROG6212 · Remote Repository Management",
    title: "Remotes, forks, and staying in sync",
    intro:
      "Connect your local repo to GitHub, manage multiple remotes when you work from a fork, and fetch updates from upstream without losing your branch work.",
    sections: [
      {
        heading: "What a remote is",
        body:
          "A remote is a named URL (usually `origin`) that Git uses to fetch and push. `git remote -v` shows where each name points — HTTPS or SSH.",
      },
      {
        heading: "Forks and upstream",
        body:
          "When you fork a repo, your clone’s `origin` is your fork. Add another remote (often `upstream`) that points at the original project so you can pull in changes with `git fetch`.",
      },
      {
        heading: "Fetch vs pull",
        body:
          "`git fetch` downloads new commits without merging; `git pull` fetches and merges the tracked branch. Prefer fetch + review when integrating upstream work.",
      },
    ],
    terminal: [
      "git remote -v",
      "git remote add upstream https://github.com/original/repo.git",
      "git fetch upstream",
      "git merge upstream/main",
    ],
  },
  [key("intermediate", "merge-conflicts")]: {
    eyebrow: "PROG6112 · Advanced Git Testing",
    title: "Testing & merge conflicts",
    intro:
      "Keep main green: run tests locally, integrate CI feedback, and resolve conflicts without losing intent.",
    sections: [
      {
        heading: "CI as a safety net",
        body:
          "Let automated tests catch regressions before review. Fix failures on your branch before requesting another look.",
      },
      {
        heading: "Conflict markers",
        body:
          "Read `<<<<<<<`, `=======`, and `>>>>>>>` carefully; merge both sides' intent, then remove markers and verify with tests.",
      },
    ],
    terminal: [
      "git fetch origin",
      "git merge origin/main",
      "npm test",
    ],
  },
  [key("intermediate", "pull-requests")]: {
    eyebrow: "PROG6213 · Pull Request Mastery",
    title: "Pull requests and review flow",
    intro:
      "Ship changes through branches, push to GitHub, and open pull requests so teammates can review, comment, and merge with a clear history.",
    sections: [
      {
        heading: "Branch then push",
        body:
          "Create a feature branch from an up-to-date `main`, commit in small steps, and push with `git push -u origin your-branch` so the remote tracks your work.",
      },
      {
        heading: "Opening a PR",
        body:
          "On GitHub, compare your branch to the base branch, write a concise summary, link issues, and request reviewers. CI runs on the PR before merge.",
      },
      {
        heading: "Responding to review",
        body:
          "Push additional commits to the same branch; the PR updates automatically. Resolve conversations and re-request review when ready.",
      },
    ],
    terminal: [
      "git switch -c feature/my-change",
      "git push -u origin feature/my-change",
      "gh pr create",
    ],
  },
  [key("intermediate", "git-recovery")]: {
    eyebrow: "PROG6214 · Git History & Recovery",
    title: "History, reflog, and recovery",
    intro:
      "When history moves unexpectedly, use the reflog and targeted branches to find commits again — without panicking.",
    sections: [
      {
        heading: "Reflog",
        body:
          "`git reflog` lists where HEAD has pointed recently. Even after a reset, the old tip is often still reachable from the reflog for a while.",
      },
      {
        heading: "Recovering a commit",
        body:
          "Create a branch at the recovered hash: `git branch recover-abc <hash>`, then inspect and merge or cherry-pick as needed.",
      },
      {
        heading: "Bisect for bugs",
        body:
          "`git bisect` binary-searches history to find the commit that introduced a bug — powerful when tests are reliable.",
      },
    ],
    terminal: [
      "git reflog",
      "git branch recover-work HEAD@{1}",
      "git bisect start",
    ],
  },
  [key("pro", "branch-mastery")]: {
    eyebrow: "PROG7313 · Branch Mastery & Management",
    title: "Branch governance",
    intro:
      "At scale, branch protection, required reviews, and release discipline keep delivery predictable.",
    sections: [
      {
        heading: "Policies",
        body:
          "Define who can merge, what checks must pass, and how releases are tagged. Document exceptions.",
      },
    ],
    terminal: [
      "git tag -a v1.2.0 -m \"Release\"",
      "git push origin v1.2.0",
    ],
  },
  [key("pro", "interactive-rebase")]: {
    eyebrow: "PROG7314 · Interactive Rebase",
    title: "Rewrite history before review",
    intro:
      "Interactive rebase lets you squash noisy commits, fix messages, and reorder work so reviewers see a clear story.",
    sections: [
      {
        heading: "git rebase -i",
        body:
          "Pick, squash, reword, and drop commits in a todo list. The simulator supports a squash of the last N commits with `git rebase -i HEAD~N`.",
      },
      {
        heading: "When to use it",
        body:
          "Use on branches that are not yet merged and not shared widely. Never rewrite published main without team agreement.",
      },
    ],
    terminal: [
      "git log --oneline -5",
      "git rebase -i HEAD~3",
    ],
  },
  [key("pro", "advanced-merge-strategies")]: {
    eyebrow: "PROG7315 · Advanced merge",
    title: "Merges at scale",
    intro:
      "Beyond fast-forward: enable rerere so repeated conflict resolutions are remembered, and align merge policy with your team.",
    sections: [
      {
        heading: "Rerere",
        body:
          "`git config rerere.enabled true` records how you resolved conflicts so the next similar merge is easier.",
      },
    ],
    terminal: [
      "git config rerere.enabled true",
      "git merge feature-x",
    ],
  },
  [key("pro", "git-hooks-automation")]: {
    eyebrow: "PROG7316 · Hooks",
    title: "Automate before CI",
    intro:
      "Hooks run locally before code leaves your machine. Pair them with CI for defense in depth.",
    sections: [
      {
        heading: "Client hooks",
        body:
          "pre-commit and pre-push are common. The simulator exposes `git hook install pre-commit` as a stand-in for wiring a real script.",
      },
    ],
    terminal: ["git hook install pre-commit"],
  },
  [key("pro", "monorepo-submodules")]: {
    eyebrow: "PROG7317 · Submodules",
    title: "Compose repositories",
    intro:
      "Submodules pin external repos at a path. Clone with `git submodule update --init` in real projects.",
    sections: [
      {
        heading: "git submodule add",
        body:
          "Records the remote URL and commit in `.gitmodules`. Update deliberately and commit the pointer change.",
      },
    ],
    terminal: [
      "git submodule add https://github.com/example/lib.git vendor/lib",
    ],
  },
  [key("pro", "security-history")]: {
    eyebrow: "PROG7318 · Security",
    title: "Secrets and history",
    intro:
      "Committed secrets require history rewriting and key rotation. The simulator models `git filter-repo --force` as a rewrite step.",
    sections: [
      {
        heading: "Remediation",
        body:
          "Rotate the leaked credential, then rewrite history on branches that contained it. Coordinate with collaborators.",
      },
    ],
    terminal: ["git filter-repo --force"],
  },
  [key("pro", "git-internals")]: {
    eyebrow: "PROG7319 · Internals",
    title: "Objects and plumbing",
    intro:
      "Understanding blobs, trees, and commits helps when `git status` is not enough.",
    sections: [
      {
        heading: "Inspection",
        body:
          "`git cat-file` inspects objects; `git fsck` checks connectivity. Use them when debugging odd repository states.",
      },
    ],
    terminal: [
      "git cat-file -t HEAD",
      "git cat-file -p HEAD",
      "git fsck",
      "git tag -a v1.0.0 -m \"GA\"",
    ],
  },
  [key("pro", "full-project-capstone")]: {
    eyebrow: "PROG7320 · Capstone",
    title: "Fork to push — full stack",
    intro:
      "You are on a fork with local edits. Branch, connect upstream, sync, commit, and push — the same rhythm as real open-source work.",
    sections: [
      {
        heading: "Flow",
        body:
          "Combines branching, remotes, fetch, staging, commits, and push from earlier tracks in one scenario.",
      },
    ],
    terminal: [
      "git switch -c feature/oss-contribution",
      "git remote add upstream https://github.com/original/project.git",
      "git fetch upstream",
      "git add CONTRIBUTING.md",
      'git commit -m "Add contribution"',
      "git push -u origin feature/oss-contribution",
    ],
    files: [
      {
        name: "CONTRIBUTING.md",
        content: "# Contributing\n\nYour notes.\n",
        active: true,
      },
      { name: "README.md", content: "# OSS fork\n", active: false },
    ],
  },
};

export function getLessonContent(track: string, lessonSlug: string): LessonContent | null {
  return registry[key(track, lessonSlug)] ?? null;
}
