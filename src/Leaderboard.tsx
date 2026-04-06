"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import {
  Trophy,
  Medal,
  Crown,
  Search,
} from "lucide-react";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboardRealtime } from "@/hooks/useLeaderboardRealtime";
import { fetchWithAuth } from "@/lib/api";
import type { LeaderboardPayload } from "@/lib/leaderboard-types";

function initialOf(name: string): string {
  const t = name.trim();
  return t ? t[0]!.toUpperCase() : "?";
}

export default function Leaderboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [data, setData] = useState<LeaderboardPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const prevDebouncedRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoadError(null);
      const debouncedBumped =
        prevDebouncedRef.current !== debouncedSearch;
      prevDebouncedRef.current = debouncedSearch;
      const pageToUse = debouncedBumped ? 1 : page;
      if (debouncedBumped && page !== 1) setPage(1);

      const q = new URLSearchParams();
      q.set("page", String(pageToUse));
      q.set("pageSize", "20");
      if (debouncedSearch.trim()) q.set("q", debouncedSearch.trim());
      const res = await fetchWithAuth(`/api/leaderboard?${q}`, getToken);
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as LeaderboardPayload;
      setData(json);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load leaderboard");
    }
  }, [isSignedIn, getToken, page, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);

  const liveStatus = useLeaderboardRealtime(load);

  const podium = data?.podium ?? [];
  const first = useMemo(() => podium.find((p) => p.rank === 1), [podium]);
  const second = useMemo(() => podium.find((p) => p.rank === 2), [podium]);
  const third = useMemo(() => podium.find((p) => p.rank === 3), [podium]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      <AppHeader />

      <main className="mx-auto w-full px-8 py-12">
        <div className="flex flex-col gap-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <span className="flex items-center gap-2">
                  <Trophy size={12} />
                  Global Rankings
                </span>
                {liveStatus === "live" && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-none border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-emerald-400/90"
                    title="Rankings refresh automatically when scores change"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Live
                  </span>
                )}
                {liveStatus === "connecting" && (
                  <span className="font-mono text-[9px] font-bold tracking-widest text-muted-foreground/80">
                    Connecting…
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-bold tracking-tight">Classroom <span className="text-muted-foreground">Elite</span></h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                Top learners by XP from completed challenges. Streaks update when you finish at least one challenge on a new day (UTC).
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-1 rounded-sm">
              <button type="button" className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground">
                Global
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 cursor-not-allowed"
              >
                Weekly
              </button>
              <button
                type="button"
                disabled
                title="Coming soon"
                className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 cursor-not-allowed"
              >
                Friends
              </button>
            </div>
          </div>

          {loadError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          {!data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto py-12">
                <Skeleton className="h-48 rounded-none" />
                <Skeleton className="h-56 rounded-none" />
                <Skeleton className="h-40 rounded-none" />
              </div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end max-w-5xl mx-auto w-full py-12">
                <PodiumCard
                  order="left"
                  entry={second}
                  heightClass="h-32"
                  avatarClass="h-24 w-24"
                  ringClass="border-slate-300/20 ring-slate-300/5"
                  badgeClass="bg-slate-300 border-[#050505] text-[#050505]"
                  rankLabel="2"
                />
                <PodiumCard
                  order="center"
                  entry={first}
                  heightClass="h-48"
                  avatarClass="h-32 w-32"
                  ringClass="border-amber-400/20 ring-amber-400/5"
                  badgeClass="bg-amber-400 border-[#050505] text-[#050505]"
                  rankLabel="1"
                  crown
                />
                <PodiumCard
                  order="right"
                  entry={third}
                  heightClass="h-24"
                  avatarClass="h-20 w-20"
                  ringClass="border-amber-700/20 ring-amber-700/5"
                  badgeClass="bg-amber-700 border-[#050505] text-[#050505]"
                  rankLabel="3"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <div className="flex items-center gap-12">
                    <span className="w-8">Rank</span>
                    <span>Learner</span>
                  </div>
                  <div className="flex items-center gap-24">
                    <span className="w-20 text-right">Streak</span>
                    <span className="w-24 text-right">Total XP</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {data.entries.map((user) => (
                    <div
                      key={`${user.rank}-${user.displayName}-${user.totalXp}`}
                      className={`flex items-center justify-between p-6 border transition-all ${
                        user.isYou
                          ? "bg-primary/5 border-primary/20 shadow-[0_0_30px_rgba(173,198,255,0.05)]"
                          : "bg-white/[0.01] border-white/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-12">
                        <div className="w-8 flex items-center gap-2">
                          <span className="text-sm font-bold tabular-nums">{user.rank}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-8 w-8 border border-white/10 rounded-sm">
                            <AvatarFallback className="text-[10px] font-bold bg-white/5">
                              {initialOf(user.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${user.isYou ? "text-primary" : ""}`}>
                              {user.displayName}
                              {user.isYou && (
                                <span className="ml-2 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-primary/10 text-primary">
                                  You
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                              Level {user.masteryLevel}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-24">
                        <div className="w-20 flex items-center justify-end gap-2">
                          <span className="text-sm font-bold tabular-nums">{user.streakDays}</span>
                          <span className="text-[9px] text-muted-foreground uppercase">d</span>
                        </div>
                        <div className="w-24 text-right">
                          <span className="text-sm font-bold tabular-nums text-primary">{user.totalXpLabel}</span>
                          <span className="ml-1 text-[9px] font-bold text-muted-foreground uppercase">XP</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-white/3">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filter by display name…"
                    className="w-full h-12 bg-white/[0.02] border border-white/5 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-primary/30 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {data.totalCount} learner{data.totalCount === 1 ? "" : "s"}
                    {data.query ? ` matching “${data.query}”` : ""}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={data.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="h-10 px-4 rounded-none border-white/5 bg-white/[0.01] hover:bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest"
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={data.page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="h-10 px-4 rounded-none border-white/5 bg-white/[0.01] hover:bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function PodiumCard({
  order,
  entry,
  heightClass,
  avatarClass,
  ringClass,
  badgeClass,
  rankLabel,
  crown,
}: {
  order: "left" | "center" | "right";
  entry: LeaderboardPayload["podium"][number] | undefined;
  heightClass: string;
  avatarClass: string;
  ringClass: string;
  badgeClass: string;
  rankLabel: string;
  crown?: boolean;
}) {
  const orderCls =
    order === "left"
      ? "order-2 md:order-1"
      : order === "center"
        ? "order-1 md:order-2"
        : "order-3";

  if (!entry) {
    return (
      <div className={`flex flex-col items-center gap-6 ${orderCls} opacity-30`}>
        <div className={`relative ${avatarClass} rounded-full bg-white/5 border border-white/10`} />
        <div className="w-full h-8 bg-white/[0.02] border border-white/5 border-b-0" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-6 ${orderCls}`}>
      <div className="relative">
        {crown && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
            <Crown size={40} />
          </div>
        )}
        <Avatar className={`${avatarClass} border-2 ${ringClass}`}>
          <AvatarFallback className={`${order === "center" ? "text-2xl" : "text-xl"} font-bold bg-white/5`}>
            {initialOf(entry.displayName)}
          </AvatarFallback>
        </Avatar>
        <div
          className={`absolute -top-2 -right-2 h-8 w-8 md:h-10 md:w-10 rounded-full border-4 border-[#050505] flex items-center justify-center text-xs font-black ${badgeClass}`}
        >
          {rankLabel}
        </div>
      </div>
      <div className="text-center space-y-1">
        <div className={`${order === "center" ? "text-xl" : "text-lg"} font-bold ${entry.isYou ? "text-primary" : ""}`}>
          {entry.displayName}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {entry.totalXpLabel} XP • Level {entry.masteryLevel}
        </div>
      </div>
      <div className={`w-full ${heightClass} bg-white/[0.02] border border-white/5 border-b-0 relative`}>
        {order === "center" && (
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        )}
      </div>
    </div>
  );
}
