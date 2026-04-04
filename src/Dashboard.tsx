"use client";

import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Compass,
  Play,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/AppHeader";
import { fetchWithAuth } from "@/lib/api";
import type { DashboardPayload } from "@/lib/dashboard-types";

export default function Dashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        const res = await fetchWithAuth("/api/dashboard", getToken);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }
        const json = (await res.json()) as DashboardPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load dashboard");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      <AppHeader />

      <main className="mx-auto w-full px-8 py-12">
        {loadError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        {!data ? (
          <div className="flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/3">
              <div className="space-y-3 max-w-xl">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-96 max-w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex gap-12">
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-28" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full" />
              </div>
              <div className="lg:col-span-4 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-white/3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                  <Sparkles size={12} />
                  Mastery Level {data.user.masteryLevel}
                </div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Welcome back,{" "}
                  <span className="text-muted-foreground">{data.headline.welcomeName}</span>
                </h1>
                <p className="text-sm text-muted-foreground max-w-md">{data.headline.subtitle}</p>
              </div>

              <div className="flex items-center gap-12">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Current Streak
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{data.user.streakDays}</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Days</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Total XP
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">{data.user.totalXpLabel}</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">Points</span>
                  </div>
                </div>
                <div className="h-10 w-px bg-white/5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Global Rank
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tabular-nums">#{data.user.globalRank}</span>
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {data.user.topPercentLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Active Module
                  </h3>
                  {data.activeModule ? (
                    <div className="relative group">
                      <div className="grid grid-cols-1 md:grid-cols-12 border border-white/5 bg-white/1 rounded-2xl overflow-hidden">
                        <div className="md:col-span-7 p-10 space-y-10">
                          <div className="space-y-4">
                            <h2 className="text-4xl font-bold tracking-tight">{data.activeModule.title}</h2>
                            <p className="text-base text-muted-foreground leading-relaxed max-w-sm">
                              {data.activeModule.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <Button
                              asChild
                              className="rounded-none px-10 font-bold h-12 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                            >
                              <Link href="/modules">Continue</Link>
                            </Button>
                            {data.activeModule.videoBriefAvailable ? (
                              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                <Play size={16} className="text-muted-foreground/60" />
                                <span>Video brief</span>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <div className="md:col-span-5 bg-white/2 border-l border-white/5 p-10 flex flex-col justify-center">
                          <div className="space-y-10">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                <span>Module Progress</span>
                                <span className="text-foreground tabular-nums">
                                  {data.activeModule.progressPercent}%
                                </span>
                              </div>
                              <Progress
                                value={data.activeModule.progressPercent}
                                className="h-1 bg-white/5 rounded-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                  Difficulty
                                </span>
                                <div className="text-sm font-bold">{data.activeModule.difficulty}</div>
                              </div>
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                  XP Value
                                </span>
                                <div className="text-sm font-bold text-primary">
                                  +{data.activeModule.xpReward} XP
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/5 bg-white/2 rounded-2xl p-10 space-y-4">
                      <p className="text-muted-foreground text-sm max-w-md">
                        No active module yet. Open the curriculum to start your first module.
                      </p>
                      <Button asChild className="rounded-none font-bold uppercase tracking-widest text-[10px] h-11">
                        <Link href="/modules">Go to curriculum</Link>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Learning Path
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {data.learningPath.map((item) => (
                      <Link
                        key={item.moduleId}
                        href="/modules"
                        className="group flex items-center justify-between py-4 border-b border-white/3 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-8 w-8 flex items-center justify-center ${
                              item.done ? "text-emerald-500" : "text-muted-foreground/40"
                            }`}
                          >
                            {item.done ? <CheckCircle2 size={18} /> : <Compass size={18} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold group-hover:text-primary transition-colors">
                              {item.title}
                            </div>
                            <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                              {item.level} • {item.xp} XP
                            </div>
                          </div>
                        </div>
                        <ChevronRight
                          size={14}
                          className="text-muted-foreground/20 group-hover:text-primary transition-colors"
                        />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Activity Momentum
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {data.activityYearLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.heatmap.map((level, idx) => (
                      <div
                        key={idx}
                        className={`h-3 w-3 rounded-sm border border-white/2 ${
                          level === 4
                            ? "bg-primary"
                            : level === 3
                              ? "bg-primary/60"
                              : level === 2
                                ? "bg-primary/30"
                                : level === 1
                                  ? "bg-primary/10"
                                  : "bg-white/3"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-12">
                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Classroom Elite
                  </h3>
                  <div className="divide-y divide-white/3">
                    {data.leaderboardPreview.map((user) => (
                      <div
                        key={`${user.rank}-${user.displayName}`}
                        className={`py-4 flex items-center justify-between ${user.isYou ? "bg-primary/2" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-muted-foreground w-4 tabular-nums">
                            {user.rank}
                          </span>
                          <Avatar className="h-6 w-6 border border-white/10 rounded-sm">
                            <AvatarFallback className="text-[8px] font-bold bg-white/5">
                              {user.displayName[0]?.toUpperCase() ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`text-xs font-bold ${user.isYou ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {user.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold font-mono tabular-nums">{user.xpLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                    <Sparkles size={12} />
                    Coach Hint
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic border-l-2 border-primary/20 pl-4">
                    <span className="text-foreground font-medium not-italic">{data.coachHint}</span>
                  </p>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Recent Activity
                  </h3>
                  {data.recentActivity.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No activity yet. Complete lessons and labs to see your progress here.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {data.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-4 group">
                          <div className="mt-1.5 h-1 w-1 bg-white/20 group-hover:bg-primary transition-colors" />
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold group-hover:text-primary transition-colors">
                              {activity.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider tabular-nums">
                              {activity.timeLabel}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
