/**
 * Plain-English Git help for the challenge terminal.
 * Only runs when the user types the activation command `tutor` (see isTutorCommand).
 */

const ACTIVATION = "tutor";

export function isTutorCommand(rawInput: string): boolean {
  const t = rawInput.trim();
  if (!t) return false;
  const first = t.split(/\s+/)[0]?.toLowerCase();
  return first === ACTIVATION;
}

type Topic =
  | "overview"
  | "status"
  | "add"
  | "commit"
  | "branch"
  | "checkout"
  | "switch"
  | "unknown";

function normalizeTopic(rest: string): Topic {
  const s = rest.replace(/^\s*git\s+/i, "").trim().toLowerCase();
  if (!s || s === "help") return "overview";
  if (s === "status") return "status";
  if (s === "add") return "add";
  if (s === "commit") return "commit";
  if (s === "branch" || s === "branches") return "branch";
  if (s === "checkout") return "checkout";
  if (s === "switch") return "switch";
  return "unknown";
}

const COPY: Record<Exclude<Topic, "unknown">, string[]> = {
  overview: [
    "Git Tutor — short explanations in everyday language.",
    "",
    "Topics (type: tutor <topic>):",
    "  status   — what git status tells you",
    "  add      — staging files before a commit",
    "  commit   — saving a snapshot with a message",
    "  branch   — parallel lines of work",
    "  checkout — creating or switching branches (checkout -b)",
    "  switch   — newer command to switch or create branches",
    "",
    "Example: tutor commit",
    "Practice real commands separately, e.g. git status",
  ],
  status: [
    "git status — “Where is everything right now?”",
    "",
    "It answers: which branch you’re on, which files changed, and what’s staged vs not staged.",
    "Staged means: you’ve marked those changes to go into the next commit.",
    "Not staged means: the file changed on disk, but you haven’t added it to the next commit yet.",
  ],
  add: [
    "git add — “Pick what goes into the next commit.”",
    "",
    "You’re moving changes from your working copy into the staging area (the index).",
    "git add . or git add -A stages everything eligible; git add <file> stages one file.",
    "Nothing is saved in history until you commit — add is only choosing what will be included.",
  ],
  commit: [
    "git commit — “Save a named snapshot of the repo.”",
    "",
    "Each commit records what was staged, with a message describing the change.",
    "git commit -m \"message\" sets the message in one step.",
    "Good messages explain intent (what/why), so teammates and future you can follow the story.",
  ],
  branch: [
    "Branches — “Separate timelines for separate work.”",
    "",
    "main (or master) is usually the shared baseline.",
    "A feature branch lets you experiment without disturbing main until you’re ready to merge.",
    "git branch lists branches; creating a branch is often done with checkout -b or switch -c.",
  ],
  checkout: [
    "git checkout — “Move HEAD to another branch or commit.”",
    "",
    "git checkout -b new-name creates a new branch and switches to it in one step.",
    "Older workflows use checkout a lot; newer Git adds git switch for moving between branches.",
  ],
  switch: [
    "git switch — “Go to another branch.”",
    "",
    "git switch name moves you to an existing branch.",
    "git switch -c new-name creates a new branch and switches to it (like checkout -b).",
    "It’s focused only on switching branches, which is easier to teach than checkout.",
  ],
};

/**
 * Static fallback when Gemini is unavailable or the API errors.
 * Returns lines to print in the terminal, or null if input is not a tutor command.
 */
export function runTutorStaticFallback(rawInput: string): string[] | null {
  if (!isTutorCommand(rawInput)) return null;
  const rest = rawInput.trim().slice(ACTIVATION.length).trim();
  const topic = normalizeTopic(rest);

  if (topic === "unknown") {
    return [
      `Unknown topic: "${rest.replace(/^\s*git\s+/i, "").trim()}"`,
      "",
      "Type tutor alone to see available topics.",
      "Set GEMINI_API_KEY in .env.local for dynamic answers to any question.",
    ];
  }

  return COPY[topic];
}
