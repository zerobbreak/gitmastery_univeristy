"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchWithAuth } from "@/lib/api";
import { extractRecentGitCommands, isTutorCommand } from "@/lib/git-tutor";
import {
  runGitCommand,
  statusBarModifiedCount,
  type GitSimState,
} from "@/lib/git-emulator";
import {
  getAutocompleteSuggestions,
  isShellCommand,
  runShellCommand,
} from "@/lib/shell-emulator";

export type GitTerminalLine =
  | { kind: "welcome"; lines: string[] }
  | { kind: "cmd"; text: string }
  | { kind: "out"; lines: string[] }
  | { kind: "tutor"; lines: string[]; loading?: boolean }
  | { kind: "err"; text: string };

export function useGitTerminalSession(options: {
  sessionKey: string | number;
  initialGitState: GitSimState;
  welcomeLines: string[];
}) {
  const { getToken } = useAuth();
  const { sessionKey, initialGitState, welcomeLines } = options;

  const welcomeBlock = useMemo(
    () => ({ kind: "welcome" as const, lines: welcomeLines }),
    [welcomeLines],
  );

  const [gitState, setGitState] = useState<GitSimState>(() => initialGitState);
  const gitRef = useRef(gitState);
  gitRef.current = gitState;

  const [lines, setLines] = useState<GitTerminalLine[]>(() => [welcomeBlock]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  useEffect(() => {
    gitRef.current = initialGitState;
    setGitState(initialGitState);
    setLines([{ kind: "welcome", lines: welcomeLines }]);
    setInput("");
    setCommandHistory([]);
    setHistoryIndex(-1);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [sessionKey, initialGitState, welcomeLines]);

  const terminalScrollRootRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = terminalScrollRootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;
    viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
  }, [lines]);

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
                lines: [msg, "", "Try again, or add GEMINI_API_KEY for dynamic help."],
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

      if (isShellCommand(trimmed)) {
        const result = runShellCommand(gitRef.current, trimmed);
        gitRef.current = result.state;
        setGitState(result.state);

        if (result.clearTerminal) {
          setLines([welcomeBlock]);
          return;
        }

        setLines((prev) => {
          const next: GitTerminalLine[] = [...prev, { kind: "cmd", text: trimmed }];
          if (result.outputLines.length > 0) next.push({ kind: "out", lines: result.outputLines });
          return next;
        });
        return;
      }

      const { state, outputLines } = runGitCommand(gitRef.current, trimmed);
      gitRef.current = state;
      setGitState(state);
      setLines((prev) => {
        const next: GitTerminalLine[] = [...prev, { kind: "cmd", text: trimmed }];
        if (outputLines.length > 0) next.push({ kind: "out", lines: outputLines });
        return next;
      });
    },
    [runTutorAsync, lines, welcomeBlock],
  );

  const onSubmitInput = useCallback(() => {
    const v = input;
    setInput("");
    setShowSuggestions(false);
    runLine(v);
  }, [input, runLine]);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setHistoryIndex(-1);

    if (value.trim()) {
      const newSuggestions = getAutocompleteSuggestions(value, gitRef.current);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        if (suggestions.length > 0) {
          const parts = input.trim().split(/\s+/);
          parts[parts.length - 1] = suggestions[selectedSuggestion]!;
          setInput(parts.join(" ") + " ");
          setShowSuggestions(false);
        }
        return;
      }

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

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (commandHistory.length === 0) return;

        if (historyIndex === -1) {
          setSavedInput(input);
          setHistoryIndex(0);
          setInput(commandHistory[0]!);
        } else if (historyIndex < commandHistory.length - 1) {
          setHistoryIndex((prev) => prev + 1);
          setInput(commandHistory[historyIndex + 1]!);
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
          setInput(commandHistory[historyIndex - 1]!);
        }
        setShowSuggestions(false);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        onSubmitInput();
        return;
      }

      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [
      commandHistory,
      historyIndex,
      input,
      onSubmitInput,
      savedInput,
      selectedSuggestion,
      showSuggestions,
      suggestions,
    ],
  );

  const branchDisplay = gitState.branch;
  const modifiedCount = statusBarModifiedCount(gitState);

  const resetTerminal = useCallback(() => {
    gitRef.current = initialGitState;
    setGitState(initialGitState);
    setLines([welcomeBlock]);
    setInput("");
  }, [initialGitState, welcomeBlock]);

  return {
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
  };
}
