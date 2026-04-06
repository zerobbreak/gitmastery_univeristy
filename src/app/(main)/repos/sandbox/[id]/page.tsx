"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AppHeader } from "@/components/AppHeader";
import { RepoSandboxView } from "@/components/RepoSandboxView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/api";
import type { GitHubRepoRow } from "@/lib/github-repo-types";

export default function RepoSandboxPage() {
  const params = useParams();
  const id = Number(typeof params?.id === "string" ? params.id : NaN);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [repo, setRepo] = useState<GitHubRepoRow | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !Number.isFinite(id)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth("/api/repos", getToken);
        const data = (await res.json().catch(() => ({}))) as {
          repos?: GitHubRepoRow[];
          error?: string;
          code?: string;
        };
        if (!res.ok) {
          if (!cancelled) {
            setErr(data.error ?? "Could not load repositories.");
            setRepo(null);
          }
          return;
        }
        const r = (data.repos ?? []).find((x) => x.id === id);
        if (!cancelled) {
          if (!r) {
            setErr("Repository not found in your linked GitHub account.");
            setRepo(null);
          } else {
            setErr(null);
            setRepo(r);
          }
        }
      } catch {
        if (!cancelled) {
          setErr("Network error.");
          setRepo(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, id]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  if (!Number.isFinite(id)) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-lg p-6 space-y-4">
          <p className="text-sm text-destructive">Invalid repository id.</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/repos">Back to repositories</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (err && !repo) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-lg p-6 space-y-4">
          <p className="text-sm text-destructive">{err}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/repos">Back to repositories</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="mx-auto max-w-[900px] p-6 space-y-3">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return <RepoSandboxView repo={repo} />;
}
