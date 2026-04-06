"use client";

import { useEffect, useMemo, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  ChevronRight,
  Trophy,
  Zap,
  Target,
  ShieldCheck,
  Flame,
  RotateCcw,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/api";
import type { DashboardPayload } from "@/lib/dashboard-types";
import { WORKSHOP_LABELS } from "@/lib/workshop-copy";
import {
  TRACK_IDS,
  TRACKS,
  trackPath,
  type TrackId,
} from "@/lib/module-routes";

function workshopStatus(
  trackId: TrackId,
  learningPath: DashboardPayload["learningPath"],
  proUnlocked: boolean,
): "completed" | "active" | "locked" {
  if (trackId === "pro" && !proUnlocked) return "locked";
  const track = TRACKS[trackId];
  const rows = track.modules.map((m) =>
    learningPath.find((p) => p.moduleId === m.id),
  );
  if (rows.length > 0 && rows.every((r) => r?.done)) return "completed";
  if (rows.some((r) => r?.status === "active" || r?.status === "next"))
    return "active";
  return "locked";
}

export default function Workshops() {
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
          setLoadError(e instanceof Error ? e.message : "Could not load workshops");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken, pathname]);

  const workshops = useMemo(() => {
    if (!data) return [];
    return TRACK_IDS.map((tid) => {
      const track = TRACKS[tid];
      const moduleRows = track.modules.map((m) =>
        data.learningPath.find((p) => p.moduleId === m.id),
      );
      const sumXp = moduleRows.reduce((s, r) => s + (r?.xp ?? 0), 0);
      const status = workshopStatus(tid, data.learningPath, data.trackAccess.pro);
      const skills = track.modules.slice(0, 3).map((m) => m.bullets[0] ?? m.title);
      return {
        id: tid,
        title: track.title,
        level: track.level,
        desc: track.sub,
        skills,
        status,
        xp: sumXp,
        href: trackPath(tid),
      };
    });
  }, [data]);

  const achievements = useMemo(() => {
    if (!data?.recentActivity?.length) return [];
    return data.recentActivity.slice(0, 4).map((ev) => ({
      title: ev.title,
      icon: <Trophy size={16} />,
      unlocked: true as const,
      date: ev.timeLabel,
    }));
  }, [data]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      <AppHeader />

      <main className="mx-auto w-full px-8 py-12">
        <div className="flex flex-col gap-16">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Target size={12} />
              Skill Progression
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Workshops: <span className="text-muted-foreground">Beginner to Pro</span></h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Your three curriculum tracks mirror the Problems page. Status and XP come from your saved module progress and completed challenges.
            </p>
          </div>

          {loadError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          {!data ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-none" />
                ))}
              </div>
              <Skeleton className="h-64 w-full rounded-lg" />
            </div>
          ) : (
            <>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent activity</h3>
                  <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                    Dashboard
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {achievements.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-full">
                      Complete a challenge to see recent milestones here.
                    </p>
                  ) : (
                    achievements.map((item, i) => (
                      <div key={i} className="p-6 border bg-white/5 border-primary/20">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 flex items-center justify-center rounded-lg border bg-primary/10 border-primary/30 text-primary">
                            {item.icon}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold tracking-tight line-clamp-2">{item.title}</h4>
                            <div className="text-[9px] font-bold uppercase text-primary/60 tracking-widest">{item.date}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                <div className="flex items-center justify-between gap-4 p-5 border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-500">
                      <RotateCcw size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {WORKSHOP_LABELS.reviewDue}
                      </p>
                      <p className="text-xl font-black tabular-nums text-primary">
                        {data.learningModes.reviewDueCount}
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-none shrink-0 text-[10px] font-bold uppercase tracking-widest">
                    <Link href="/learn/review">{WORKSHOP_LABELS.startReview}</Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-4 p-5 border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 flex items-center justify-center rounded-lg border border-primary/20 bg-primary/5 text-primary">
                      <Target size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {WORKSHOP_LABELS.improveQueue}
                      </p>
                      <p className="text-xl font-black tabular-nums text-primary">
                        {data.learningModes.improveCount}
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-none shrink-0 text-[10px] font-bold uppercase tracking-widest">
                    <Link href="/learn/improve">{WORKSHOP_LABELS.startImprove}</Link>
                  </Button>
                </div>
              </div>

              <div className="space-y-12">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-sm">
                    <Flame size={14} className="text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">The Mastery Path</span>
                  </div>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {workshops.map((ws) => (
                    <div
                      key={ws.id}
                      className={`group relative grid grid-cols-1 md:grid-cols-12 border ${
                        ws.status === "active"
                          ? "bg-white/2 border-primary/20"
                          : "bg-white/1 border-white/5"
                      } transition-all hover:bg-white/2`}
                    >
                      <div className="md:col-span-7 p-10 space-y-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{ws.id}</span>
                            <Badge
                              variant="outline"
                              className={`rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest px-3 ${
                                ws.level === "Pro"
                                  ? "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                  : ws.level === "Intermediate"
                                    ? "text-primary border-primary/20 bg-primary/5"
                                    : "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                              }`}
                            >
                              {ws.level}
                            </Badge>
                          </div>
                          <h2 className="text-3xl font-bold tracking-tight">{ws.title}</h2>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                            {ws.desc}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {ws.skills.map((skill, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                            >
                              <div className="w-1 h-1 rounded-full bg-primary" />
                              {skill}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-5 bg-white/[0.01] border-l border-white/5 p-10 flex flex-col justify-center items-center text-center space-y-6">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Track XP (modules)</div>
                          <div className="text-2xl font-black tabular-nums text-primary">+{ws.xp} XP</div>
                        </div>

                        {ws.status === "completed" ? (
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                              <CheckCircle2 size={24} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Complete</span>
                          </div>
                        ) : ws.status === "active" ? (
                          <Button asChild className="w-full rounded-none font-bold uppercase tracking-widest text-[10px] h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                            <Link href={ws.href}>
                              Open track <ChevronRight className="inline ml-1" size={14} />
                            </Link>
                          </Button>
                        ) : (
                          <div className="flex flex-col items-center gap-2 opacity-40">
                            <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                              <Target size={24} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-8 pt-12 border-t border-white/3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Critical Skills for Mastery</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {[
                    { title: "Surgical Rebasing", desc: "Learn to rewrite history with precision, keeping your commit graph clean and meaningful.", icon: <Zap size={18} /> },
                    { title: "Pipeline Debugging", desc: "Master the art of troubleshooting CI/CD workflows and optimizing runtimes.", icon: <Terminal size={18} /> },
                    { title: "Security & Compliance", desc: "Implement secret scanning and branch protection rules to keep your codebase safe.", icon: <ShieldCheck size={18} /> },
                  ].map((skill, i) => (
                    <div key={i} className="space-y-4">
                      <div className="h-10 w-10 flex items-center justify-center bg-white/5 text-primary">
                        {skill.icon}
                      </div>
                      <h4 className="text-base font-bold tracking-tight">{skill.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {skill.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
