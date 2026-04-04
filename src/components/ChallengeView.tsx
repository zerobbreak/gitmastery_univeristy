"use client";

import {
  CheckCircle2,
  Circle,
  FileCode,
  GitBranch,
  Play,
  Send,
  Terminal as TerminalIcon,
  MessageSquare,
  ChevronRight,
  Folder,
} from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createInitialGitState,
  formatGitStatus,
  runGitCommand,
  statusBarModifiedCount,
  type GitSimState,
} from "@/lib/git-emulator";
import { fetchWithAuth } from "@/lib/api";
import { isTutorCommand } from "@/lib/git-tutor";
import { type ChallengeDef, type TrackId } from "@/lib/module-routes";
import { type LessonContent } from "@/lib/module-lesson-content";

type TerminalLine =
  | { kind: "welcome"; lines: string[] }
  | { kind: "cmd"; text: string }
  | { kind: "out"; lines: string[] }
  | { kind: "tutor"; lines: string[]; loading?: boolean }
  | { kind: "err"; text: string };

function parseExpectedBranchFromObjective(text: string): string | null {
  const m = text.match(/branch\s+([\w./-]+)/i);
  return m?.[1] ?? null;
}

function parseExpectedCommitMessageFromObjective(text: string): string | null {
  const m = text.match(/["']([^"']+)["']/);
  return m?.[1] ?? null;
}

function isStageAllObjective(text: string): boolean {
  return /stage\s+all/i.test(text);
}

function objectiveDone(
  text: string,
  state: GitSimState,
  initialModified: string[],
): boolean {
  const branch = parseExpectedBranchFromObjective(text);
  if (branch && /create|branch/i.test(text)) {
    return state.branch === branch;
  }
  if (isStageAllObjective(text)) {
    const allStaged = initialModified.every((p) => state.files[p] === "staged");
    const committed = state.lastCommitMessage !== null;
    return allStaged || committed;
  }
  if (/commit/i.test(text)) {
    const expected = parseExpectedCommitMessageFromObjective(text);
    if (expected) return state.lastCommitMessage === expected;
  }
  return false;
}

export function ChallengeView({
  trackId: _trackId,
  challenge,
  lessonContent,
}: {
  trackId: TrackId;
  challenge: ChallengeDef;
  lessonContent: LessonContent;
}) {
  const { getToken } = useAuth();
  const initialModified = useMemo(() => {
    const fromLesson = lessonContent.files
      ?.filter((f) => f.name !== "README.md")
      .slice(0, 3)
      .map((f) => f.name);
    return fromLesson?.length ? fromLesson : ["style.css", "index.html", "package.json"];
  }, [lessonContent.files]);

  const [gitState, setGitState] = useState<GitSimState>(() =>
    createInitialGitState({ modifiedPaths: initialModified }),
  );
  const gitRef = useRef(gitState);
  gitRef.current = gitState;

  const welcomeBlock = useMemo(
    () => ({
      kind: "welcome" as const,
      lines: [
        "# Initializing GitMastery environment...",
        `# Welcome to ${challenge.title}. Type commands below.`,
        "# Tip: type tutor for plain-English help (powered by Gemini when GEMINI_API_KEY is set).",
      ],
    }),
    [challenge.title],
  );

  const [lines, setLines] = useState<TerminalLine[]>(() => [welcomeBlock]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const initial = createInitialGitState({ modifiedPaths: initialModified });
    gitRef.current = initial;
    setGitState(initial);
    setLines([welcomeBlock]);
    setInput("");
  }, [challenge.id, initialModified, welcomeBlock]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const [activeTab, setActiveTab] = useState<"terminal" | "files" | "status">("terminal");

  const runTutorAsync = useCallback(
    async (trimmed: string) => {
      setLines((prev) => [
        ...prev,
        { kind: "cmd", text: trimmed },
        { kind: "tutor", lines: ["Asking tutor…"], loading: true },
      ]);
      try {
        const res = await fetchWithAuth("/api/tutor", getToken, {
          method: "POST",
          body: JSON.stringify({ line: trimmed }),
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
        if (json.hint) {
          out.push("", json.hint);
        }
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

      if (isTutorCommand(trimmed)) {
        void runTutorAsync(trimmed);
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
    [runTutorAsync],
  );

  const onSubmitInput = () => {
    const v = input;
    setInput("");
    runLine(v);
  };

  const branchDisplay = gitState.branch.toUpperCase();
  const modifiedCount = statusBarModifiedCount(gitState);

  const statusText = useMemo(() => formatGitStatus(gitState).join("\n"), [gitState]);

  const objectivesState = useMemo(
    () =>
      challenge.objectives.map((obj) => ({
        ...obj,
        completed: objectiveDone(obj.text, gitState, initialModified),
      })),
    [challenge.objectives, gitState, initialModified],
  );

  const fileTree: { name: string; active?: boolean }[] = lessonContent.files ?? [
    { name: "index.html" },
    { name: "style.css" },
    { name: "package.json" },
    { name: "README.md" },
  ];

  function fileStateForName(name: string): GitSimState["files"][string] | undefined {
    return gitState.files[name];
  }

  return (
    <div className="flex h-full flex-col overflow-hidden lg:flex-row">
      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden bg-[#0a0a0a] lg:min-h-0">
        <div className="flex shrink-0 border-b border-white/5 bg-white/2">
          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === "terminal"
                ? "border-b border-primary bg-white/5 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TerminalIcon size={14} />
            Terminal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("files")}
            className={`flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === "files"
                ? "border-b border-primary bg-white/5 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode size={14} />
            Files
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("status")}
            className={`flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === "status"
                ? "border-b border-primary bg-white/5 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitBranch size={14} />
            Git Status
          </button>
          <div className="ml-auto flex items-center gap-4 px-6 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Current Branch: <span className="text-foreground">{branchDisplay}</span>
            </div>
            <div className="text-amber-500">
              {modifiedCount} FILE{modifiedCount === 1 ? "" : "S"} MODIFIED
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="hidden w-44 shrink-0 overflow-y-auto border-r border-white/5 bg-white/1 p-4 md:block">
            <h4 className="mb-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Project Root
            </h4>
            <ul className="space-y-1 text-[11px]">
              <li className="flex items-center gap-2 text-muted-foreground">
                <ChevronRight size={12} className="shrink-0" />
                <Folder size={12} className="shrink-0 opacity-60" />
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
                      className={`flex items-center gap-2 pl-6 ${
                        isActive ? "font-medium text-emerald-400" : "text-muted-foreground"
                      } ${isModified ? "text-amber-500" : ""}`}
                    >
                      <FileCode size={12} className="shrink-0 opacity-70" />
                      <span>{file.name}</span>
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
                      className={`flex items-center gap-2 pl-2 ${
                        isModified ? "text-amber-500" : "text-muted-foreground"
                      }`}
                    >
                      <FileCode size={12} className="shrink-0 opacity-70" />
                      <span>{file.name}</span>
                    </li>
                  );
                })}
            </ul>
          </aside>

          <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 overflow-y-auto p-6 font-mono text-[12px] leading-relaxed md:p-8">
              {activeTab === "terminal" && (
                <div className="space-y-3">
                  {lines.map((row, i) => {
                    if (row.kind === "welcome") {
                      return (
                        <div key={i} className="text-muted-foreground">
                          {row.lines.map((l) => (
                            <span key={l}>
                              {l}
                              <br />
                            </span>
                          ))}
                        </div>
                      );
                    }
                    if (row.kind === "cmd") {
                      return (
                        <div key={i} className="flex gap-3">
                          <span className="shrink-0 text-primary">$</span>
                          <span className="text-foreground">{row.text}</span>
                        </div>
                      );
                    }
                    if (row.kind === "err") {
                      return (
                        <div key={i} className="text-red-400/90">
                          {row.text}
                        </div>
                      );
                    }
                    if (row.kind === "tutor") {
                      return (
                        <div
                          key={i}
                          className="border-l-2 border-primary/60 bg-primary/5 py-3 pl-4 pr-2 text-[11px] leading-relaxed text-foreground/95"
                        >
                          <div className="mb-2 text-[9px] font-bold uppercase tracking-widest text-primary/90">
                            Tutor {row.loading ? "…" : ""}
                          </div>
                          <div
                            className={`whitespace-pre-wrap ${row.loading ? "animate-pulse text-muted-foreground" : ""}`}
                          >
                            {row.lines.join("\n")}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={i} className="whitespace-pre-wrap text-muted-foreground">
                        {row.lines.join("\n")}
                      </div>
                    );
                  })}
                  <div className="flex gap-3 pt-1">
                    <span className="shrink-0 text-primary">$</span>
                    <input
                      ref={terminalInputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          onSubmitInput();
                        }
                      }}
                      className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/40"
                      placeholder="git status · tutor"
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      aria-label="Terminal input"
                    />
                  </div>
                </div>
              )}
              {activeTab === "files" && (
                <pre className="whitespace-pre-wrap text-muted-foreground">
                  {lessonContent.files?.find((f) => f.active)?.content ||
                    "Select a file from the project tree (lesson content)."}
                </pre>
              )}
              {activeTab === "status" && (
                <div className="whitespace-pre-wrap text-muted-foreground">{statusText}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col overflow-hidden border-t border-white/5 lg:w-[400px] lg:border-l lg:border-t-0">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-white/1 p-8 pb-12">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{challenge.title}</h1>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="rounded-none border-emerald-500/20 bg-emerald-500/5 text-[9px] font-bold uppercase tracking-widest text-emerald-500"
              >
                {challenge.difficulty}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                {challenge.xp} XP
              </Badge>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">{challenge.description}</p>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Your Objectives
            </h3>
            <ul className="space-y-3">
              {objectivesState.map((obj) => (
                <li
                  key={obj.id}
                  className={`flex items-center gap-4 border border-white/5 p-4 transition-colors ${
                    obj.completed ? "bg-emerald-500/5" : "bg-white/2"
                  }`}
                >
                  {obj.completed ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
                  ) : (
                    <Circle size={18} className="shrink-0 text-muted-foreground/20" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      obj.completed ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {obj.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto shrink-0 space-y-3 p-8 pt-0">
          <Button className="h-12 w-full rounded-none bg-primary font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90">
            <Send size={16} className="mr-2" />
            Submit Solution
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-none border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
            >
              <Play size={14} className="mr-2 text-emerald-500" />
              Run Tests
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-none border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
              onClick={() => {
                setActiveTab("terminal");
                setInput("tutor ");
                requestAnimationFrame(() => terminalInputRef.current?.focus());
              }}
            >
              <MessageSquare size={14} className="mr-2 text-primary" />
              Ask AI Coach
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
