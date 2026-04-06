"use client";

import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Flame,
  Play,
  RotateCcw,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/AppHeader";
import { fetchWithAuth } from "@/lib/api";
import type { DashboardPayload } from "@/lib/dashboard-types";
import { WORKSHOP_LABELS } from "@/lib/workshop-copy";

function DifficultyBadge({ level }: { level: string }) {
  const normalized = level.toLowerCase();
  const cls =
    normalized === "easy" || normalized === "beginner"
      ? "text-easy bg-easy/10"
      : normalized === "medium" || normalized === "intermediate"
        ? "text-medium bg-medium/10"
        : normalized === "hard" || normalized === "pro"
          ? "text-hard bg-hard/10"
          : "text-muted-foreground bg-muted/50";
  return (
    <span className={`lc-badge ${cls}`}>{level}</span>
  );
}

export default function Dashboard() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
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
  }, [isSignedIn, getToken, pathname]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
        {loadError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {!data ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
              <Skeleton className="h-24 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-48 rounded-lg" />
                <Skeleton className="h-32 rounded-lg" />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stat cards row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="stat-card flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                  <Flame size={20} className="text-orange-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold font-mono tabular-nums">{data.user.streakDays}<span className="text-sm font-normal text-muted-foreground ml-1">days</span></p>
                </div>
              </div>

              <div className="stat-card flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Zap size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="text-2xl font-bold font-mono tabular-nums">{data.user.totalXpLabel}<span className="text-sm font-normal text-muted-foreground ml-1">pts</span></p>
                </div>
              </div>

              <div className="stat-card flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp size={20} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Global Rank</p>
                  <p className="text-2xl font-bold font-mono tabular-nums">#{data.user.globalRank}<span className="text-sm font-normal text-muted-foreground ml-1">{data.user.topPercentLabel}</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="stat-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <RotateCcw size={20} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{WORKSHOP_LABELS.spacedReview}</p>
                    <p className="text-2xl font-bold font-mono tabular-nums">
                      {data.learningModes.reviewDueCount}
                      <span className="text-sm font-normal text-muted-foreground ml-1">due</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      {WORKSHOP_LABELS.spacedReviewHint}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-lg shrink-0">
                  <Link href="/learn/review">{WORKSHOP_LABELS.startReview}</Link>
                </Button>
              </div>
              <div className="stat-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Target size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{WORKSHOP_LABELS.improveQueue}</p>
                    <p className="text-2xl font-bold font-mono tabular-nums">
                      {data.learningModes.improveCount}
                      <span className="text-sm font-normal text-muted-foreground ml-1">items</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">
                      {WORKSHOP_LABELS.improveQueueHint}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" className="rounded-lg shrink-0">
                  <Link href="/learn/improve">{WORKSHOP_LABELS.startImprove}</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active module card */}
                {data.activeModule ? (
                  <div className="lc-panel">
                    <div className="flex items-center gap-2 border-b border-border/30 px-5 py-3">
                      <Play size={14} className="text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Continue Learning</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <h2 className="text-xl font-semibold tracking-tight">{data.activeModule.title}</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{data.activeModule.description}</p>
                        </div>
                        <DifficultyBadge level={data.activeModule.difficulty} />
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Progress</span>
                            <span className="font-mono tabular-nums">{data.activeModule.progressPercent}%</span>
                          </div>
                          <Progress value={data.activeModule.progressPercent} className="h-1.5 bg-secondary" />
                        </div>
                        <span className="text-xs font-semibold text-primary">+{data.activeModule.xpReward} XP</span>
                      </div>

                      <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                        <Link href={data.activeModule.resumeHref}>Resume Module</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="lc-panel p-5 space-y-3">
                    <p className="text-sm text-muted-foreground">No active module. Start your first module from the curriculum.</p>
                    <Button asChild size="sm">
                      <Link href="/modules">Browse Problems</Link>
                    </Button>
                  </div>
                )}

                {/* Learning path table */}
                <div className="lc-panel">
                  <div className="flex items-center justify-between border-b border-border/30 px-5 py-3">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Learning Path</span>
                    <Link href="/modules" className="text-xs text-primary hover:underline font-medium">View All</Link>
                  </div>
                  <div className="divide-y divide-border/20">
                    {data.learningPath.map((item) => (
                      <Link
                        key={item.moduleId}
                        href={item.resumeHref}
                        className="lc-row group"
                      >
                        <div className="w-5 shrink-0">
                          {item.done ? (
                            <CheckCircle2 size={16} className="text-easy" />
                          ) : (
                            <Circle size={16} className="text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium group-hover:text-primary transition-colors truncate block">
                            {item.title}
                          </span>
                        </div>
                        <DifficultyBadge level={item.level} />
                        <span className="text-xs font-mono tabular-nums text-muted-foreground w-16 text-right">{item.xp} XP</span>
                        <ChevronRight size={14} className="text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Heatmap */}
                <div className="lc-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Activity</span>
                    <span className="text-xs text-muted-foreground font-mono">{data.activityYearLabel}</span>
                  </div>
                  <div className="flex flex-wrap gap-[3px]">
                    {data.heatmap.map((level, idx) => (
                      <div
                        key={idx}
                        className={`h-[11px] w-[11px] rounded-[2px] ${
                          level === 4
                            ? "bg-primary"
                            : level === 3
                              ? "bg-primary/60"
                              : level === 2
                                ? "bg-primary/30"
                                : level === 1
                                  ? "bg-primary/12"
                                  : "bg-secondary/60"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-[3px]">
                      <div className="h-[11px] w-[11px] rounded-[2px] bg-secondary/60" />
                      <div className="h-[11px] w-[11px] rounded-[2px] bg-primary/12" />
                      <div className="h-[11px] w-[11px] rounded-[2px] bg-primary/30" />
                      <div className="h-[11px] w-[11px] rounded-[2px] bg-primary/60" />
                      <div className="h-[11px] w-[11px] rounded-[2px] bg-primary" />
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {/* Mastery level */}
                <div className="stat-card space-y-3">
                  <div className="flex items-center gap-2">
                    <Star size={16} className="text-medium" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mastery Level</span>
                  </div>
                  <p className="text-4xl font-bold font-mono tabular-nums">{data.user.masteryLevel}</p>
                  <p className="text-xs text-muted-foreground">Level {data.user.masteryLevel} Git Practitioner</p>
                </div>

                {/* Leaderboard */}
                <div className="lc-panel">
                  <div className="px-5 py-3 border-b border-border/30">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leaderboard</span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {data.leaderboardPreview.map((user) => (
                      <div
                        key={`${user.rank}-${user.displayName}`}
                        className={`flex items-center gap-3 px-5 py-2.5 ${user.isYou ? "bg-primary/5" : ""}`}
                      >
                        <span className="text-xs font-mono font-bold tabular-nums w-5 text-muted-foreground">{user.rank}</span>
                        <Avatar className="h-6 w-6 rounded-full">
                          <AvatarFallback className="text-[9px] font-bold bg-secondary text-foreground">
                            {user.displayName[0]?.toUpperCase() ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`text-xs font-medium flex-1 truncate ${user.isYou ? "text-primary" : ""}`}>
                          {user.displayName}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{user.xpLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach hint */}
                <div className="lc-panel p-5 space-y-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Coach Tip</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{data.coachHint}</p>
                </div>

                {/* Recent activity */}
                <div className="lc-panel">
                  <div className="px-5 py-3 border-b border-border/30">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</span>
                  </div>
                  {data.recentActivity.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-muted-foreground">
                      No activity yet. Complete challenges to see your progress.
                    </p>
                  ) : (
                    <div className="divide-y divide-border/20">
                      {data.recentActivity.map((activity) => (
                        <div key={activity.id} className="px-5 py-3 space-y-0.5">
                          <p className="text-xs font-medium">{activity.title}</p>
                          <p className="text-[11px] text-muted-foreground font-mono tabular-nums">{activity.timeLabel}</p>
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
