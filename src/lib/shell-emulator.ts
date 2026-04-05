/** Shell emulator for non-git commands in the challenge terminal. */

import type { GitSimState } from "./git-emulator";

export interface ShellCommandResult {
  state: GitSimState;
  outputLines: string[];
  clearTerminal?: boolean;
}

const SHELL_COMMANDS = ["ls", "cat", "touch", "mkdir", "rm", "pwd", "echo", "clear", "cd", "help"] as const;
type ShellCommand = (typeof SHELL_COMMANDS)[number];

export function isShellCommand(input: string): boolean {
  const cmd = input.trim().split(/\s+/)[0]?.toLowerCase();
  return SHELL_COMMANDS.includes(cmd as ShellCommand);
}

export function runShellCommand(
  prev: GitSimState,
  rawInput: string,
): ShellCommandResult {
  const input = rawInput.trim();
  if (!input) {
    return { state: prev, outputLines: [] };
  }

  const parts = input.split(/\s+/).filter(Boolean);
  const cmd = parts[0]?.toLowerCase() as ShellCommand;

  const state = { ...prev };

  switch (cmd) {
    case "ls":
      return handleLs(state, parts);
    case "cat":
      return handleCat(state, parts);
    case "touch":
      return handleTouch(state, parts);
    case "mkdir":
      return handleMkdir(state, parts);
    case "rm":
      return handleRm(state, parts);
    case "pwd":
      return handlePwd(state);
    case "echo":
      return handleEcho(state, rawInput);
    case "clear":
      return { state, outputLines: [], clearTerminal: true };
    case "cd":
      return handleCd(state, parts);
    case "help":
      return handleHelp(state);
    default:
      return {
        state: prev,
        outputLines: [`${cmd}: command not found`],
      };
  }
}

function handleLs(state: GitSimState, parts: string[]): ShellCommandResult {
  const showAll = parts.includes("-a") || parts.includes("-la") || parts.includes("-al");
  const longFormat = parts.includes("-l") || parts.includes("-la") || parts.includes("-al");

  const files = Object.keys(state.workingTree).sort();
  const untracked = state.untrackedFiles ?? [];
  const allFiles = [...new Set([...files, ...untracked])].sort();

  if (allFiles.length === 0) {
    return { state, outputLines: [] };
  }

  const lines: string[] = [];

  if (longFormat) {
    lines.push(`total ${allFiles.length}`);
    
    if (showAll) {
      lines.push("drwxr-xr-x  2 student student 4096 Apr  5 12:00 .");
      lines.push("drwxr-xr-x  3 student student 4096 Apr  5 12:00 ..");
      lines.push("drwxr-xr-x  8 student student 4096 Apr  5 12:00 .git");
    }

    for (const file of allFiles) {
      const fileState = state.files[file];
      const content = state.workingTree[file] ?? "";
      const size = content.length.toString().padStart(5, " ");
      
      let statusIndicator = "";
      if (fileState === "modified") statusIndicator = " [M]";
      else if (fileState === "staged") statusIndicator = " [S]";
      else if (fileState === "untracked") statusIndicator = " [?]";
      
      lines.push(`-rw-r--r--  1 student student ${size} Apr  5 12:00 ${file}${statusIndicator}`);
    }
  } else {
    const output: string[] = [];
    if (showAll) {
      output.push(".", "..", ".git");
    }
    output.push(...allFiles);
    
    const maxLen = Math.max(...output.map((f) => f.length));
    const cols = Math.max(1, Math.floor(80 / (maxLen + 2)));
    
    for (let i = 0; i < output.length; i += cols) {
      const row = output.slice(i, i + cols);
      lines.push(row.map((f) => f.padEnd(maxLen + 2)).join(""));
    }
  }

  return { state, outputLines: lines };
}

function handleCat(state: GitSimState, parts: string[]): ShellCommandResult {
  const filename = parts[1];
  if (!filename) {
    return { state, outputLines: ["cat: missing operand"] };
  }

  const content = state.workingTree[filename];
  if (content === undefined) {
    return { state, outputLines: [`cat: ${filename}: No such file or directory`] };
  }

  const lines = content.split("\n");
  return { state, outputLines: lines };
}

function handleTouch(state: GitSimState, parts: string[]): ShellCommandResult {
  const filename = parts[1];
  if (!filename) {
    return { state, outputLines: ["touch: missing file operand"] };
  }

  if (filename in state.workingTree) {
    return { state, outputLines: [] };
  }

  const newState: GitSimState = {
    ...state,
    workingTree: { ...state.workingTree, [filename]: "" },
    untrackedFiles: [...(state.untrackedFiles ?? []), filename],
    files: { ...state.files, [filename]: "untracked" },
    fileContents: { ...state.fileContents, [filename]: "" },
  };

  return { state: newState, outputLines: [] };
}

function handleMkdir(state: GitSimState, parts: string[]): ShellCommandResult {
  const dirname = parts[1];
  if (!dirname) {
    return { state, outputLines: ["mkdir: missing operand"] };
  }

  return { state, outputLines: [] };
}

function handleRm(state: GitSimState, parts: string[]): ShellCommandResult {
  const filename = parts.find((p, i) => i > 0 && !p.startsWith("-"));
  if (!filename) {
    return { state, outputLines: ["rm: missing operand"] };
  }

  if (!(filename in state.workingTree) && !state.untrackedFiles?.includes(filename)) {
    return { state, outputLines: [`rm: cannot remove '${filename}': No such file or directory`] };
  }

  const newWorkingTree = { ...state.workingTree };
  delete newWorkingTree[filename];

  const wasTracked = filename in state.index || 
    (state.commits[state.refs[state.HEAD]]?.tree[filename] !== undefined);

  const newState: GitSimState = {
    ...state,
    workingTree: newWorkingTree,
    untrackedFiles: (state.untrackedFiles ?? []).filter((f) => f !== filename),
    deletedFiles: wasTracked 
      ? [...(state.deletedFiles ?? []), filename]
      : state.deletedFiles,
    files: { ...state.files },
    fileContents: { ...state.fileContents },
  };

  if (wasTracked) {
    newState.files[filename] = "deleted";
  } else {
    delete newState.files[filename];
  }
  delete newState.fileContents![filename];

  return { state: newState, outputLines: [] };
}

function handlePwd(state: GitSimState): ShellCommandResult {
  return { state, outputLines: ["/home/student/project"] };
}

function handleEcho(state: GitSimState, rawInput: string): ShellCommandResult {
  const redirectMatch = rawInput.match(/echo\s+(.+?)\s*>>\s*(\S+)/);
  const overwriteMatch = rawInput.match(/echo\s+(.+?)\s*>\s*(\S+)/);

  if (redirectMatch) {
    const content = stripQuotes(redirectMatch[1].trim());
    const filename = redirectMatch[2];
    
    const existingContent = state.workingTree[filename] ?? "";
    const newContent = existingContent + (existingContent ? "\n" : "") + content;
    
    return updateFileContent(state, filename, newContent);
  }

  if (overwriteMatch) {
    const content = stripQuotes(overwriteMatch[1].trim());
    const filename = overwriteMatch[2];
    
    return updateFileContent(state, filename, content);
  }

  const echoMatch = rawInput.match(/echo\s+(.+)/i);
  if (echoMatch) {
    const content = stripQuotes(echoMatch[1].trim());
    return { state, outputLines: [content] };
  }

  return { state, outputLines: [""] };
}

function updateFileContent(
  state: GitSimState,
  filename: string,
  content: string,
): ShellCommandResult {
  const isNew = !(filename in state.workingTree) && !state.untrackedFiles?.includes(filename);
  
  const newState: GitSimState = {
    ...state,
    workingTree: { ...state.workingTree, [filename]: content },
    fileContents: { ...state.fileContents, [filename]: content },
  };

  if (isNew) {
    newState.untrackedFiles = [...(state.untrackedFiles ?? []), filename];
    newState.files = { ...state.files, [filename]: "untracked" };
  } else {
    const headCommit = state.commits[state.refs[state.HEAD]];
    const headTree = headCommit?.tree ?? {};
    const indexContent = state.index[filename];
    
    if (content !== indexContent && content !== headTree[filename]) {
      newState.files = { ...state.files, [filename]: "modified" };
    } else if (content === headTree[filename] && content === indexContent) {
      newState.files = { ...state.files, [filename]: "clean" };
    }
  }

  return { state: newState, outputLines: [] };
}

function handleCd(state: GitSimState, parts: string[]): ShellCommandResult {
  const dir = parts[1];
  if (!dir || dir === "~" || dir === "/home/student/project") {
    return { state, outputLines: [] };
  }
  if (dir === "..") {
    return { state, outputLines: [] };
  }
  return { state, outputLines: [`cd: ${dir}: No such file or directory`] };
}

function handleHelp(state: GitSimState): ShellCommandResult {
  const lines = [
    "Available commands:",
    "",
    "  Git commands:",
    "    git status          Show working tree status",
    "    git add <file>      Add file to staging area",
    "    git commit -m 'msg' Create a commit",
    "    git branch          List branches",
    "    git checkout -b     Create and switch branch",
    "    git switch -c       Create and switch branch",
    "    git log             Show commit history",
    "    git diff            Show changes",
    "    git merge <branch>  Merge a branch",
    "    git reset           Reset HEAD",
    "    git restore         Restore files",
    "    git stash           Stash changes",
    "    git push            Push to remote",
    "    git fetch           Fetch from remote",
    "    git remote          Manage remotes",
    "    git reflog          Show reflog",
    "    git show            Show commit details",
    "    git revert          Revert a commit",
    "    git cherry-pick     Cherry-pick a commit",
    "",
    "  Shell commands:",
    "    ls [-la]            List files",
    "    cat <file>          Display file contents",
    "    touch <file>        Create empty file",
    "    rm <file>           Remove file",
    "    echo 'text' > file  Write to file",
    "    pwd                 Print working directory",
    "    clear               Clear terminal",
    "    help                Show this help",
    "",
    "  AI Tutor:",
    "    tutor <question>    Ask the AI tutor for help",
  ];
  return { state, outputLines: lines };
}

function stripQuotes(s: string): string {
  const t = s.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

export function getAutocompleteSuggestions(
  input: string,
  state: GitSimState,
): string[] {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const partial = parts[parts.length - 1] ?? "";

  if (parts.length === 1) {
    const allCommands = ["git", ...SHELL_COMMANDS];
    return allCommands.filter((c) => c.startsWith(partial.toLowerCase()));
  }

  if (cmd === "git" && parts.length === 2) {
    const gitSubcommands = [
      "status", "add", "commit", "branch", "checkout", "switch",
      "log", "diff", "merge", "reset", "restore", "stash", "push",
      "fetch", "remote", "reflog", "show", "revert", "cherry-pick",
    ];
    return gitSubcommands.filter((c) => c.startsWith(partial.toLowerCase()));
  }

  const fileCommands = ["cat", "touch", "rm", "echo"];
  const gitFileCommands = ["add", "restore", "diff"];

  if (fileCommands.includes(cmd) || 
      (cmd === "git" && gitFileCommands.includes(parts[1]?.toLowerCase()))) {
    const files = [
      ...Object.keys(state.workingTree),
      ...(state.untrackedFiles ?? []),
    ];
    return files.filter((f) => f.startsWith(partial));
  }

  if (cmd === "git" && ["checkout", "switch", "merge", "branch"].includes(parts[1]?.toLowerCase())) {
    const branches = Object.keys(state.refs);
    return branches.filter((b) => b.startsWith(partial));
  }

  return [];
}

export function getCommandHistory(): string[] {
  return [];
}
