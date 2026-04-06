"use client";

import { useEffect, useMemo, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  GitBranch,
  Lock,
  Code2,
  Cpu,
  Layers,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/api";
import type { DashboardPayload } from "@/lib/dashboard-types";
import {
  TRACK_IDS,
  TRACKS,
  getModuleRouteById,
  lessonPath,
  trackPath,
  type ModuleIconName,
  type ModuleStatus,
  type TrackId,
  type TrackModuleDef,
} from "@/lib/module-routes";

function ModuleIcon({ name, className }: { name: ModuleIconName; className?: string }) {
  const size = 16;
  switch (name) {
    case "GitBranch":
      return <GitBranch size={size} className={className} />;
    case "Code2":
      return <Code2 size={size} className={className} />;
    case "Layers":
      return <Layers size={size} className={className} />;
    case "Cpu":
      return <Cpu size={size} className={className} />;
    default: {
      const _exhaustive: never = name;
      return _exhaustive;
    }
  }
}

function DifficultyBadge({ level }: { level: string }) {
  const n = level.toLowerCase();
  const cls =
    n === "easy" || n === "beginner"
      ? "text-easy bg-easy/10"
      : n === "medium" || n === "intermediate"
        ? "text-medium bg-medium/10"
        : n === "hard" || n === "pro"
          ? "text-hard bg-hard/10"
          : "text-muted-foreground bg-muted/50";
  return <span className={`lc-badge ${cls}`}>{level}</span>;
}

function StatusIcon({ status }: { status: ModuleStatus }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 size={18} className="text-easy" />;
    case "active":
      return <div className="h-[18px] w-[18px] rounded-full border-2 border-primary flex items-center justify-center"><div className="h-2 w-2 rounded-full bg-primary" /></div>;
    case "next":
      return <Circle size={18} className="text-medium" />;
    case "locked":
      return <Lock size={16} className="text-muted-foreground/40" />;
  }
}

function modulePrimaryHref(
  trackId: TrackId,
  mod: TrackModuleDef,
  status: ModuleStatus,
): string | null {
  const track = TRACKS[trackId];
  if (track.locked || status === "locked") return null;
  return lessonPath(trackId, mod.lessonSlug);
}

function moduleButtonLabel(status: ModuleStatus): string {
  if (status === "completed") return "Review";
  if (status === "active") return "Continue";
  if (status === "next") return "Start";
  return "Locked";
}

function trackIdForYear(year: number): TrackId | null {
  for (const tid of TRACK_IDS) {
    if (TRACKS[tid].year === year) return tid;
  }
  return null;
}

function resolveLiveStatus(
  mod: TrackModuleDef,
  lp: DashboardPayload["learningPath"][number] | undefined,
): ModuleStatus {
  if (!lp) return mod.status;
  const s = lp.status;
  if (s === "completed" || s === "active" || s === "next" || s === "locked") return s;
  return mod.status;
}

export default function Modules() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const pathname = usePathname();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTrackTab, setActiveTrackTab] = useState<TrackId>("foundations");

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
          setLoadError(e instanceof Error ? e.message : "Could not load curriculum");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, pathname]);

  const progressMap = useMemo(() => {
    if (!data) return new Map<string, DashboardPayload["learningPath"][number]>();
    return new Map(data.learningPath.map((p) => [p.moduleId, p]));
  }, [data]);

  useEffect(() => {
    if (!data) return;
    const activeFromProfile = data.activeModule?.id
      ? getModuleRouteById(data.activeModule.id)?.track
      : null;
    if (activeFromProfile) setActiveTrackTab(activeFromProfile);
  }, [data]);

  const trackStats = useMemo(() => {
    const proUnlocked = data?.trackAccess?.pro ?? false;
    return TRACK_IDS.map((id) => {
      const t = TRACKS[id];
      const total = t.modules.length;
      const completed = t.modules.filter(
        (m) => progressMap.get(m.id)?.status === "completed",
      ).length;
      const locked = id === "pro" ? !proUnlocked : t.locked;
      return { id, title: t.title, year: t.year, level: t.level, locked, total, completed };
    });
  }, [progressMap, data?.trackAccess?.pro]);

  const currentTrack = TRACKS[activeTrackTab];

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
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-12 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Page header */}
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
              <p className="text-sm text-muted-foreground">{data.headline.subtitle}</p>
            </div>

            {/* Track tabs */}
            <div className="flex items-center gap-1 border-b border-border/40">
              {trackStats.map((ts) => (
                <button
                  key={ts.id}
                  type="button"
                  onClick={() => !ts.locked && setActiveTrackTab(ts.id)}
                  disabled={ts.locked}
                  className={`lc-tab relative pb-3 ${
                    activeTrackTab === ts.id ? "lc-tab-active" : ""
                  } ${ts.locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className="flex items-center gap-2">
                    {ts.locked && <Lock size={12} />}
                    {ts.title}
                    <span className="text-[10px] font-mono tabular-nums text-muted-foreground">
                      {ts.completed}/{ts.total}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {/* Track progress bar */}
            {(() => {
              const ts = trackStats.find((t) => t.id === activeTrackTab);
              if (!ts || ts.total === 0) return null;
              const pct = Math.round((ts.completed / ts.total) * 100);
              return (
                <div className="lc-panel p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{currentTrack.yearLabel}</span>
                      <span className="font-mono tabular-nums">{pct}% complete</span>
                    </div>
                    <Progress value={pct} className="h-1.5 bg-secondary" />
                  </div>
                  <DifficultyBadge level={ts.level} />
                </div>
              );
            })()}

            {/* Module list */}
            <div className="lc-panel">
              <div className="grid grid-cols-[40px_1fr_100px_80px_80px_32px] gap-2 items-center px-5 py-2.5 border-b border-border/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Status</span>
                <span>Module</span>
                <span>Difficulty</span>
                <span className="text-right">XP</span>
                <span className="text-center">Action</span>
                <span />
              </div>

              <div className="divide-y divide-border/20">
                {currentTrack.modules.map((mod) => {
                  const lp = progressMap.get(mod.id);
                  const status = resolveLiveStatus(mod, lp);
                  const title = lp?.title ?? mod.title;
                  const levelLabel = lp?.level ?? currentTrack.level;
                  const xpLabel = lp?.xp ?? 0;
                  const href = modulePrimaryHref(activeTrackTab, mod, status);
                  const isLocked = status === "locked";

                  const row = (
                    <div className={`grid grid-cols-[40px_1fr_100px_80px_80px_32px] gap-2 items-center px-5 py-4 transition-colors ${isLocked ? "opacity-50" : "hover:bg-white/2"}`}>
                      <div className="flex justify-center">
                        <StatusIcon status={status} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                            <ModuleIcon name={mod.iconName} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{title}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{mod.id} &middot; {mod.summary.slice(0, 60)}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <DifficultyBadge level={levelLabel} />
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono tabular-nums">{xpLabel}</span>
                      </div>
                      <div className="text-center">
                        {!isLocked && (
                          <span className={`text-[11px] font-semibold ${
                            status === "active" ? "text-primary" : status === "completed" ? "text-easy" : "text-medium"
                          }`}>
                            {moduleButtonLabel(status)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-center">
                        {!isLocked && <ChevronRight size={14} className="text-muted-foreground/40" />}
                      </div>
                    </div>
                  );

                  if (isLocked || !href) {
                    return <div key={mod.id}>{row}</div>;
                  }

                  return (
                    <Link key={mod.id} href={href} className="block group">
                      {row}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom section: activity + terminal preview */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lc-panel lg:col-span-1">
                <div className="px-5 py-3 border-b border-border/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</span>
                </div>
                {data.recentActivity.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-muted-foreground">No recent activity yet.</p>
                ) : (
                  <div className="divide-y divide-border/20">
                    {data.recentActivity.map((log) => (
                      <div key={log.id} className="px-5 py-3 space-y-0.5">
                        <p className="text-xs font-medium">{log.title}</p>
                        <p className="text-[10px] font-mono tabular-nums text-muted-foreground">{log.timeLabel}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="lc-panel lg:col-span-2 overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/30 bg-surface-inset px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/40" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/40" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500/40" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/50">~/curriculum &middot; {data.activityYearLabel}</span>
                  <div className="w-8" />
                </div>
                <div className="p-5 font-mono text-[12px] leading-relaxed text-muted-foreground terminal-bg min-h-[180px]">
                  <p className="mb-3">{data.headline.subtitle}</p>
                  {data.activeModule && (
                    <div className="mb-3 space-y-1">
                      <div>
                        <span className="text-muted-foreground/50">$ module --active</span>
                      </div>
                      <div>
                        <span className="text-foreground">{data.activeModule.title}</span>
                        <span className="text-primary ml-3">{data.activeModule.progressPercent}%</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-border/20 pt-3">
                    <span className="text-muted-foreground/50">$ coach --hint</span>
                    <p className="mt-1">{data.coachHint}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <span className="text-primary">$</span>
                    <span className="h-4 w-1.5 animate-cursor-blink bg-primary/70" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
