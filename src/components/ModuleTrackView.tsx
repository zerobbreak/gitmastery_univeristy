"use client";

import { CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  lessonPath,
  type TrackDef,
  type TrackId,
  type TrackModuleDef,
} from "@/lib/module-routes";

function moduleCta(mod: TrackModuleDef, track: TrackId, trackLocked: boolean) {
  if (trackLocked || mod.status === "locked") {
    return (
      <Button
        disabled
        className="h-11 w-full rounded-none bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40"
      >
        Locked
      </Button>
    );
  }
  const href = lessonPath(track, mod.lessonSlug);
  if (mod.status === "completed") {
    return (
      <Button
        asChild
        className="h-11 w-full rounded-none bg-white/5 text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-white/10"
      >
        <Link href={href}>Review content</Link>
      </Button>
    );
  }
  if (mod.status === "active") {
    return (
      <Button
        asChild
        className="h-11 w-full rounded-none bg-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-primary/90"
      >
        <Link href={href}>Continue module</Link>
      </Button>
    );
  }
  return (
    <Button
      asChild
      className="h-11 w-full rounded-none border border-amber-500/20 bg-amber-500/10 text-[10px] font-bold uppercase tracking-widest text-amber-500 hover:bg-amber-500/20"
    >
      <Link href={href}>Open module</Link>
    </Button>
  );
}

export function ModuleTrackView({ track }: { track: TrackDef }) {
  const locked = track.locked;
  const defaultHref = lessonPath(track.id, track.defaultLessonSlug);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div className="space-y-4">
        <Link
          href="/modules"
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Curriculum
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className="rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Year {track.year}
          </Badge>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {track.yearLabel}
          </span>
          <Badge
            variant="outline"
            className="rounded-none border-white/10 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60"
          >
            {track.level}
          </Badge>
        </div>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{track.title}</h1>
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">{track.sub}</p>
        {!locked ? (
          <Button
            asChild
            className="h-11 w-fit rounded-none bg-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground"
          >
            <Link href={defaultHref}>
              {track.id === "foundations" ? "Open Git basics" : "Continue track"}
            </Link>
          </Button>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock size={14} className="opacity-50" />
            This track unlocks when prerequisites are met.
          </p>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Modules
        </h2>
        <ul className="space-y-6">
          {track.modules.map((mod) => (
            <li
              key={mod.id}
              className={`border border-white/5 p-8 ${locked ? "bg-white/[0.005] opacity-60" : "bg-white/[0.01]"}`}
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {mod.id}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground">{mod.summary}</p>
                  <ul className="space-y-2">
                    {mod.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2
                          size={12}
                          className={
                            mod.status === "completed" ? "text-emerald-500" : "text-muted-foreground/40"
                          }
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-full shrink-0 md:w-48">{moduleCta(mod, track.id, locked)}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
