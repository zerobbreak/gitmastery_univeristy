export interface LessonStep {
  stepNumber: number;
  title: string;
  body: string;
  terminal?: string[];
  tip?: string;
}

export interface StepBasedLesson {
  moduleId: string;
  lessonSlug: string;
  steps: LessonStep[];
}

const key = (moduleId: string) => moduleId;

const stepsRegistry: Record<string, LessonStep[]> = {
  // Module: Getting Started with Git (PROG5112 - Foundations)
  [key("PROG5112")]: [
    {
      stepNumber: 1,
      title: "What is Git & Initializing a Repository",
      body: `**Git** is a version control system that tracks changes to your files over time. It lets you save snapshots of your project, go back to earlier versions, and collaborate with others without overwriting each other's work.

Every Git project starts with one command: \`git init\`. This creates a hidden \`.git\` folder inside your project directory. That folder is where Git stores the entire history of your project.

Key concepts:
- **Repository (repo)** - A project folder tracked by Git
- **Working directory** - The files you can see and edit
- **\`.git\` directory** - Hidden folder that stores all version history
- **Untracked files** - Files Git doesn't know about yet

After running \`git init\`, your folder is a Git repository - but Git isn't tracking any files yet. That's the next step.`,
      terminal: [
        "mkdir my-project",
        "cd my-project",
        "git init",
        "ls -la",
        "git status",
      ],
      tip: "You only run `git init` once per project. If you clone a repo from GitHub, it's already initialized - no need to run `git init` again.",
    },
    {
      stepNumber: 2,
      title: "Tracking Files & The Staging Area",
      body: `When you create or modify files, Git notices the changes but doesn't save them automatically. You need to explicitly tell Git which changes to include in your next snapshot.

This is where \`git add\` comes in. It moves files to the **staging area** (also called the **index**) - a holding zone for changes you're about to commit.

Think of it like packing a box before shipping:
- **Working directory** - Your desk with all your stuff
- **Staging area** - The box you're packing
- **Commit** - Sealing the box and labeling it

Why stage? Because you might change 5 files but only want to commit 3 of them. Staging gives you that control.

Common patterns:
- \`git add filename\` - Stage one specific file
- \`git add .\` - Stage everything in the current directory
- \`git status\` - See what's staged, modified, or untracked`,
      terminal: [
        "echo '<h1>Hello</h1>' > index.html",
        "git status",
        "git add index.html",
        "git status",
        "git add .",
      ],
      tip: "Run `git status` often - it tells you exactly where things stand and what to do next. It's the most useful Git command for beginners.",
    },
    {
      stepNumber: 3,
      title: "Making Your First Commit",
      body: `A **commit** saves a snapshot of everything in the staging area. Each commit has:
- A unique ID (hash) like \`a1b2c3d\`
- A message describing what changed
- A timestamp and author
- A pointer to the previous commit (parent)

Together, commits form a timeline of your project - you can always go back to any point.

**Writing good commit messages:**
- Use imperative mood: "Add login page" not "Added login page"
- Keep the subject under 50 characters
- Explain *why*, not just *what*, when the change isn't obvious

After committing, the staging area is clean, but your working directory still has all your files. You can keep editing and committing.`,
      terminal: [
        "git commit -m \"Initial commit\"",
        "git log",
        "git log --oneline",
      ],
      tip: "If you run `git commit` without the `-m` flag, Git opens a text editor for a longer message. Use `-m` for quick one-liners.",
    },
    {
      stepNumber: 4,
      title: "Creating & Switching Branches",
      body: `A **branch** is a separate line of development. Think of it as a parallel universe for your code - you can make changes on a branch without affecting \`main\`.

When you run \`git init\`, Git creates one branch called \`main\` (or \`master\` in older setups). To work on a new feature or fix, create a new branch.

**Why branches matter:**
- Keep experimental work separate from stable code
- Work on multiple features simultaneously
- Collaborate without stepping on each other's toes

**The workflow:**
1. Create a branch: \`git branch feature-name\`
2. Switch to it: \`git switch feature-name\` (or \`git checkout feature-name\`)
3. Make commits on that branch
4. When done, merge back into \`main\`

Shortcut: \`git switch -c feature-name\` creates AND switches in one command.`,
      terminal: [
        "git branch",
        "git branch feature-login",
        "git switch feature-login",
        "git switch -c feature-signup",
        "git branch",
        "git switch main",
      ],
      tip: "`git switch` (Git 2.23+) is the modern way to change branches. `git checkout` still works but does too many things - `switch` is clearer.",
    },
  ],

  // Module: Remote Repository Management (PROG6212 - Foundations)
  [key("PROG6212")]: [
    {
      stepNumber: 1,
      title: "Understanding Remotes",
      body: `A **remote** is a version of your repository hosted elsewhere - typically on GitHub, GitLab, or a private server. When you clone a repo, Git automatically names that remote \`origin\`.

Remotes let multiple developers collaborate on the same codebase. Your local repo tracks changes independently, and you push/pull to synchronize with the remote.

Key concepts:
- **origin** - The default name for the remote you cloned from
- **Remote URL** - Can be HTTPS or SSH (SSH is preferred for security)
- **Remote tracking branches** - Local references like \`origin/main\` that mirror remote state`,
      terminal: [
        "git remote -v",
        "git remote show origin",
        "git config --get remote.origin.url",
      ],
      tip: "Run `git remote -v` to see both fetch and push URLs. They can differ in advanced setups.",
    },
    {
      stepNumber: 2,
      title: "Working with Multiple Remotes",
      body: `You can have multiple remotes - common when contributing to open source. The typical pattern:
- **origin** - Your fork of the repository
- **upstream** - The original repository you forked from

Adding a second remote lets you fetch updates from the original project while pushing to your own fork.

When to use multiple remotes:
- Contributing to open source projects
- Syncing a fork with the original repo
- Deploying to different environments`,
      terminal: [
        "git remote add upstream https://github.com/original/repo.git",
        "git remote -v",
        "git fetch upstream",
        "git remote rename upstream original",
        "git remote remove old-remote",
      ],
      tip: "Name remotes descriptively. 'upstream' is convention for the original repo, but you could use 'source' or the org name.",
    },
    {
      stepNumber: 3,
      title: "Tracking Branches",
      body: `A **tracking branch** is a local branch that has a direct relationship with a remote branch. This lets Git know where to push and pull by default.

When you clone, \`main\` automatically tracks \`origin/main\`. For new branches, you set tracking with the \`-u\` flag.

Benefits of tracking:
- \`git push\` and \`git pull\` work without specifying remote/branch
- \`git status\` shows how far ahead/behind you are
- Easier branch management`,
      terminal: [
        "git push -u origin feature-branch",
        "git branch -vv",
        "git branch --set-upstream-to=origin/main main",
        "git status",
      ],
      tip: "The `-u` flag only needs to be used once per branch. After that, `git push` knows where to go.",
    },
    {
      stepNumber: 4,
      title: "Syncing Forks",
      body: `Keeping your fork up to date is essential when contributing to active projects. The workflow:

1. Fetch changes from upstream
2. Merge or rebase onto your local main
3. Push the updated main to your fork (origin)

This ensures your feature branches start from the latest code and reduces merge conflicts when you open pull requests.`,
      terminal: [
        "git fetch upstream",
        "git checkout main",
        "git merge upstream/main",
        "git push origin main",
      ],
      tip: "Some developers prefer `git rebase upstream/main` for a cleaner history, but merge is safer if others share your fork.",
    },
  ],

  // Module: GitHub Ecosystem Foundations (IMAD5112)
  [key("IMAD5112")]: [
    {
      stepNumber: 1,
      title: "Authentication on your machine",
      body: `Before GitHub accepts pushes, your machine must prove who you are. Common options:

- **SSH keys** - add your public key to GitHub; Git uses your private key when talking to \`git@github.com:...\` URLs.
- **HTTPS + credential helper** - store a token or use the OS keychain so you are not typing passwords on every push.
- **GitHub CLI** - \`gh auth login\` walks through browser or token flow and configures Git for you.

Verify with \`gh auth status\` or a test \`git ls-remote\` against a repo you can access.`,
      terminal: [
        "gh auth login",
        "gh auth status",
        "ssh -T git@github.com",
      ],
      tip: "Prefer SSH for daily work if your org allows it - fewer token prompts and clearer errors when keys are wrong.",
    },
    {
      stepNumber: 2,
      title: "origin and your first push",
      body: `**origin** is just a nickname for the URL Git should use when you fetch or push. After \`git clone\`, origin points at the repo you cloned.

Before the first push of a new branch, you may need \`-u\` (\`--set-upstream\`) so Git remembers which remote branch tracks yours.

Check what origin is: \`git remote -v\`. You should see fetch and push URLs that match your GitHub repo.`,
      terminal: [
        "git remote -v",
        "git branch -vv",
        "git push -u origin main",
      ],
      tip: "If origin is wrong, you can update the URL with `git remote set-url origin <new-url>`.",
    },
    {
      stepNumber: 3,
      title: "Actions in the repo",
      body: `**GitHub Actions** runs workflows from \`.github/workflows\` when events fire (push, PR, schedule, etc.).

You do not "run Actions" from Git locally - you push commits; GitHub executes the workflow. A green check means your pipeline passed for that commit.

Skim a workflow file: **on** (when), **jobs** (parallel units of work), **steps** (commands). That mental model is enough to pair local commits with CI feedback.`,
      terminal: [
        "ls .github/workflows",
        "gh workflow list",
        "gh run list --limit 5",
      ],
      tip: "Fix failing workflows on a branch; merge to main only when checks are green unless your team has an exception process.",
    },
  ],

  // Module: Merge conflicts / testing (PROG6112)
  [key("PROG6112")]: [
    {
      stepNumber: 1,
      title: "How merge conflicts happen",
      body: `A **merge conflict** occurs when Git cannot automatically combine changes because two branches modified the same lines in a file.

**Common scenarios:**
- You and a teammate both edited line 15 of \`config.js\`
- You deleted a file someone else modified
- Both branches added different content at the same location

When you run \`git merge\` and conflicts exist, Git pauses and marks the problematic files. The merge is **not complete** until you resolve every conflict.

\`git status\` shows "Unmerged paths" - these are the files you need to fix.`,
      terminal: [
        "git checkout main",
        "git merge feature-branch",
        "git status",
      ],
      tip: "Conflicts are normal! They mean two people were productive. The merge process just needs your human judgment to combine the work.",
    },
    {
      stepNumber: 2,
      title: "Understanding conflict markers",
      body: `When Git cannot auto-merge, it inserts **conflict markers** directly into the file:

\`\`\`
<<<<<<< HEAD
  apiUrl: "https://staging.example.com"
=======
  apiUrl: "https://production.example.com"
>>>>>>> feature-branch
\`\`\`

**What each part means:**
- \`<<<<<<< HEAD\` - Start of YOUR current branch's version
- Everything between \`<<<<<<< HEAD\` and \`=======\` is **your code**
- \`=======\` - Separator between the two versions
- Everything between \`=======\` and \`>>>>>>>\` is the **incoming code**
- \`>>>>>>> feature-branch\` - End marker with the other branch name

Your job: **delete all markers** and keep the code you want. You might keep one side, the other, both combined, or write something entirely new.`,
      terminal: [
        "git diff",
        "cat config.js",
      ],
      tip: "The markers are literal text in the file. If you commit with markers still present, your code will not work!",
    },
    {
      stepNumber: 3,
      title: "Resolving conflicts step by step",
      body: `Here is the workflow to resolve a conflict:

**1. Open the conflicted file** in your editor

**2. Find all conflict markers** - search for \`<<<<<<<\`

**3. For each conflict, decide what to keep:**
- Keep only your version (delete their section + all markers)
- Keep only their version (delete your section + all markers)
- Combine both versions (edit to merge the logic, delete markers)
- Write new code that replaces both

**4. Remove ALL markers** - the file should look like normal code with no \`<<<<<<<\`, \`=======\`, or \`>>>>>>>\`

**5. Stage the resolved file:**
\`git add filename.js\`

Repeat for every conflicted file shown in \`git status\`.`,
      terminal: [
        "git status",
        "# Edit the file in your editor...",
        "git add config.js",
        "git status",
      ],
      tip: "Many editors highlight conflict markers. VS Code has buttons to 'Accept Current', 'Accept Incoming', or 'Accept Both' - but always verify the result makes sense.",
    },
    {
      stepNumber: 4,
      title: "Completing the merge commit",
      body: `After staging all resolved files, \`git status\` should show no "Unmerged paths". Now you can complete the merge:

\`git commit\` (without \`-m\`) opens an editor with a pre-filled merge message. Or use:
\`git commit -m "Merge feature-branch into main"\`

**The merge is now complete.** Run your tests to make sure the combined code works.

**If something went wrong:**
- Before committing: \`git merge --abort\` cancels everything
- After committing: \`git reset --hard HEAD~1\` undoes the merge commit (only if not pushed)

Push when you are confident the merge is correct.`,
      terminal: [
        "git status",
        "git commit -m \"Merge feature-branch: resolve config conflicts\"",
        "npm test",
        "git log --oneline -3",
        "git push",
      ],
      tip: "Write a commit message that mentions what conflicts you resolved. Future you will thank present you when debugging.",
    },
  ],

  // Module: Pull Request Mastery (PROG6213 - Intermediate)
  [key("PROG6213")]: [
    {
      stepNumber: 1,
      title: "Creating Your First PR",
      body: `A **Pull Request** (PR) is how you propose changes on GitHub. It's not a Git feature - it's a GitHub workflow built on top of branches.

The basic flow:
1. Create a feature branch locally
2. Make commits with your changes
3. Push the branch to GitHub
4. Open a PR from your branch to the target branch (usually \`main\`)

Your PR becomes a discussion space where reviewers can comment, request changes, and eventually approve.`,
      terminal: [
        "git checkout -b feature/add-login",
        "git add .",
        'git commit -m "Add login form component"',
        "git push -u origin feature/add-login",
      ],
      tip: "After pushing, GitHub shows a prompt to create a PR. You can also use `gh pr create` from the CLI.",
    },
    {
      stepNumber: 2,
      title: "Writing Good PR Descriptions",
      body: `A well-written PR description saves reviewers time and documents your changes for future reference.

Essential elements:
- **Title** - Clear, imperative mood ("Add user authentication" not "Added auth")
- **Summary** - What changed and why (1-3 sentences)
- **Details** - Implementation notes, trade-offs, or context
- **Testing** - How you verified the changes work
- **Links** - Reference related issues with "Fixes #123" or "Relates to #456"

Using "Fixes #123" automatically closes the issue when the PR merges.`,
      terminal: [
        "gh pr create --title 'Add login form' --body 'Implements #45'",
        "gh pr view --web",
      ],
      tip: "Create a PR template in `.github/PULL_REQUEST_TEMPLATE.md` to standardize descriptions across your team.",
    },
    {
      stepNumber: 3,
      title: "Requesting and Giving Reviews",
      body: `Code review is where collaboration happens. Good reviews catch bugs, share knowledge, and maintain code quality.

**Requesting reviews:**
- Add reviewers who know the affected code
- Use draft PRs for work-in-progress
- Respond to feedback promptly

**Giving reviews:**
- Be constructive and specific
- Distinguish between blocking issues and suggestions
- Approve when satisfied, or request changes if needed

Review statuses: Commented, Approved, Changes Requested`,
      terminal: [
        "gh pr create --reviewer teammate1,teammate2",
        "gh pr ready",
        "gh pr review --approve",
        "gh pr review --request-changes --body 'Please fix X'",
      ],
      tip: "Use 'nit:' prefix for minor suggestions that shouldn't block merging.",
    },
    {
      stepNumber: 4,
      title: "Merging Strategies",
      body: `GitHub offers three ways to merge a PR, each with trade-offs:

**Merge commit** - Creates a merge commit preserving all branch history. Good for seeing the full development story.

**Squash and merge** - Combines all commits into one. Clean main history, but loses granular commits.

**Rebase and merge** - Replays commits onto main without a merge commit. Linear history, but rewrites commit hashes.

Choose based on your team's preferences and the nature of the changes.`,
      terminal: [
        "gh pr merge --merge",
        "gh pr merge --squash",
        "gh pr merge --rebase",
        "git pull origin main",
      ],
      tip: "For small PRs, squash keeps history clean. For large features with meaningful commits, merge preserves context.",
    },
  ],

  // Module: Git History & Recovery (PROG6214 - Intermediate)
  [key("PROG6214")]: [
    {
      stepNumber: 1,
      title: "Reading Git History",
      body: `Understanding history is essential for debugging, reviewing changes, and navigating a codebase.

**git log** shows commit history with various formatting options:
- \`--oneline\` - Compact single-line format
- \`--graph\` - ASCII art branch visualization
- \`--author\` - Filter by commit author
- \`-p\` - Show the actual diff in each commit

**git show** displays details of a specific commit, including the changes made.`,
      terminal: [
        "git log --oneline -10",
        "git log --graph --oneline --all",
        "git log --author='name' --since='1 week ago'",
        "git show abc1234",
        "git show HEAD~2:src/file.js",
      ],
      tip: "Use `git log -S 'searchterm'` to find commits that added or removed specific text.",
    },
    {
      stepNumber: 2,
      title: "Using Reflog",
      body: `**Reflog** is Git's safety net. It records every time HEAD moves - even after destructive operations like reset or rebase.

Unlike regular history, reflog entries expire (default 90 days) and are local-only. But within that window, you can recover almost anything.

Common recovery scenarios:
- Accidentally reset too far back
- Lost commits after a bad rebase
- Deleted a branch you still needed
- Amended a commit and want the original`,
      terminal: [
        "git reflog",
        "git reflog show feature-branch",
        "git checkout HEAD@{2}",
        "git branch recovered-work abc1234",
        "git reset --hard HEAD@{1}",
      ],
      tip: "Reflog entries use `HEAD@{n}` syntax. Lower numbers are more recent. `HEAD@{0}` is current HEAD.",
    },
    {
      stepNumber: 3,
      title: "Undoing Changes",
      body: `Git offers several ways to undo, each appropriate for different situations:

**git restore** - Discard working directory changes (Git 2.23+)
**git reset** - Move HEAD and optionally update staging/working directory
**git revert** - Create a new commit that undoes a previous one

Key distinction:
- **reset** rewrites history (use on unpushed commits)
- **revert** adds history (safe for pushed commits)`,
      terminal: [
        "git restore file.js",
        "git restore --staged file.js",
        "git reset HEAD~1",
        "git reset --hard HEAD~1",
        "git revert abc1234",
        "git revert HEAD~3..HEAD",
      ],
      tip: "`reset --soft` keeps changes staged, `--mixed` (default) unstages them, `--hard` discards everything.",
    },
    {
      stepNumber: 4,
      title: "Cherry-pick and Bisect",
      body: `**Cherry-pick** applies a specific commit from another branch without merging the whole branch. Useful for hotfixes or selectively porting features.

**Bisect** uses binary search to find which commit introduced a bug:
1. Mark a known good commit and bad commit
2. Git checks out the middle
3. You test and mark good/bad
4. Repeat until the culprit is found

Bisect can test hundreds of commits in just a few steps.`,
      terminal: [
        "git cherry-pick abc1234",
        "git cherry-pick abc1234 def5678",
        "git bisect start",
        "git bisect bad HEAD",
        "git bisect good v1.0.0",
        "git bisect reset",
      ],
      tip: "Automate bisect with `git bisect run ./test.sh` if you have a script that exits 0 for good, non-0 for bad.",
    },
  ],

  // Module: Branch Mastery & Management - Pro (PROG7313)
  [key("PROG7313")]: [
    {
      stepNumber: 1,
      title: "Branch protection in practice",
      body: `At scale, **branch protection** stops direct pushes to critical branches (\`main\`, \`release/*\`). Instead, work flows through PRs with required checks and reviews.

You still develop on **feature branches** locally; the policy layer lives on the hosting provider (GitHub/GitLab rules, required status checks, required reviewers).

Understand: what is **allowed** to merge, who can **approve**, and what **checks** must pass.`,
      terminal: [
        "gh api repos/:owner/:repo/branches/main/protection",
        "git branch -a",
        "git checkout -b policy/update-retention",
      ],
      tip: "Read your org's doc for exceptions - hotfixes sometimes use a controlled bypass with post-review.",
    },
    {
      stepNumber: 2,
      title: "Governance and conventions",
      body: `**Governance** means agreed rules: naming branches (\`feature/\`, \`fix/\`), commit message format, CODEOWNERS for review routing, and retention policies.

\`.github/CODEOWNERS\` maps paths to teams. \`CODEOWNERS\` + branch protection ensures the right people sign off.

Align local habits (branch names, small commits) with what automation enforces.`,
      terminal: [
        "cat .github/CODEOWNERS",
        "git log --oneline -5",
        "git show --stat HEAD",
      ],
      tip: "When policy changes, use a dedicated branch and PR so the change itself is reviewed like application code.",
    },
    {
      stepNumber: 3,
      title: "Releases and stability",
      body: `**Releases** tag points in history (\`v1.2.0\`) customers trust. Often \`main\` tracks ongoing work and release branches take hotfixes.

Tagging: \`git tag -a v1.2.0 -m \"...\"\` then push tags. Automation may build artifacts from tags.

Balance velocity on main with predictable release cadence and rollback plans.`,
      terminal: [
        "git tag -l 'v*'",
        "git tag -a v1.0.0 -m \"First GA\"",
        "git push origin v1.0.0",
      ],
      tip: "Document who can create tags and how release notes are generated - reduces Friday-night surprises.",
    },
  ],

  [key("PROG7314")]: [
    {
      stepNumber: 1,
      title: "Why interactive rebase",
      body: `**Interactive rebase** edits recent commit history: squash WIP commits, reword messages, or drop mistakes before code review.

In this app, \`git rebase -i HEAD~N\` performs a **squash** of the last N commits into one — enough to practice the workflow safely.`,
      terminal: ["git log --oneline -6"],
      tip: "Only rewrite branches you own and that are not yet merged to shared main.",
    },
    {
      stepNumber: 2,
      title: "Squash the noise",
      body: `Run \`git rebase -i HEAD~3\` when you have at least three commits to fold. The simulator produces a single squashed commit with a fresh message.

Afterwards, \`git log --oneline\` should show a shorter, clearer history.`,
      terminal: ["git rebase -i HEAD~3", "git log --oneline -3"],
      tip: "In real Git, an editor opens a todo list; here the squash is automatic for the drill.",
    },
    {
      stepNumber: 3,
      title: "Rebase vs merge",
      body: `**Rebase** replays commits on top of another tip for a linear story. **Merge** preserves a forked history with a merge commit.

Teams often rebase feature branches before merge; default branch policies may still use merge commits for the final integration.`,
      terminal: ["git status"],
      tip: "Ask your team: rebase-only, merge-only, or squash-merge on the server?",
    },
  ],

  [key("PROG7315")]: [
    {
      stepNumber: 1,
      title: "Enable rerere",
      body: `**Rerere** (reuse recorded resolution) stores how you resolved conflicts so Git can replay that resolution when the same conflict appears again.

Enable it once per machine: \`git config rerere.enabled true\`.`,
      terminal: ["git config rerere.enabled true"],
      tip: "Especially useful on long-lived branches that merge main often.",
    },
    {
      stepNumber: 2,
      title: "Merge another line of work",
      body: `When a feature branch diverged, merge it into your current branch: \`git merge feature-x\`.

The simulator fast-forwards or creates a merge commit depending on history shape.`,
      terminal: ["git merge feature-x"],
      tip: "If conflicts appear, resolve once — rerere remembers for next time.",
    },
  ],

  [key("PROG7316")]: [
    {
      stepNumber: 1,
      title: "What hooks do",
      body: `**Hooks** are scripts Git runs on events: commit, push, rebase. They catch style and test failures before CI.

This simulator exposes \`git hook install pre-commit\` as a stand-in for copying a real script into \`.git/hooks/\`.`,
      terminal: ["git hook install pre-commit"],
      tip: "Keep hooks fast — developers skip slow hooks.",
    },
    {
      stepNumber: 2,
      title: "Hooks and CI",
      body: `Hooks are **local** and can be bypassed. **CI** is authoritative. Use both: hooks for quick feedback, CI for guarantees.`,
      terminal: ["git status"],
      tip: "Tools like Husky help teams share hook setup in Node projects.",
    },
  ],

  [key("PROG7317")]: [
    {
      stepNumber: 1,
      title: "Submodule basics",
      body: `A **submodule** embeds another repository at a subdirectory, pinned to a commit.

Add: \`git submodule add <url> <path>\`. Clone consumers run \`git submodule update --init --recursive\`.`,
      terminal: [
        "git submodule add https://github.com/example/lib.git vendor/lib",
      ],
      tip: "Submodules are explicit dependencies — great for shared libraries, not for tiny snippets.",
    },
    {
      stepNumber: 2,
      title: "Alternatives",
      body: `**Subtree** merges external history into one repo without submodule pointers. **Monorepo** tools (Nx, Turborepo) coordinate many packages in one clone.

Choose based on release cadence and who owns the dependency.`,
      terminal: ["git submodule status"],
      tip: "Sparse checkout helps huge monorepos by checking out only some paths.",
    },
  ],

  [key("PROG7318")]: [
    {
      stepNumber: 1,
      title: "Secrets in Git",
      body: `If credentials are committed, assume they are compromised: **rotate** them first, then remove them from history.

The simulator models \`git filter-repo --force\` as a rewrite step — real installs use the filter-repo tool or BFG.`,
      terminal: ["git filter-repo --force"],
      tip: "Pre-commit secret scanners reduce recurrence.",
    },
    {
      stepNumber: 2,
      title: "Signed commits",
      body: `**GPG-signed commits** prove authorship on hosts that show “Verified”. Configure signing once per machine.

Combine with branch protection requiring signed commits for high-risk repos.`,
      terminal: ["git config --global user.signingkey"],
      tip: "Signing tags is common for release artifacts.",
    },
  ],

  [key("PROG7319")]: [
    {
      stepNumber: 1,
      title: "Object model",
      body: `Commits point to **trees**; trees reference **blobs** (file contents). \`git cat-file -p HEAD\` dumps the commit object.

You can also use \`git cat-file -t\` to print the type (commit, tree, blob).`,
      terminal: ["git cat-file -t HEAD", "git cat-file -p HEAD"],
      tip: "Shallow clones skip some objects — cat-file may not see everything offline.",
    },
    {
      stepNumber: 2,
      title: "fsck and health",
      body: `**git fsck** checks object connectivity and reports dangling objects. Use it when a repo behaves strangely after crashes or manual edits.

**git gc** packs objects and prunes stale data — usually automatic.`,
      terminal: ["git fsck"],
      tip: "Corruption is rare; fsck is the first diagnostic step.",
    },
  ],

  [key("PROG7320")]: [
    {
      stepNumber: 1,
      title: "Fork and clone mindset",
      body: `You work from a **fork** (\`origin\`) and track the **upstream** canonical repo. That split is how most OSS contributions flow.

Create a dedicated **feature branch** so \`main\` stays stable.`,
      terminal: ["git switch -c feature/oss-contribution"],
      tip: "Never commit directly to protected main in shared repos.",
    },
    {
      stepNumber: 2,
      title: "Wire upstream",
      body: `Add \`upstream\` with \`git remote add upstream <url>\`, then \`git fetch upstream\` to download new commits without merging yet.

Verify \`git remote -v\` shows both origin and upstream.`,
      terminal: ["git remote add upstream https://github.com/original/project.git", "git fetch upstream"],
      tip: "HTTPS vs SSH URLs must match how you authenticate.",
    },
    {
      stepNumber: 3,
      title: "Integrate and record",
      body: `Stage your edits (\`git add\`), commit with a message that reviewers will understand, then \`git push -u origin <branch>\` so the remote tracks your work for a PR.

Resolve conflicts when merging or rebasing onto updated main — same skills as the Intermediate track.`,
      terminal: [
        "git add CONTRIBUTING.md",
        'git commit -m "Add contribution"',
        "git push -u origin feature/oss-contribution",
      ],
      tip: "Open the PR only after tests pass locally or CI is green.",
    },
    {
      stepNumber: 4,
      title: "What you combined",
      body: `This flow used: **branches** (Foundations), **remotes & fetch** (Foundations + Intermediate), **merge conflicts** mindset (Intermediate), **PR discipline** (Intermediate), and **Pro** topics like tagging and hooks where your team applies them.

You are ready to contribute confidently to real projects.`,
      terminal: ["git log --oneline -5"],
      tip: "Keep a personal checklist: branch → sync → test → push → PR.",
    },
  ],
};

export function getStepsForModule(moduleId: string): LessonStep[] | null {
  return stepsRegistry[key(moduleId)] ?? null;
}

export function getStep(moduleId: string, stepNumber: number): LessonStep | null {
  const steps = getStepsForModule(moduleId);
  if (!steps) return null;
  return steps.find((s) => s.stepNumber === stepNumber) ?? null;
}

export function getTotalSteps(moduleId: string): number {
  return stepsRegistry[key(moduleId)]?.length ?? 0;
}

export function hasSteps(moduleId: string): boolean {
  return Boolean(stepsRegistry[key(moduleId)]?.length);
}
