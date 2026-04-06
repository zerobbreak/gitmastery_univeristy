"use client";

import { GitBranch, Radio, Terminal, History, GitCommit } from "lucide-react";

import { CommitGraph } from "@/components/CommitGraph";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  getChallengeStatusScenario,
  type ChallengeStatusScenario,
} from "@/lib/challenge-git-status-meta";
import {
  formatGitStatus,
  statusBarModifiedCount,
  statusBarStagedCount,
  getCommitHistory,
  type GitSimState,
} from "@/lib/git-emulator";
import type { ChallengeDef } from "@/lib/module-routes";

function statusLineTone(
  line: string,
  phase: "root" | "staged" | "unstaged",
): { phase: "root" | "staged" | "unstaged"; className: string } {
  if (line.startsWith("On branch ")) {
    return {
      phase: "root",
      className: "text-[#58a6ff]",
    };
  }
  if (line.startsWith("Changes to be committed")) {
    return { phase: "staged", className: "text-[#3fb950] font-medium" };
  }
  if (line.startsWith("Changes not staged for commit")) {
    return { phase: "unstaged", className: "text-[#d29922] font-medium" };
  }
  if (line.startsWith("\tmodified:")) {
    const file =
      phase === "staged"
        ? "text-[#56d364]"
        : phase === "unstaged"
          ? "text-[#e3b341]"
          : "text-[#c9d1d9]";
    return { phase, className: file };
  }
  if (line.startsWith("  (use ") || line.startsWith("no changes added")) {
    return { phase, className: "text-[#6e7681]" };
  }
  if (line === "nothing to commit, working tree clean") {
    return { phase: "root", className: "text-[#6e7681]" };
  }
  return { phase, className: "text-[#8b949e]" };
}

function GitStatusBlock({ state }: { state: GitSimState }) {
  const raw = formatGitStatus(state);
  let phase: "root" | "staged" | "unstaged" = "root";
  return (
    <pre className="m-0 whitespace-pre-wrap font-mono text-[11px] leading-relaxed sm:text-[12px]">
      {raw.map((line, i) => {
        const { phase: nextPhase, className } = statusLineTone(line, phase);
        phase = nextPhase;
        return (
          <span key={`${i}-${line.slice(0, 12)}`} className={className}>
            {line}
            {i < raw.length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </pre>
  );
}

function RemotesBlock({ state }: { state: GitSimState }) {
  const remotes = state.remotes;
  const names = remotes ? Object.keys(remotes).sort() : [];
  if (names.length === 0) {
    return (
      <p className="font-mono text-[11px] text-[#6e7681] sm:text-[12px]">
        No remotes configured yet. Use{" "}
        <code className="text-[#79c0ff]">git remote add &lt;name&gt; &lt;url&gt;</code>.
      </p>
    );
  }
  return (
    <div className="space-y-2 font-mono text-[11px] leading-relaxed text-[#c9d1d9] sm:text-[12px]">
      {names.map((name) => {
        const r = remotes![name]!;
        return (
          <div key={name} className="space-y-0.5">
            <div>
              <span className="text-[#56d364]">{name}</span>
              <span className="text-[#6e7681]">{"  "}</span>
              <span>{r.fetch}</span> <span className="text-[#6e7681]">(fetch)</span>
            </div>
            <div>
              <span className="text-[#56d364]">{name}</span>
              <span className="text-[#6e7681]">{"  "}</span>
              <span>{r.push}</span> <span className="text-[#6e7681]">(push)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FetchActivity({ state }: { state: GitSimState }) {
  const fetched = state.fetchedRemotes ?? [];
  if (fetched.length === 0) {
    return (
      <p className="text-[11px] text-[#6e7681] sm:text-[12px]">
        No <code className="text-[#79c0ff]">git fetch</code> completed in this session yet.
      </p>
    );
  }
  return (
    <ul className="space-y-1 font-mono text-[11px] text-[#8b949e] sm:text-[12px]">
      {fetched.map((name) => (
        <li key={name}>
          <span className="text-[#3fb950]">✓</span> fetched from{" "}
          <span className="text-[#d2a8ff]">{name}</span>
        </li>
      ))}
    </ul>
  );
}

export function ChallengeGitStatusPanel({
  challenge,
  gitState,
  scenarioOverride,
}: {
  challenge?: ChallengeDef;
  gitState: GitSimState;
  /** When set (e.g. repo sandbox), skip challenge-based copy. */
  scenarioOverride?: ChallengeStatusScenario;
}) {
  const scenario =
    scenarioOverride ??
    (challenge ? getChallengeStatusScenario(challenge) : null);
  if (!scenario) {
    return null;
  }
  const staged = statusBarStagedCount(gitState);
  const modified = statusBarModifiedCount(gitState);
  const showRemotes = scenario.emphasizeRemotes || Boolean(gitState.remotes && Object.keys(gitState.remotes).length > 0);

  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="space-y-5 p-4 md:p-5">
        <div className="space-y-2 border-b border-white/6 pb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#6e7681]">
            <Terminal size={12} className="shrink-0" />
            Git Status
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-[#e6edf3]">{scenario.headline}</h2>
          <p className="text-[12px] leading-relaxed text-[#8b949e]">{scenario.summary}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-white/6 bg-[#0d1117] px-3 py-2.5">
            <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-[#6e7681]">
              <GitBranch size={11} /> Branch
            </div>
            <p className="font-mono text-[12px] font-medium text-[#58a6ff]">{gitState.branch}</p>
          </div>
          <div className="rounded-md border border-white/6 bg-[#0d1117] px-3 py-2.5">
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#6e7681]">Staged</div>
            <p className="font-mono text-[12px] tabular-nums text-[#3fb950]">{staged}</p>
          </div>
          <div className="rounded-md border border-white/6 bg-[#0d1117] px-3 py-2.5">
            <div className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-[#6e7681]">Unstaged Δ</div>
            <p className="font-mono text-[12px] tabular-nums text-[#d29922]">{modified}</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/8 bg-[#010409] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
            Output of <code className="text-[#79c0ff]">git status</code>
          </div>
          <GitStatusBlock state={gitState} />
        </div>

        {gitState.lastCommitMessage && (
          <div className="rounded-lg border border-white/6 bg-[#0d1117] px-4 py-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
              Last commit message
            </div>
            <p className="font-mono text-[12px] text-[#c9d1d9]">{gitState.lastCommitMessage}</p>
          </div>
        )}

        {showRemotes && (
          <div className="space-y-3 rounded-lg border border-white/8 bg-[#010409] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
              <Radio size={12} className="text-[#d2a8ff]" />
              Remotes (<code className="text-[#79c0ff]">git remote -v</code>)
            </div>
            <RemotesBlock state={gitState} />
            <div className="border-t border-white/6 pt-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
                Fetch activity
              </div>
              <FetchActivity state={gitState} />
            </div>
          </div>
        )}

        {/* Commit Graph */}
        {getCommitHistory(gitState, 1).length > 0 && (
          <div className="space-y-3 rounded-lg border border-white/8 bg-[#010409] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
              <GitCommit size={12} className="text-[#58a6ff]" />
              Commit History (<code className="text-[#79c0ff]">git log --oneline</code>)
            </div>
            <CommitGraph state={gitState} maxCommits={5} />
          </div>
        )}

        {/* Reflog */}
        {gitState.reflog && gitState.reflog.length > 1 && (
          <div className="space-y-3 rounded-lg border border-white/8 bg-[#010409] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
              <History size={12} className="text-[#f0883e]" />
              Recent Actions (<code className="text-[#79c0ff]">git reflog</code>)
            </div>
            <div className="font-mono text-[11px] space-y-1">
              {gitState.reflog.slice(0, 5).map((entry, i) => (
                <div key={`${entry.sha}-${i}`} className="flex items-start gap-2">
                  <span className="text-[#f0883e] shrink-0">{entry.sha.slice(0, 7)}</span>
                  <span className="text-[#6e7681] shrink-0">HEAD@{"{" + i + "}"}</span>
                  <span className="text-[#8b949e] truncate">{entry.action}: {entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stash */}
        {gitState.stash && gitState.stash.length > 0 && (
          <div className="space-y-3 rounded-lg border border-white/8 bg-[#010409] p-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#6e7681]">
              <Terminal size={12} className="text-[#a371f7]" />
              Stash (<code className="text-[#79c0ff]">git stash list</code>)
            </div>
            <div className="font-mono text-[11px] space-y-1">
              {gitState.stash.map((entry, i) => (
                <div key={entry.id} className="text-[#8b949e]">
                  <span className="text-[#a371f7]">stash@{"{" + i + "}"}</span>: {entry.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
