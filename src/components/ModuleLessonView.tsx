"use client";

import { ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getLessonContent } from "@/lib/module-lesson-content";
import {
  challengePath,
  lessonPath,
  trackPath,
  type TrackId,
  type TrackModuleDef,
} from "@/lib/module-routes";

export function ModuleLessonView({
  trackId,
  moduleDef,
}: {
  trackId: TrackId;
  moduleDef: TrackModuleDef;
}) {
  const content = getLessonContent(trackId, moduleDef.lessonSlug);
  const trackHref = trackPath(trackId);

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={trackHref}
          className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {moduleDef.title}
        </Link>
        <p className="text-muted-foreground">Lesson content is not available for this module yet.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl space-y-12">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Link
            href="/modules"
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Curriculum
          </Link>
          <span className="text-[10px] text-muted-foreground/40">/</span>
          <Link
            href={trackHref}
            className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {trackId}
          </Link>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{content.eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{content.title}</h1>
        <p className="text-base leading-relaxed text-muted-foreground">{content.intro}</p>
        <Badge
          variant="outline"
          className={`rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest ${
            moduleDef.status === "completed"
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"
              : moduleDef.status === "active"
                ? "border-primary/20 bg-primary/5 text-primary"
                : "text-muted-foreground"
          }`}
        >
          {moduleDef.status}
        </Badge>
      </div>

      {moduleDef.challenges && moduleDef.challenges.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Challenges
          </h2>
          <div className="grid gap-4">
            {moduleDef.challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={challengePath(trackId, moduleDef.lessonSlug, challenge.slug)}
                className="group flex items-center justify-between border border-white/5 bg-white/1 p-6 transition-all hover:bg-white/3"
              >
                <div className="space-y-1">
                  <h3 className="text-lg font-bold tracking-tight group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
                      {challenge.difficulty}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {challenge.xp} XP
                    </span>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <ChevronRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-10">
        {content.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight">{section.heading}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="border border-white/5 bg-[#0a0a0a] p-6">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Terminal
        </h3>
        <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
          {content.terminal.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-primary">$</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-white/5 pt-8">
        <Link
          href={trackHref}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          <CheckCircle2 size={14} className="text-primary" />
          Back to track
        </Link>
        {moduleDef.lessonSlug !== "git-basics" && trackId === "foundations" && (
          <Link
            href={lessonPath("foundations", "git-basics")}
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary hover:underline"
          >
            Go to Git basics
          </Link>
        )}
      </div>
    </article>
  );
}
