"use client";

import { GitCommit, GitBranch } from "lucide-react";
import { useMemo } from "react";

import type { Commit, GitSimState } from "@/lib/git-emulator";
import { getHeadSha, getCommitHistory } from "@/lib/git-emulator";

interface CommitGraphProps {
  state: GitSimState;
  maxCommits?: number;
}

export function CommitGraph({ state, maxCommits = 10 }: CommitGraphProps) {
  const history = useMemo(
    () => getCommitHistory(state, maxCommits),
    [state, maxCommits],
  );

  const headSha = getHeadSha(state);

  const branchesAtCommit = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const [name, sha] of Object.entries(state.refs)) {
      if (!map[sha]) map[sha] = [];
      map[sha].push(name);
    }
    return map;
  }, [state.refs]);

  if (history.length === 0) {
    return (
      <div className="text-[11px] text-[#6e7681] p-4">
        No commits yet.
      </div>
    );
  }

  return (
    <div className="font-mono text-[11px] leading-relaxed">
      {history.map((commit, index) => {
        const isHead = commit.sha === headSha;
        const branches = branchesAtCommit[commit.sha] ?? [];
        const isLast = index === history.length - 1;

        return (
          <CommitNode
            key={commit.sha}
            commit={commit}
            isHead={isHead}
            branches={branches}
            currentBranch={state.HEAD}
            detachedHead={state.detachedHead}
            isLast={isLast}
          />
        );
      })}
    </div>
  );
}

interface CommitNodeProps {
  commit: Commit;
  isHead: boolean;
  branches: string[];
  currentBranch: string;
  detachedHead: boolean;
  isLast: boolean;
}

function CommitNode({
  commit,
  isHead,
  branches,
  currentBranch,
  detachedHead,
  isLast,
}: CommitNodeProps) {
  const refLabels = useMemo(() => {
    const labels: { text: string; isHead: boolean; isCurrent: boolean }[] = [];

    if (isHead && detachedHead) {
      labels.push({ text: "HEAD", isHead: true, isCurrent: true });
    }

    for (const branch of branches) {
      const isCurrent = branch === currentBranch && !detachedHead;
      if (isCurrent && isHead) {
        labels.push({ text: `HEAD -> ${branch}`, isHead: true, isCurrent: true });
      } else {
        labels.push({ text: branch, isHead: false, isCurrent });
      }
    }

    return labels;
  }, [isHead, detachedHead, branches, currentBranch]);

  return (
    <div className="flex items-start group">
      {/* Graph line */}
      <div className="w-6 shrink-0 flex flex-col items-center">
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 ${
            isHead
              ? "border-[#58a6ff] bg-[#58a6ff]"
              : "border-[#3fb950] bg-transparent"
          }`}
        />
        {!isLast && (
          <div className="w-0.5 h-6 bg-[#3fb950]/50" />
        )}
      </div>

      {/* Commit info */}
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`${
              isHead ? "text-[#58a6ff]" : "text-[#f0883e]"
            } font-medium`}
          >
            {commit.sha.slice(0, 7)}
          </span>

          {refLabels.length > 0 && (
            <span className="flex items-center gap-1">
              {refLabels.map((label, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] ${
                    label.isHead
                      ? "bg-[#58a6ff]/20 text-[#58a6ff]"
                      : label.isCurrent
                        ? "bg-[#3fb950]/20 text-[#3fb950]"
                        : "bg-[#6e7681]/20 text-[#8b949e]"
                  }`}
                >
                  {label.isHead ? (
                    <GitCommit size={10} />
                  ) : (
                    <GitBranch size={10} />
                  )}
                  {label.text}
                </span>
              ))}
            </span>
          )}
        </div>

        <div className="text-[#c9d1d9] mt-0.5 truncate">
          {commit.message}
        </div>

        <div className="text-[#6e7681] text-[10px] mt-0.5">
          {formatRelativeTime(commit.timestamp)}
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function CommitGraphCompact({ state }: { state: GitSimState }) {
  const history = useMemo(() => getCommitHistory(state, 5), [state]);
  const headSha = getHeadSha(state);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="font-mono text-[10px] space-y-0.5">
      {history.map((commit, index) => {
        const isHead = commit.sha === headSha;
        return (
          <div key={commit.sha} className="flex items-center gap-1.5">
            <span className="text-[#3fb950]">
              {index === 0 ? "*" : "|"}
            </span>
            <span className={isHead ? "text-[#58a6ff]" : "text-[#f0883e]"}>
              {commit.sha.slice(0, 7)}
            </span>
            <span className="text-[#6e7681] truncate flex-1">
              {commit.message}
            </span>
          </div>
        );
      })}
    </div>
  );
}
