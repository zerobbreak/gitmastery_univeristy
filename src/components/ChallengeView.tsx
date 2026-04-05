"use client";

import {
  CheckCircle2,
  Circle,
  FileCode,
  GitBranch,
  ListChecks,
  Send,
  Terminal as TerminalIcon,
  MessageSquare,
  ChevronRight,
  Folder,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChallengeGitStatusPanel } from "@/components/ChallengeGitStatusPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGitBootstrapForChallenge } from "@/lib/challenge-git-bootstrap";
import {
  createInitialGitState,
  hasConflictMarkers,
  runGitCommand,
  statusBarModifiedCount,
  syncFileStatesFromWorkingTree,
  type GitSimState,
} from "@/lib/git-emulator";
import {
  isShellCommand,
  runShellCommand,
  getAutocompleteSuggestions,
} from "@/lib/shell-emulator";
import {
  getInitialModifiedFromLesson,
  hintForObjectiveIncomplete,
  objectiveDone,
  staticObjectiveHint,
} from "@/lib/challenge-validation";
import { fetchWithAuth } from "@/lib/api";
import { extractRecentGitCommands, isTutorCommand } from "@/lib/git-tutor";
import {
  TRACKS,
  getNextHrefAfterChallengesInModule,
  lessonPath,
  trackPath,
  type ChallengeDef,
  type TrackId,
} from "@/lib/module-routes";
import { type LessonContent } from "@/lib/module-lesson-content";

type TerminalLine =
  | { kind: "welcome"; lines: string[] }
  | { kind: "cmd"; text: string }
  | { kind: "out"; lines: string[] }
  | { kind: "tutor"; lines: string[]; loading?: boolean }
  | { kind: "err"; text: string }
  /** Shown when the first objective is satisfied (proportional XP share). */
  | { kind: "xp_notice"; xp: number }
  | {
      kind: "check";
      results: { ok: boolean; text: string; hint: string }[];
    };

function DifficultyBadge({ level }: { level: string }) {
  const n = level.toLowerCase();
  const cls =
    n === "easy" ? "text-easy bg-easy/10"
    : n === "medium" ? "text-medium bg-medium/10"
    : n === "hard" ? "text-hard bg-hard/10"
    : "text-muted-foreground bg-muted/50";
  return <span className={`lc-badge ${cls}`}>{level}</span>;
}

export function ChallengeView({
  trackId,
  lessonSlug,
  lessonTitle,
  challenge,
  lessonContent,
  challengeSlugsOrdered,
  isAlreadyCompleted = false,
}: {
  trackId: TrackId;
  lessonSlug: string;
  /** Display name for breadcrumbs (matches module lesson title). */
  lessonTitle: string;
  challenge: ChallengeDef;
  lessonContent: LessonContent;
  /** Same order as DB (for in-module next URL when API omits nextHref). */
  challengeSlugsOrdered: string[];
  /** True if the user has already completed this challenge. */
  isAlreadyCompleted?: boolean;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const initialModified = useMemo(
    () => getInitialModifiedFromLesson(lessonContent),
    [lessonContent],
  );
  const gitBootstrap = useMemo(() => getGitBootstrapForChallenge(challenge), [challenge.id]);

  const [gitState, setGitState] = useState<GitSimState>(() =>
    createInitialGitState({ modifiedPaths: initialModified, ...gitBootstrap }),
  );
  const gitRef = useRef(gitState);
  gitRef.current = gitState;

  const welcomeBlock = useMemo(
    () => ({
      kind: "welcome" as const,
      lines: [
        "# Initializing GitMastery environment...",
        `# Challenge: ${challenge.title}`,
        "# Type commands below. Use 'tutor' for AI help.",
      ],
    }),
    [challenge.title],
  );

  const [lines, setLines] = useState<TerminalLine[]>(() => [welcomeBlock]);
  const [input, setInput] = useState("");
  const [stickyObjectiveIds, setStickyObjectiveIds] = useState(() => new Set<string>());
  const firstObjectiveXpShownRef = useRef(false);
  
  // Command history state
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState("");
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  useEffect(() => {
    const initial = createInitialGitState({ modifiedPaths: initialModified, ...gitBootstrap });
    gitRef.current = initial;
    setGitState(initial);
    setLines([welcomeBlock]);
    setInput("");
    setStickyObjectiveIds(new Set());
    firstObjectiveXpShownRef.current = false;
    setCommandHistory([]);
    setHistoryIndex(-1);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [challenge.id, initialModified, welcomeBlock, gitBootstrap]);

  useEffect(() => {
    setStickyObjectiveIds((prev) => {
      const next = new Set(prev);
      let added = false;
      for (const obj of challenge.objectives) {
        if (objectiveDone(obj.text, gitState, initialModified) && !next.has(obj.id)) {
          next.add(obj.id);
          added = true;
        }
      }
      return added ? next : prev;
    });
  }, [challenge.objectives, gitState, initialModified]);

  const terminalScrollRootRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = terminalScrollRootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const [activeTab, setActiveTab] = useState<"terminal" | "files" | "status">("terminal");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitBanner, setSubmitBanner] = useState<{
    xpAwarded: number;
    totalXp: number;
    alreadyCompleted: boolean;
  } | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const runTutorAsync = useCallback(
    async (trimmed: string, recentCommands: string[]) => {
      setLines((prev) => [
        ...prev,
        { kind: "cmd", text: trimmed },
        { kind: "tutor", lines: ["Asking tutor..."], loading: true },
      ]);
      try {
        const res = await fetchWithAuth("/api/tutor", getToken, {
          method: "POST",
          body: JSON.stringify({ line: trimmed, recentCommands }),
        });
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as {
          lines: string[];
          source?: string;
          hint?: string;
        };
        const out = [...(json.lines ?? [])];
        if (json.hint) out.push("", json.hint);
        setLines((prev) => {
          const next = [...prev];
          for (let j = next.length - 1; j >= 0; j--) {
            const row = next[j];
            if (row.kind === "tutor" && row.loading) {
              next[j] = { kind: "tutor", lines: out.length ? out : ["(empty response)"] };
              break;
            }
          }
          return next;
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Could not reach tutor.";
        setLines((prev) => {
          const next = [...prev];
          for (let j = next.length - 1; j >= 0; j--) {
            const row = next[j];
            if (row.kind === "tutor" && row.loading) {
              next[j] = {
                kind: "tutor",
                lines: [msg, "", "Sign in and ensure GEMINI_API_KEY is set for dynamic help."],
              };
              break;
            }
          }
          return next;
        });
      }
    },
    [getToken],
  );

  const runLine = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      // Add to command history
      setCommandHistory((prev) => {
        const filtered = prev.filter((cmd) => cmd !== trimmed);
        return [trimmed, ...filtered].slice(0, 50);
      });
      setHistoryIndex(-1);
      setSavedInput("");

      if (isTutorCommand(trimmed)) {
        const cmdTexts = lines
          .filter((row): row is { kind: "cmd"; text: string } => row.kind === "cmd")
          .map((row) => row.text);
        const recentCommands = extractRecentGitCommands(cmdTexts);
        void runTutorAsync(trimmed, recentCommands);
        return;
      }

      // Check if it's a shell command
      if (isShellCommand(trimmed)) {
        const result = runShellCommand(gitRef.current, trimmed);
        gitRef.current = result.state;
        setGitState(result.state);
        
        if (result.clearTerminal) {
          setLines([welcomeBlock]);
          return;
        }
        
        setLines((prev) => {
          const next: TerminalLine[] = [...prev, { kind: "cmd", text: trimmed }];
          if (result.outputLines.length > 0) next.push({ kind: "out", lines: result.outputLines });
          return next;
        });
        return;
      }

      const { state, outputLines } = runGitCommand(gitRef.current, trimmed);
      gitRef.current = state;
      setGitState(state);
      setLines((prev) => {
        const next: TerminalLine[] = [...prev, { kind: "cmd", text: trimmed }];
        if (outputLines.length > 0) next.push({ kind: "out", lines: outputLines });
        return next;
      });
    },
    [runTutorAsync, lines, welcomeBlock],
  );

  const onSubmitInput = () => {
    const v = input;
    setInput("");
    setShowSuggestions(false);
    runLine(v);
  };

  const handleInputChange = (value: string) => {
    setInput(value);
    setHistoryIndex(-1);
    
    // Update autocomplete suggestions
    if (value.trim()) {
      const newSuggestions = getAutocompleteSuggestions(value, gitRef.current);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab completion
    if (e.key === "Tab") {
      e.preventDefault();
      if (suggestions.length > 0) {
        const parts = input.trim().split(/\s+/);
        parts[parts.length - 1] = suggestions[selectedSuggestion];
        setInput(parts.join(" ") + " ");
        setShowSuggestions(false);
      }
      return;
    }

    // Autocomplete navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestion((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === "ArrowUp" && selectedSuggestion > 0) {
        e.preventDefault();
        setSelectedSuggestion((prev) => prev - 1);
        return;
      }
    }

    // Command history navigation
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      
      if (historyIndex === -1) {
        setSavedInput(input);
        setHistoryIndex(0);
        setInput(commandHistory[0]);
      } else if (historyIndex < commandHistory.length - 1) {
        setHistoryIndex((prev) => prev + 1);
        setInput(commandHistory[historyIndex + 1]);
      }
      setShowSuggestions(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      
      if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput(savedInput);
      } else {
        setHistoryIndex((prev) => prev - 1);
        setInput(commandHistory[historyIndex - 1]);
      }
      setShowSuggestions(false);
      return;
    }

    // Submit on Enter
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmitInput();
      return;
    }

    // Close suggestions on Escape
    if (e.key === "Escape") {
      setShowSuggestions(false);
      return;
    }
  };

  const branchDisplay = gitState.branch;
  const modifiedCount = statusBarModifiedCount(gitState);

  const objectivesState = useMemo(
    () =>
      challenge.objectives.map((obj) => ({
        ...obj,
        completed:
          stickyObjectiveIds.has(obj.id) ||
          objectiveDone(obj.text, gitState, initialModified),
      })),
    [challenge.objectives, gitState, initialModified, stickyObjectiveIds],
  );

  const allObjectivesLive = useMemo(
    () =>
      challenge.objectives.every((obj) =>
        objectiveDone(obj.text, gitState, initialModified),
      ),
    [challenge.objectives, gitState, initialModified],
  );

  const allObjectivesComplete = allObjectivesLive;

  const handleRunChecks = useCallback(() => {
    setActiveTab("terminal");
    const results = challenge.objectives.map((obj) => {
      const live = objectiveDone(obj.text, gitState, initialModified);
      return {
        ok: live,
        text: obj.text,
        hint: live ? "" : hintForObjectiveIncomplete(obj.text, gitState, initialModified),
      };
    });
    setLines((prev) => [...prev, { kind: "check", results }]);
    requestAnimationFrame(() => terminalInputRef.current?.focus());
  }, [challenge.objectives, gitState, initialModified]);

  const handleSubmitSolution = useCallback(async () => {
    if (!allObjectivesComplete || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/challenges/submit", getToken, {
        method: "POST",
        body: JSON.stringify({ challengeId: challenge.id, gitState }),
      });
      const data = (await res.json()) as {
        error?: string;
        xpAwarded?: number;
        totalXp?: number;
        alreadyCompleted?: boolean;
        nextHref?: string;
      };
      if (!res.ok) {
        setSubmitError(data.error ?? `Submit failed (${res.status})`);
        return;
      }
      setSubmitBanner({
        xpAwarded: data.xpAwarded ?? 0,
        totalXp: data.totalXp ?? 0,
        alreadyCompleted: Boolean(data.alreadyCompleted),
      });
      router.refresh();
      const nextHref =
        typeof data.nextHref === "string" && data.nextHref.length > 0
          ? data.nextHref
          : getNextHrefAfterChallengesInModule(
              trackId,
              lessonSlug,
              challenge.slug,
              challengeSlugsOrdered,
            );
      window.setTimeout(() => {
        router.push(nextHref);
      }, 1200);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [
    allObjectivesComplete,
    submitting,
    challenge.id,
    challenge.slug,
    gitState,
    getToken,
    router,
    trackId,
    lessonSlug,
    challengeSlugsOrdered,
  ]);

  const fileTree: { name: string; active?: boolean }[] = useMemo(() => {
    if (gitState.fileContents && Object.keys(gitState.fileContents).length > 0) {
      return Object.keys(gitState.fileContents).map((name) => ({
        name,
        active: name === selectedFile,
      }));
    }
    return lessonContent.files ?? [
      { name: "index.html" },
      { name: "style.css" },
      { name: "package.json" },
      { name: "README.md" },
    ];
  }, [gitState.fileContents, lessonContent.files, selectedFile]);

  const isEditableChallenge = Boolean(gitState.fileContents && Object.keys(gitState.fileContents).length > 0);

  function fileStateForName(name: string): GitSimState["files"][string] | undefined {
    return gitState.files[name];
  }

  const handleFileContentChange = useCallback((filename: string, newContent: string) => {
    setGitState((prev) => {
      if (!prev.fileContents) return prev;
      const next: GitSimState = {
        ...prev,
        workingTree: { ...prev.workingTree, [filename]: newContent },
      };
      syncFileStatesFromWorkingTree(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (isEditableChallenge && !selectedFile && fileTree.length > 0) {
      setSelectedFile(fileTree[0].name);
    }
  }, [isEditableChallenge, selectedFile, fileTree]);

  const scenarioFileLine = useMemo(() => {
    if (initialModified.length === 0) return null;
    const names = initialModified.join(", ");
    return `${names} start as modified on branch main. Use the terminal to complete objectives.`;
  }, [initialModified]);

  const completedCount = objectivesState.filter((o) => o.completed).length;
  const totalObjectives = objectivesState.length;

  useEffect(() => {
    if (completedCount < 1 || firstObjectiveXpShownRef.current) return;
    firstObjectiveXpShownRef.current = true;
    const n = Math.max(1, totalObjectives);
    const xpShare = Math.max(1, Math.round(challenge.xp / n));
    setLines((prev) => [...prev, { kind: "xp_notice", xp: xpShare }]);
  }, [completedCount, challenge.xp, totalObjectives]);

  const trackHref = trackPath(trackId);
  const lessonHref = lessonPath(trackId, lessonSlug);

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* ── Left panel: Problem description ── */}
      <div className="flex h-full min-h-[280px] w-full flex-col overflow-hidden border-r border-border/30 lg:w-[420px] lg:min-w-[360px] lg:max-w-[500px] lg:shrink-0">
        <div className="shrink-0 border-b border-border/30 bg-background px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/modules" className="hover:text-foreground transition-colors font-medium">
              Problems
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link href={trackHref} className="hover:text-foreground transition-colors font-medium">
              {TRACKS[trackId].title}
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link href={lessonHref} className="hover:text-foreground transition-colors font-medium">
              {lessonTitle}
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <span className="text-foreground font-medium line-clamp-2">{challenge.title}</span>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 p-5">
              {/* Title & badges */}
              <div className="space-y-3">
                <h1 className="text-xl font-semibold tracking-tight">{challenge.title}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <DifficultyBadge level={challenge.difficulty} />
                  <span className="lc-badge text-muted-foreground bg-secondary">{challenge.xp} XP</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
                <p className="text-sm leading-relaxed text-foreground/85">{challenge.description}</p>
                {scenarioFileLine && (
                  <p className="text-xs leading-relaxed text-muted-foreground rounded-md bg-secondary/50 px-3 py-2">{scenarioFileLine}</p>
                )}
              </div>

              {/* Already completed banner */}
              {isAlreadyCompleted && !submitBanner && (
                <div className="rounded-md border border-easy/30 bg-easy/10 px-3 py-2.5 text-sm text-foreground flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-easy shrink-0" />
                  <span>You&apos;ve already completed this challenge. Feel free to practice again!</span>
                </div>
              )}

              {/* Submit banners */}
              {submitBanner && (
                <div
                  className={`rounded-md border px-3 py-2.5 text-sm ${
                    submitBanner.alreadyCompleted
                      ? "border-border bg-secondary text-muted-foreground"
                      : "border-easy/30 bg-easy/10 text-foreground"
                  }`}
                >
                  {submitBanner.alreadyCompleted ? (
                    <span>Already completed. Total XP: <span className="font-semibold font-mono tabular-nums">{submitBanner.totalXp}</span></span>
                  ) : (
                    <span>+{submitBanner.xpAwarded} XP earned! Total: <span className="font-semibold font-mono tabular-nums">{submitBanner.totalXp}</span></span>
                  )}
                </div>
              )}

              {submitError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  {submitError}
                </div>
              )}

              {/* Objectives */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Objectives</h3>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{completedCount}/{totalObjectives}</span>
                </div>
                <ol className="space-y-2">
                  {objectivesState.map((obj, index) => {
                    const staticHint = staticObjectiveHint(obj.text);
                    const dynamicHint = obj.completed
                      ? ""
                      : hintForObjectiveIncomplete(obj.text, gitState, initialModified);
                    return (
                      <li
                        key={obj.id}
                        className={`rounded-md border p-3 transition-colors ${
                          obj.completed
                            ? "border-easy/20 bg-easy/5"
                            : "border-border/40 bg-card"
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="shrink-0 pt-0.5">
                            {obj.completed ? (
                              <CheckCircle2 size={16} className="text-easy" />
                            ) : (
                              <Circle size={16} className="text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-2">
                            <span className={`block text-[13px] leading-snug ${obj.completed ? "text-foreground" : "text-muted-foreground"}`}>
                              <span className="font-mono text-[11px] text-muted-foreground mr-2">{index + 1}.</span>
                              {obj.text}
                            </span>
                            {staticHint && (
                              <div className="rounded-md border border-primary/15 bg-primary/5 px-2.5 py-2">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/90">
                                  What this refers to
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                                  {staticHint}
                                </p>
                              </div>
                            )}
                            {dynamicHint && dynamicHint !== staticHint && (
                              <p className="border-l-2 border-easy/40 pl-2.5 text-[11px] leading-relaxed text-muted-foreground">
                                <span className="font-medium text-foreground/80">Where you’re at: </span>
                                {dynamicHint}
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Action buttons */}
        <div className="shrink-0 border-t border-border/30 bg-card p-4 space-y-2">
          <Button
            type="button"
            disabled={!allObjectivesComplete || submitting}
            onClick={() => void handleSubmitSolution()}
            className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-[13px] disabled:opacity-40"
          >
            <Send size={14} className="mr-2" />
            {submitting ? "Submitting..." : "Submit Solution"}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-border/50 bg-secondary/50 text-xs font-medium hover:bg-secondary"
              onClick={handleRunChecks}
            >
              <ListChecks size={14} className="mr-1.5 text-easy" />
              Run Checks
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 border-border/50 bg-secondary/50 text-xs font-medium hover:bg-secondary"
              onClick={() => {
                setActiveTab("terminal");
                setInput("tutor ");
                requestAnimationFrame(() => terminalInputRef.current?.focus());
              }}
            >
              <MessageSquare size={14} className="mr-1.5 text-primary" />
              AI Coach
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right panel: Terminal / Code ── */}
      <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden sm:min-h-[360px] lg:min-h-0">
        {/* Tab bar */}
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

          {/* Status indicators */}
          <div className="ml-auto flex items-center gap-3 px-4 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-easy" />
              <span className="font-mono">{branchDisplay}</span>
            </div>
            <span className="text-medium font-mono">{modifiedCount}M</span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* File sidebar */}
          <aside className="hidden w-40 shrink-0 overflow-y-auto border-r border-border/20 bg-card/50 p-3 md:block">
            <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Explorer
            </h4>
            <ul className="space-y-0.5 text-[11px]">
              {isEditableChallenge ? (
                fileTree.map((file) => {
                  const st = fileStateForName(file.name);
                  const isActive = selectedFile === file.name;
                  const isModified = st === "modified" || st === "staged";
                  const fileContent = gitState.fileContents?.[file.name] ?? "";
                  const hasConflicts = hasConflictMarkers(fileContent);
                  return (
                    <li key={file.name}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(file.name);
                          setActiveTab("files");
                        }}
                        className={`w-full flex items-center gap-1.5 pl-2 py-1 rounded-sm text-left transition-colors hover:bg-white/5 ${
                          isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
                        } ${isModified && !isActive ? "text-medium" : ""}`}
                      >
                        <FileCode size={11} className="shrink-0 opacity-60" />
                        <span className="truncate flex-1">{file.name}</span>
                        {hasConflicts && (
                          <span className="ml-auto shrink-0 text-[9px] font-medium text-destructive bg-destructive/10 px-1 py-0.5 rounded">!</span>
                        )}
                      </button>
                    </li>
                  );
                })
              ) : (
                <>
                  <li className="flex items-center gap-1.5 text-muted-foreground py-0.5">
                    <ChevronRight size={11} className="shrink-0" />
                    <Folder size={11} className="shrink-0 opacity-60" />
                    <span>src</span>
                  </li>
                  {fileTree
                    .filter((f) => f.name === "index.html" || f.name === "style.css")
                    .map((file) => {
                      const st = fileStateForName(file.name);
                      const isActive = file.active;
                      const isModified = st === "modified" || st === "staged";
                      return (
                        <li
                          key={file.name}
                          className={`flex items-center gap-1.5 pl-5 py-0.5 rounded-sm ${
                            isActive ? "text-easy bg-easy/5" : "text-muted-foreground"
                          } ${isModified ? "text-medium" : ""}`}
                        >
                          <FileCode size={11} className="shrink-0 opacity-60" />
                          <span className="truncate">{file.name}</span>
                        </li>
                      );
                    })}
                  {fileTree
                    .filter((f) => f.name === "package.json" || f.name === "README.md")
                    .map((file) => {
                      const st = fileStateForName(file.name);
                      const isModified = st === "modified" || st === "staged";
                      return (
                        <li
                          key={file.name}
                          className={`flex items-center gap-1.5 pl-2 py-0.5 rounded-sm ${
                            isModified ? "text-medium" : "text-muted-foreground"
                          }`}
                        >
                          <FileCode size={11} className="shrink-0 opacity-60" />
                          <span className="truncate">{file.name}</span>
                        </li>
                      );
                    })}
                </>
              )}
            </ul>
          </aside>

          {/* Main content area */}
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
                  {/* Window title bar */}
                  <div className="flex shrink-0 select-none items-center gap-2 rounded-t-[7px] border-b border-white/6 bg-[#2d2d2d] px-3 py-1.5">
                    <span className="flex gap-1.5" aria-hidden>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                    </span>
                    <span className="flex-1 text-center font-mono text-[11px] text-[#b4b4b4]">
                      student@gitmastery — bash
                    </span>
                    <span className="w-12" aria-hidden />
                  </div>

                  <div ref={terminalScrollRootRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <ScrollArea className="h-full min-h-0 flex-1">
                      <div className="space-y-1.5 p-3 pb-2 font-mono text-[12px] leading-relaxed sm:p-4 sm:pb-3">
                        {lines.map((row, i) => {
                          if (row.kind === "welcome") {
                            return (
                              <div key={i} className="space-y-0.5 border-b border-white/4 pb-3 mb-1">
                                {row.lines.map((l, li) => (
                                  <div
                                    key={`w-${i}-${li}`}
                                    className={
                                      l.startsWith("#")
                                        ? "text-[#6e7681]"
                                        : "text-[#8b949e]"
                                    }
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
                          if (row.kind === "xp_notice") {
                            return (
                              <div
                                key={i}
                                className="my-2 rounded border border-emerald-500/30 bg-emerald-950/35 px-3 py-2 font-mono text-[11px] leading-snug text-emerald-100/95 shadow-[0_0_20px_-8px_rgba(52,211,153,0.45)]"
                              >
                                <span className="text-emerald-400">✓</span> First objective complete —{" "}
                                <span className="font-semibold tabular-nums text-amber-200">
                                  +{row.xp} XP
                                </span>{" "}
                                <span className="text-emerald-200/80">toward this challenge</span>
                                <span className="mt-1 block text-[10px] text-emerald-200/50">
                                  Full XP is credited when you submit the completed challenge.
                                </span>
                              </div>
                            );
                          }
                          if (row.kind === "err") {
                            return (
                              <div key={i} className="text-[#f85149]">{row.text}</div>
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
                                <div
                                  className={`whitespace-pre-wrap ${
                                    row.loading ? "animate-pulse text-[#6e7681]" : "text-[#c9d1d9]"
                                  }`}
                                >
                                  {row.lines.join("\n")}
                                </div>
                              </div>
                            );
                          }
                          if (row.kind === "check") {
                            return (
                              <div
                                key={i}
                                className="rounded-md border border-amber-500/25 bg-amber-950/20 py-2 pl-3 pr-2 text-[11px] leading-relaxed"
                              >
                                <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-amber-200/90">
                                  Test Results
                                </div>
                                <ul className="space-y-1.5">
                                  {row.results.map((r, j) => (
                                    <li key={j}>
                                      <span className={r.ok ? "text-[#3fb950]" : "text-[#f85149]"}>
                                        {r.ok ? "PASS " : "FAIL "}
                                      </span>
                                      <span className="text-[#c9d1d9]">{r.text}</span>
                                      {!r.ok && r.hint && (
                                        <div className="mt-0.5 pl-6 text-[#6e7681]">{r.hint}</div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          return (
                            <div key={i} className="whitespace-pre-wrap text-[#6e7681]">
                              {row.lines.join("\n")}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Prompt + input (fixed to bottom like a real shell) */}
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
                          placeholder="git status"
                          spellCheck={false}
                          autoCapitalize="off"
                          autoCorrect="off"
                          aria-label="Terminal input"
                        />
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute bottom-full left-0 mb-1 w-48 max-h-32 overflow-y-auto rounded border border-white/10 bg-[#1c1c1c] shadow-lg">
                            {suggestions.map((suggestion, i) => (
                              <button
                                key={suggestion}
                                type="button"
                                className={`w-full px-2 py-1 text-left text-[11px] ${
                                  i === selectedSuggestion
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
            {activeTab === "files" && (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {isEditableChallenge && selectedFile ? (
                  <>
                    <div className="shrink-0 flex items-center justify-between border-b border-border/30 bg-card/50 px-4 py-2">
                      <div className="flex items-center gap-2">
                        <FileCode size={13} className="text-muted-foreground" />
                        <span className="font-mono text-xs text-foreground">{selectedFile}</span>
                        {gitState.fileContents?.[selectedFile] &&
                          hasConflictMarkers(gitState.fileContents[selectedFile]) && (
                            <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                              Has conflicts
                            </Badge>
                          )}
                        {gitState.files[selectedFile] === "modified" && (
                          <span className="text-[10px] text-medium font-medium">Modified</span>
                        )}
                        {gitState.files[selectedFile] === "staged" && (
                          <span className="text-[10px] text-easy font-medium">Staged</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {fileTree.length > 1 && (
                          <select
                            value={selectedFile}
                            onChange={(e) => setSelectedFile(e.target.value)}
                            className="bg-secondary border border-border/50 rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            {fileTree.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name}
                              </option>
                            ))}
                          </select>
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
                    {gitState.conflictFiles?.includes(selectedFile) && (
                      <div className="shrink-0 border-t border-border/30 bg-card/80 px-4 py-2">
                        <p className="text-[11px] text-muted-foreground">
                          <span className="text-destructive font-medium">Resolve conflicts:</span>{" "}
                          Remove all{" "}
                          <code className="bg-white/5 px-1 py-0.5 rounded text-[10px]">{"<<<<<<<, =======, >>>>>>>"}</code>{" "}
                          markers. Keep the code you want, delete the rest.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <ScrollArea className="min-h-0 flex-1">
                    <div className="p-4 font-mono text-[12px] leading-relaxed md:p-5">
                      <pre className="whitespace-pre-wrap text-muted-foreground">
                        {lessonContent.files?.find((f) => f.active)?.content ||
                          "Select a file from the explorer panel."}
                      </pre>
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}
            {activeTab === "status" && (
              <ChallengeGitStatusPanel challenge={challenge} gitState={gitState} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
