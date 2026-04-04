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
    eyebrow: "PROG5112 · Logic & Version Control",
    title: "Git basics",
    intro:
      "This module grounds you in how Git thinks: snapshots, branches, and a clean commit history. Complete these ideas before moving on to GitHub Actions and team workflows.",
    sections: [
      {
        heading: "Repositories and the three trees",
        body:
          "Your working directory, the index (staging), and the latest commit each play a role. Stage only what you intend to record; commits should tell a coherent story.",
      },
      {
        heading: "Commits that read well",
        body:
          "Use imperative mood, keep the subject short, and add a body when context matters. Future you (and your reviewers) will thank you.",
      },
      {
        heading: "Branches as experiments",
        body:
          "Create a branch for each logical change. Merge or rebase according to your team’s conventions — consistency beats dogma.",
      },
    ],
    terminal: [
      "git status",
      "git add -p",
      "git commit -m \"Describe the change\"",
      "git switch -c feature/readme-tweaks",
    ],
    files: [
      { name: "index.html", content: "<html>...</html>", active: false },
      { name: "style.css", content: "body { color: red; }", active: true },
      { name: "package.json", content: "{}", active: false },
      { name: "README.md", content: "# Project", active: false },
    ],
  },
  [key("foundations", "github-ecosystem")]: {
    eyebrow: "IMAD5112 · GitHub Ecosystem Foundations",
    title: "GitHub ecosystem",
    intro:
      "Connect local Git to GitHub: authentication, remotes, pushes, and a first look at automation with Actions.",
    sections: [
      {
        heading: "Authentication",
        body:
          "Prefer SSH keys or the GitHub CLI (`gh auth login`) for smoother pushes and fewer password prompts.",
      },
      {
        heading: "Remotes and upstream",
        body:
          "`origin` is convention; know what it points to. Track upstream branches when you fork open-source work.",
      },
      {
        heading: "Actions at a glance",
        body:
          "Workflows live in `.github/workflows`. Triggers, jobs, and steps turn pushes into repeatable pipelines.",
      },
    ],
    terminal: [
      "gh repo view --web",
      "git remote -v",
      "git push -u origin main",
    ],
  },
  [key("architecture", "merge-conflicts")]: {
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
          "Read `<<<<<<<`, `=======`, and `>>>>>>>` carefully; merge both sides’ intent, then remove markers and verify with tests.",
      },
    ],
    terminal: [
      "git fetch origin",
      "git merge origin/main",
      "npm test",
    ],
  },
  [key("mastery", "branch-mastery")]: {
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
};

export function getLessonContent(track: string, lessonSlug: string): LessonContent | null {
  return registry[key(track, lessonSlug)] ?? null;
}
