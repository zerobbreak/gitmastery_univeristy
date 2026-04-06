"use client";

import {
  ChevronRight,
  ExternalLink,
  FileCode,
  Folder,
  GitBranch,
  MessageSquare,
  RotateCcw,
  Terminal as TerminalIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ChallengeGitStatusPanel } from "@/components/ChallengeGitStatusPanel";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGitTerminalSession, type GitTerminalLine } from "@/hooks/useGitTerminalSession";
import type { GitHubRepoRow } from "@/lib/github-repo-types";
import { createRepoSandboxGitState } from "@/lib/repo-sandbox-bootstrap";
import {
  hasConflictMarkers,
  syncFileStatesFromWorkingTree,
  type GitSimState,
} from "@/lib/git-emulator";

export function RepoSandboxView({ repo }: { repo: GitHubRepoRow }) {
  const welcomeLines = useMemo(
    () => [
      "# Git practice sandbox (simulator)",
      `# Repo: ${repo.full_name}`,
      "# Commands run in-browser — not on your real machine or GitHub.",
      "# Type `tutor` or `tutor <question>` for AI help (same as challenges).",
    ],
    [repo.full_name],
  );

  const initialGitState = useMemo(
    () =>
      createRepoSandboxGitState({
        full_name: repo.full_name,
        html_url: repo.html_url,
        default_branch: repo.default_branch,
      }),
    [repo.full_name, repo.html_url, repo.default_branch],
  );

  const {
    gitState,
    setGitState,
    lines,
    input,
    setInput,
    handleInputChange,
    handleKeyDown,
    onSubmitInput,
    terminalScrollRootRef,
    terminalInputRef,
    branchDisplay,
    modifiedCount,
    showSuggestions,
    suggestions,
    selectedSuggestion,
    setShowSuggestions,
    resetTerminal,
  } = useGitTerminalSession({
    sessionKey: repo.id,
    initialGitState,
    welcomeLines,
  });

  const [activeTab, setActiveTab] = useState<"terminal" | "files" | "status">("terminal");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const fileTree = useMemo(() => {
    if (gitState.fileContents && Object.keys(gitState.fileContents).length > 0) {
      return Object.keys(gitState.fileContents).map((name) => ({
        name,
        active: name === selectedFile,
      }));
    }
    return [];
  }, [gitState.fileContents, selectedFile]);

  const handleFileContentChange = useCallback(
    (filename: string, newContent: string) => {
      setGitState((prev) => {
        if (!prev.fileContents) return prev;
        const next: GitSimState = {
          ...prev,
          workingTree: { ...prev.workingTree, [filename]: newContent },
        };
        syncFileStatesFromWorkingTree(next);
        return next;
      });
    },
    [setGitState],
  );

  useEffect(() => {
    if (!selectedFile && fileTree.length > 0) {
      setSelectedFile(fileTree[0]!.name);
    }
  }, [fileTree, selectedFile]);

  const isEditable = Boolean(gitState.fileContents && Object.keys(gitState.fileContents).length > 0);

  function fileStateForName(name: string) {
    return gitState.files[name];
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <AppHeader />

      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="flex w-full flex-col border-b border-border/30 lg:w-[380px] lg:min-w-[320px] lg:max-w-[440px] lg:border-b-0 lg:border-r lg:shrink-0">
          <div className="shrink-0 border-b border-border/30 bg-background px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link href="/repos" className="hover:text-foreground transition-colors font-medium">
                Repositories
              </Link>
              <ChevronRight size={12} className="opacity-40 shrink-0" />
              <span className="text-foreground font-medium line-clamp-2">Practice</span>
            </div>
          </div>
          <ScrollArea className="min-h-0 flex-1 max-h-[40vh] lg:max-h-none">
            <div className="space-y-5 p-5">
              <div>
                <h1 className="text-lg font-semibold tracking-tight">{repo.name}</h1>
                <p className="mt-1 font-mono text-xs text-muted-foreground truncate">{repo.full_name}</p>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This is the <strong className="text-foreground/90">same simulator</strong> as module challenges.
                <code className="mx-1 rounded bg-secondary px-1 py-0.5 text-[11px]">origin</code>
                is preset to your GitHub URL so <code className="text-[11px]">git remote -v</code> matches — but
                nothing is pushed to GitHub from here.
              </p>
              <a
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                Open on GitHub
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" size="sm" className="w-full sm:flex-1" onClick={resetTerminal}>
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Reset sandbox
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full sm:flex-1"
                  onClick={() => {
                    setActiveTab("terminal");
                    setInput("tutor ");
                    requestAnimationFrame(() => terminalInputRef.current?.focus());
                  }}
                >
                  <MessageSquare className="mr-2 h-3.5 w-3.5" />
                  AI tutor
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden lg:min-h-0">
          <div className="flex shrink-0 items-center border-b border-border/30 bg-card">
            <button
              type="button"
              onClick={() => setActiveTab("terminal")}
              className={`lc-tab flex items-center gap-1.5 ${activeTab === "terminal" ? "lc-tab-active" : ""}`}
            >
              <TerminalIcon size={13} />
              Terminal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("files")}
              className={`lc-tab flex items-center gap-1.5 ${activeTab === "files" ? "lc-tab-active" : ""}`}
            >
              <FileCode size={13} />
              Files
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("status")}
              className={`lc-tab flex items-center gap-1.5 ${activeTab === "status" ? "lc-tab-active" : ""}`}
            >
              <GitBranch size={13} />
              Git Status
            </button>
            <div className="ml-auto flex items-center gap-3 px-4 text-[11px] text-muted-foreground">
              <span className="font-mono">{branchDisplay}</span>
              <span className="text-medium font-mono">{modifiedCount}M</span>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="hidden w-36 shrink-0 overflow-y-auto border-r border-border/20 bg-card/50 p-3 md:block">
              <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Explorer
              </h4>
              <ul className="space-y-0.5 text-[11px]">
                <li className="flex items-center gap-1.5 text-muted-foreground py-0.5">
                  <ChevronRight size={11} className="shrink-0" />
                  <Folder size={11} className="shrink-0 opacity-60" />
                  <span>project</span>
                </li>
                {fileTree.map((file) => {
                  const st = fileStateForName(file.name);
                  const isActive = file.active;
                  const isModified = st === "modified" || st === "staged";
                  return (
                    <li key={file.name}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(file.name);
                          setActiveTab("files");
                        }}
                        className={`w-full flex items-center gap-1.5 pl-5 py-0.5 rounded-sm text-left transition-colors hover:bg-white/5 ${
                          isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                        } ${isModified && !isActive ? "text-medium" : ""}`}
                      >
                        <FileCode size={11} className="shrink-0 opacity-60" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            <div
              className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
                activeTab === "terminal" ? "bg-[#0a0a0a]" : "terminal-bg"
              }`}
            >
              {activeTab === "terminal" && (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
                  <div
                    className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/8 bg-[#0c0c0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.55)]"
                    onClick={() => terminalInputRef.current?.focus()}
                    role="presentation"
                  >
                    <div className="flex shrink-0 select-none items-center gap-2 rounded-t-[7px] border-b border-white/6 bg-[#2d2d2d] px-3 py-1.5">
                      <span className="flex gap-1.5" aria-hidden>
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                      </span>
                      <span className="flex-1 text-center font-mono text-[11px] text-[#b4b4b4] truncate px-1">
                        {repo.full_name} — bash
                      </span>
                      <span className="w-12 shrink-0" aria-hidden />
                    </div>

                    <div ref={terminalScrollRootRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <ScrollArea className="h-full min-h-0 flex-1">
                        <div className="space-y-1.5 p-3 pb-2 font-mono text-[12px] leading-relaxed sm:p-4 sm:pb-3">
                          {lines.map((row, i) => renderTerminalLine(row, i, branchDisplay))}
                        </div>
                      </ScrollArea>
                    </div>

                    <div className="shrink-0 border-t border-white/6 bg-[#010409] px-3 py-2.5 sm:px-4">
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 font-mono text-[12px] leading-none">
                        <span className="text-[#58a6ff]">student@gitmastery</span>
                        <span className="text-[#6e7681]">:</span>
                        <span className="text-[#3fb950]">~/project</span>
                        <span className="text-[#d2a8ff]">({branchDisplay})</span>
                        <span className="text-[#6e7681]">$</span>
                        <div className="relative min-w-48 flex-1">
                          <input
                            ref={terminalInputRef}
                            type="text"
                            value={input}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            className="w-full bg-transparent text-[#e6edf3] outline-none placeholder:text-[#484f58] font-mono caret-[#58a6ff]"
                            placeholder="git status — or tutor for help"
                            spellCheck={false}
                            autoCapitalize="off"
                            autoCorrect="off"
                            aria-label="Terminal input"
                          />
                          {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute bottom-full left-0 mb-1 w-48 max-h-32 overflow-y-auto rounded border border-white/10 bg-[#1c1c1c] shadow-lg">
                              {suggestions.map((suggestion, si) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  className={`w-full px-2 py-1 text-left text-[11px] ${
                                    si === selectedSuggestion
                                      ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                                      : "text-[#8b949e] hover:bg-white/5"
                                  }`}
                                  onMouseDown={() => {
                                    const parts = input.trim().split(/\s+/);
                                    parts[parts.length - 1] = suggestion;
                                    setInput(parts.join(" ") + " ");
                                    setShowSuggestions(false);
                                    terminalInputRef.current?.focus();
                                  }}
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "files" && isEditable && selectedFile && (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <div className="shrink-0 flex items-center justify-between border-b border-border/30 bg-card/50 px-4 py-2">
                    <div className="flex items-center gap-2">
                      <FileCode size={13} className="text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground">{selectedFile}</span>
                      {gitState.fileContents?.[selectedFile] &&
                        hasConflictMarkers(gitState.fileContents[selectedFile]!) && (
                          <span className="text-[10px] text-destructive">conflicts</span>
                        )}
                    </div>
                  </div>
                  <div className="relative flex-1 min-h-0 overflow-hidden">
                    <textarea
                      value={gitState.fileContents?.[selectedFile] ?? ""}
                      onChange={(e) => handleFileContentChange(selectedFile, e.target.value)}
                      className="absolute inset-0 w-full h-full resize-none bg-[#0d1117] p-4 font-mono text-[12px] leading-relaxed text-[#e6edf3] focus:outline-none focus:ring-1 focus:ring-primary/30 selection:bg-primary/30"
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      aria-label={`Edit ${selectedFile}`}
                    />
                  </div>
                </div>
              )}

              {activeTab === "files" && !isEditable && (
                <div className="p-4 text-sm text-muted-foreground">No files in this sandbox.</div>
              )}

              {activeTab === "status" && (
                <ChallengeGitStatusPanel
                  gitState={gitState}
                  scenarioOverride={{
                    headline: `Workspace · ${repo.full_name}`,
                    summary:
                      "Browser simulator — not your live repo. origin is preset to your GitHub URL. Pushes do not reach GitHub.",
                    emphasizeRemotes: true,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderTerminalLine(row: GitTerminalLine, i: number, branchDisplay: string) {
  if (row.kind === "welcome") {
    return (
      <div key={i} className="space-y-0.5 border-b border-white/4 pb-3 mb-1">
        {row.lines.map((l, li) => (
          <div
            key={`w-${i}-${li}`}
            className={l.startsWith("#") ? "text-[#6e7681]" : "text-[#8b949e]"}
          >
            {l}
          </div>
        ))}
      </div>
    );
  }
  if (row.kind === "cmd") {
    return (
      <div key={i} className="flex flex-wrap items-baseline gap-x-1 gap-y-0.5">
        <span className="text-[#58a6ff]">student@gitmastery</span>
        <span className="text-[#6e7681]">:</span>
        <span className="text-[#3fb950]">~/project</span>
        <span className="text-[#d2a8ff]">({branchDisplay})</span>
        <span className="text-[#6e7681]">$</span>
        <span className="text-[#e6edf3]">{row.text}</span>
      </div>
    );
  }
  if (row.kind === "err") {
    return (
      <div key={i} className="text-[#f85149]">
        {row.text}
      </div>
    );
  }
  if (row.kind === "tutor") {
    return (
      <div
        key={i}
        className="rounded-md border border-[#1f6feb]/35 bg-[#1f6feb]/8 py-2 pl-3 pr-2 text-[11px] leading-relaxed"
      >
        <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#58a6ff]">
          Tutor {row.loading ? "..." : ""}
        </div>
        <div className={`whitespace-pre-wrap ${row.loading ? "animate-pulse text-[#6e7681]" : "text-[#c9d1d9]"}`}>
          {row.lines.join("\n")}
        </div>
      </div>
    );
  }
  return (
    <div key={i} className="whitespace-pre-wrap text-[#6e7681]">
      {row.lines.join("\n")}
    </div>
  );
}
