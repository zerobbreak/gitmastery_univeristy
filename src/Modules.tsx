"use client";

import { useEffect, useMemo, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  GitBranch,
  Lock,
  Code2,
  Cpu,
  Layers,
} from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  if (status === "completed") return "Review content";
  if (status === "active") return "Continue module";
  if (status === "next") return "Open module";
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
          setLoadError(e instanceof Error ? e.message : "Could not load curriculum");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getToken]);

  const progressMap = useMemo(() => {
    if (!data) return new Map<string, DashboardPayload["learningPath"][number]>();
    return new Map(data.learningPath.map((p) => [p.moduleId, p]));
  }, [data]);

  const roadmap = useMemo(() => {
    if (!data) {
      return TRACK_IDS.map((id) => {
        const t = TRACKS[id];
        return {
          id: t.id,
          title: t.title,
          sub: t.sub,
          year: t.year,
          active: false,
          done: false,
          locked: t.locked,
          href: trackPath(id),
        };
      });
    }

    const activeFromProfile = data.activeModule?.id
      ? getModuleRouteById(data.activeModule.id)?.track
      : null;

    const firstActiveOrNext = data.learningPath.find(
      (p) => p.status === "active" || p.status === "next",
    );
    const activeFromPath = firstActiveOrNext
      ? trackIdForYear(firstActiveOrNext.trackYear)
      : null;

    const activeTrack = activeFromProfile ?? activeFromPath ?? "foundations";

    return TRACK_IDS.map((id) => {
      const t = TRACKS[id];
      const modsInTrack = t.modules;
      const done =
        modsInTrack.length > 0 &&
        modsInTrack.every((m) => progressMap.get(m.id)?.status === "completed");

      return {
        id: t.id,
        title: t.title,
        sub: t.sub,
        year: t.year,
        active: !t.locked && id === activeTrack,
        done: !t.locked && done,
        locked: t.locked,
        href: trackPath(id),
      };
    });
  }, [data, progressMap]);

  const curriculum = useMemo(() => {
    return TRACK_IDS.map((id) => {
      const t = TRACKS[id];
      return {
        year: String(t.year).padStart(2, "0"),
        label: t.yearLabel,
        level: t.level,
        trackId: id as TrackId,
        modules: t.modules,
      };
    });
  }, []);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      <AppHeader />

      <main className="mx-auto w-full px-8 py-12">
        {loadError ? (
          <div className="mb-8 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        {!data ? (
          <div className="flex flex-col gap-16">
            <div className="space-y-6">
              <Skeleton className="h-3 w-40" />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-96 max-w-full" />
              <Skeleton className="h-20 w-full max-w-2xl" />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Skeleton className="h-72 w-full" />
              <Skeleton className="h-72 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            <div className="space-y-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Academic Roadmap
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {roadmap.map((item) => {
                  const inner = (
                    <>
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          Year {item.year}
                        </span>
                        {item.done ? (
                          <CheckCircle2 size={14} className="text-primary" />
                        ) : item.locked ? (
                          <Lock size={12} className="text-muted-foreground/40" />
                        ) : null}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold tracking-tight">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                    </>
                  );
                  const className = `block p-6 border transition-all ${
                    item.active
                      ? "border-primary bg-white/5 shadow-[0_0_30px_rgba(173,198,255,0.05)]"
                      : "border-white/5 bg-white/1 hover:border-white/10"
                  } ${item.locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`;

                  if (item.locked) {
                    return (
                      <div key={item.id} className={className}>
                        {inner}
                      </div>
                    );
                  }
                  return (
                    <Link key={item.id} href={item.href} className={className}>
                      {inner}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="max-w-2xl space-y-4">
              <h1 className="text-5xl font-bold tracking-tight">
                Curriculum <span className="text-muted-foreground">Explorer</span>
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground">
                {data.headline.subtitle}
              </p>
            </div>

            {curriculum.map((section) => (
              <div key={section.year} className="space-y-10">
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/5" />
                  <div className="flex items-center gap-3 rounded-sm border border-white/5 bg-white/2 px-4 py-1.5">
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                      {section.year}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                      {section.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="rounded-none border-white/10 px-2 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60"
                    >
                      {section.level}
                    </Badge>
                  </div>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  {section.modules.map((mod) => {
                    const lp = progressMap.get(mod.id);
                    const status = resolveLiveStatus(mod, lp);
                    const title = lp?.title ?? mod.title;
                    const levelLabel = lp?.level ?? section.level;
                    const xpLabel = lp?.xp ?? 0;
                    const href = modulePrimaryHref(section.trackId, mod, status);
                    return (
                      <div
                        key={mod.id}
                        className={`group relative space-y-8 border border-white/5 p-10 transition-all ${
                          status === "locked"
                            ? "bg-white/1 opacity-50"
                            : "bg-white/1 hover:bg-white/2"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-10 w-10 items-center justify-center border border-white/10 bg-white/5 ${
                              status === "locked"
                                ? "text-muted-foreground/20"
                                : "text-muted-foreground group-hover:text-primary"
                            } transition-colors`}
                          >
                            <ModuleIcon name={mod.iconName} />
                          </div>
                          <Badge
                            variant="outline"
                            className={`rounded-none border-white/10 px-3 text-[9px] font-bold uppercase tracking-widest ${
                              status === "completed"
                                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
                                : status === "active"
                                  ? "border-primary/20 bg-primary/5 text-primary"
                                  : status === "next"
                                    ? "border-amber-500/20 bg-amber-500/5 text-amber-500"
                                    : "border-white/5 bg-white/5 text-muted-foreground/40"
                            }`}
                          >
                            {status}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            {mod.id}
                          </span>
                          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {levelLabel} · {xpLabel} XP
                          </p>
                        </div>

                        <ul className="space-y-3">
                          {mod.bullets.map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-3 text-xs text-muted-foreground"
                            >
                              <CheckCircle2
                                size={12}
                                className={
                                  status === "completed"
                                    ? "text-emerald-500"
                                    : "text-muted-foreground/40"
                                }
                              />
                              {item}
                            </li>
                          ))}
                        </ul>

                        {href ? (
                          <Button
                            asChild
                            className={`h-11 w-full rounded-none text-[10px] font-bold uppercase tracking-widest ${
                              status === "completed"
                                ? "bg-white/5 text-foreground hover:bg-white/10"
                                : status === "active"
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : status === "next"
                                    ? "border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                                    : "bg-white/5 text-muted-foreground/40"
                            }`}
                          >
                            <Link href={href}>{moduleButtonLabel(status)}</Link>
                          </Button>
                        ) : (
                          <Button
                            disabled
                            className="h-11 w-full rounded-none bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40"
                          >
                            {moduleButtonLabel(status)}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="grid grid-cols-1 gap-8 border-t border-white/3 pt-12 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Live Session Logs
                </h3>
                <div className="space-y-4 border-l border-white/5 pl-6">
                  {data.recentActivity.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">
                      No recent activity yet. Complete a module to see updates here.
                    </p>
                  ) : (
                    data.recentActivity.map((log) => (
                      <div key={log.id} className="space-y-1">
                        <div className="text-[9px] font-mono font-bold tabular-nums text-muted-foreground/60">
                          {log.timeLabel}
                        </div>
                        <div className="text-[11px] font-medium leading-relaxed">{log.title}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex h-[300px] flex-col overflow-hidden rounded-sm border border-white/5 bg-[#0a0a0a] lg:col-span-8">
                <div className="flex items-center justify-between border-b border-white/5 bg-white/2 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full border border-red-500/40 bg-red-500/20" />
                    <div className="h-2.5 w-2.5 rounded-full border border-amber-500/40 bg-amber-500/20" />
                    <div className="h-2.5 w-2.5 rounded-full border border-emerald-500/40 bg-emerald-500/20" />
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/40">
                    ~/curriculum · {data.activityYearLabel}
                  </div>
                  <div className="w-4" />
                </div>
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed">
                  <p className="mb-4 text-muted-foreground">{data.headline.subtitle}</p>
                  {data.activeModule ? (
                    <div className="mb-4 space-y-2 text-muted-foreground">
                      <div>
                        <span className="text-muted-foreground/60">Active module:</span>{" "}
                        <span className="text-foreground">{data.activeModule.title}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground/60">Progress:</span>{" "}
                        <span className="tabular-nums text-primary">
                          {data.activeModule.progressPercent}%
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <div className="border-t border-white/5 pt-4 text-muted-foreground">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                      Coach hint
                    </span>
                    <p className="mt-2">{data.coachHint}</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span className="text-primary">$</span>
                    <span className="h-4 w-1.5 animate-pulse bg-primary/60" />
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
