"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Database,
  ExternalLink,
  Loader2,
  RefreshCw,
  Terminal,
} from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/api";
import type { GitHubRepoRow } from "@/lib/github-repo-types";

export type { GitHubRepoRow } from "@/lib/github-repo-types";

export default function Repositories() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [repos, setRepos] = useState<GitHubRepoRow[] | null>(null);
  const [repoError, setRepoError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadRepos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/repos", getToken);
      const data = (await res.json().catch(() => ({}))) as {
        repos?: GitHubRepoRow[];
        error?: string;
        code?: string;
      };
      if (!res.ok) {
        if (res.status === 400 && data.code === "GITHUB_NOT_CONNECTED") {
          setRepoError(
            "GitHub is not connected. Open your profile → Connected accounts and link GitHub.",
          );
        } else {
          setRepoError(data.error ?? "Could not load repositories.");
        }
        setRepos([]);
        // eslint-disable-next-line no-console -- intentional: verify API / render path in devtools
        console.log("[repos] load failed", res.status, data);
        return;
      }
      setRepoError(null);
      const list = data.repos ?? [];
      setRepos(list);
      // eslint-disable-next-line no-console -- intentional: verify payload in devtools
      console.log("[repos] loaded", { count: list.length, repos: list });
    } catch (e) {
      setRepoError("Network error loading repositories.");
      setRepos([]);
      // eslint-disable-next-line no-console -- intentional
      console.log("[repos] load exception", e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void loadRepos();
  }, [isLoaded, isSignedIn, loadRepos]);

  useEffect(() => {
    if (repos === null || repos.length === 0) return;
    // eslint-disable-next-line no-console -- intentional: confirm list render in devtools
    console.log("[repos] rendering list", {
      count: repos.length,
      names: repos.map((r) => r.full_name),
    });
  }, [repos]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto w-full max-w-[900px] px-6 py-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              GitHub
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Your repositories</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Repositories from your linked GitHub account (same source as onboarding).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadRepos()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>

        {!isLoaded ? (
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : loading && repos === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : repoError ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {repoError}
          </p>
        ) : repos && repos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">
            No repositories returned. If you have no GitHub repos, create one; otherwise check Connected
            accounts.
          </p>
        ) : (
          <ScrollArea className="h-[min(520px,70vh)] pr-3 rounded-lg border border-border/50">
            <ul className="space-y-2 p-1">
              {(repos ?? []).map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">{r.name}</span>
                        {r.private ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Private
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground truncate font-mono">{r.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {r.default_branch}
                        {r.updated_at ? ` · updated ${new Date(r.updated_at).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Button variant="secondary" size="sm" className="h-8 text-xs" asChild>
                        <Link href={`/repos/sandbox/${r.id}`}>
                          <Terminal className="mr-1.5 h-3.5 w-3.5" />
                          Practice
                        </Link>
                      </Button>
                      <a
                        href={r.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </main>
    </div>
  );
}
