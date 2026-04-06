"use client";

import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  FlaskConical,
  GraduationCap,
  Lock,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { lessonInlineMarkdownToHtml } from "@/lib/lesson-markdown";
import { getChallengeListHint } from "@/lib/challenge-list-hints";
import { getLessonContent } from "@/lib/module-lesson-content";
import {
  TRACKS,
  challengePath,
  stepPath,
  trackPath,
  type ChallengeDef,
  type ModuleStatus,
  type TrackId,
  type TrackModuleDef,
} from "@/lib/module-routes";
import type { LessonWorkshopExtras } from "@/lib/dashboard-types";
import { WORKSHOP_LABELS } from "@/lib/workshop-copy";
import { getStepsForModule, hasSteps } from "@/lib/module-steps";

function DifficultyBadge({ level }: { level: string }) {
  const n = level.toLowerCase();
  const cls =
    n === "easy" ? "text-easy bg-easy/10"
    : n === "medium" ? "text-medium bg-medium/10"
    : n === "hard" ? "text-hard bg-hard/10"
    : "text-muted-foreground bg-muted/50";
  return <span className={`lc-badge ${cls}`}>{level}</span>;
}

export function ModuleLessonView({
  trackId,
  moduleDef,
  challenges,
  completedChallengeIds,
  liveModuleStatus,
  workshopExtras,
}: {
  trackId: TrackId;
  moduleDef: TrackModuleDef;
  challenges: ChallengeDef[];
  completedChallengeIds: string[];
  liveModuleStatus?: ModuleStatus | null;
  workshopExtras?: LessonWorkshopExtras | null;
}) {
  const content = getLessonContent(trackId, moduleDef.lessonSlug);
  const steps = getStepsForModule(moduleDef.id);
  const moduleHasSteps = hasSteps(moduleDef.id);
  const trackHref = trackPath(trackId);
  const doneSet = new Set(completedChallengeIds);
  const displayStatus = liveModuleStatus ?? moduleDef.status;

  if (!content && !moduleHasSteps) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Link
          href={trackHref}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to {TRACKS[trackId].title}
        </Link>
        <p className="text-sm text-muted-foreground">Lesson content is not available for this module yet.</p>
      </div>
    );
  }

  return (
    <article className="flex h-full flex-col">
      {/* Fixed Header: Breadcrumbs + Title */}
      <div className="shrink-0 mx-auto w-full max-w-3xl space-y-6 pt-6 pb-6">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/modules" className="hover:text-foreground transition-colors font-medium">Problems</Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link href={trackHref} className="hover:text-foreground transition-colors font-medium">
            {TRACKS[trackId].title}
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-foreground font-medium">{moduleDef.title}</span>
        </div>

        {/* Title section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {content?.title ?? moduleDef.title}
            </h1>
            <div className={`lc-badge shrink-0 ${
              displayStatus === "completed" ? "text-easy bg-easy/10"
              : displayStatus === "active" ? "text-primary bg-primary/10"
              : "text-muted-foreground bg-secondary"
            }`}>
              {displayStatus}
            </div>
          </div>
          {content?.eyebrow && (
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">{content.eyebrow}</p>
          )}
          <p className="text-sm leading-relaxed text-muted-foreground">
            {content?.intro ?? moduleDef.summary}
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto w-full max-w-3xl space-y-8 pb-8">
          {workshopExtras && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workshop
              </h2>
              <div className="lc-panel divide-y divide-border/20">
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GraduationCap size={16} className="text-primary shrink-0" />
                      {WORKSHOP_LABELS.checkUnderstanding}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {WORKSHOP_LABELS.checkUnderstandingHint}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                          workshopExtras.pills.quizDone
                            ? "border-emerald-500/30 text-emerald-600"
                            : "border-border/40 text-muted-foreground"
                        }`}
                      >
                        {WORKSHOP_LABELS.quizDone}
                        {workshopExtras.pills.quizDone ? " ✓" : ""}
                      </span>
                    </div>
                  </div>
                  <Button asChild size="sm" className="rounded-none shrink-0">
                    <Link href={workshopExtras.quizHref}>
                      {workshopExtras.pills.quizDone ? WORKSHOP_LABELS.retakeQuiz : WORKSHOP_LABELS.takeQuiz}
                    </Link>
                  </Button>
                </div>
                {workshopExtras.labChallengeIds.length > 0 && (
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FlaskConical size={16} className="text-primary shrink-0" />
                        {WORKSHOP_LABELS.practiceLabs}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {WORKSHOP_LABELS.practiceLabsHint}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border self-start ${
                        workshopExtras.pills.labsDone
                          ? "border-emerald-500/30 text-emerald-600"
                          : "border-border/40 text-muted-foreground"
                      }`}
                    >
                      {WORKSHOP_LABELS.labsDone}
                      {workshopExtras.pills.labsDone ? " ✓" : ""}
                    </span>
                  </div>
                )}
                {displayStatus === "completed" && workshopExtras.reviewDueCount > 0 && (
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <RotateCcw size={16} className="text-amber-500 shrink-0" />
                        {WORKSHOP_LABELS.spacedReview}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{WORKSHOP_LABELS.spacedReviewHint}</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-none border-amber-500/30 text-amber-600 shrink-0">
                      <Link href="/learn/review">
                        {WORKSHOP_LABELS.reviewDue}: {workshopExtras.reviewDueCount}
                      </Link>
                    </Button>
                  </div>
                )}
                <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GraduationCap size={16} className="text-primary shrink-0" />
                      {WORKSHOP_LABELS.improveQueue}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{WORKSHOP_LABELS.improveQueueHint}</p>
                  </div>
                  <Button asChild size="sm" variant="secondary" className="rounded-none shrink-0">
                    <Link href={workshopExtras.improveHref}>{WORKSHOP_LABELS.startImprove}</Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Steps */}
          {moduleHasSteps && steps && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Learning Path</h2>
                <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{steps.length} steps</span>
              </div>
              <div className="lc-panel divide-y divide-border/20">
                {steps.map((step) => (
                  <Link
                    key={step.stepNumber}
                    href={stepPath(trackId, moduleDef.lessonSlug, step.stepNumber)}
                    className="lc-row group"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {step.stepNumber}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium group-hover:text-primary transition-colors">{step.title}</h3>
                      <p
                        className="text-[11px] text-muted-foreground truncate"
                        dangerouslySetInnerHTML={{
                          __html: lessonInlineMarkdownToHtml(step.body.split("\n")[0] ?? ""),
                        }}
                      />
                    </div>
                    <ChevronRight size={14} className="shrink-0 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
              <Link href={stepPath(trackId, moduleDef.lessonSlug, 1)}>
                <Button className="w-full gap-2 font-medium text-[13px]">
                  <BookOpen size={14} />
                  Start Learning
                </Button>
              </Link>
            </div>
          )}

          {/* Challenges list */}
          {challenges.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Challenges</h2>
              <div className="lc-panel divide-y divide-border/20">
                {challenges.map((challenge, index) => {
                  const prevDone =
                    index === 0 || Boolean(doneSet.has(challenges[index - 1]!.id));
                  const thisDone = doneSet.has(challenge.id);
                  const unlocked = prevDone || thisDone;
                  const locked = !unlocked;

                  /** Challenge rows open the simulator for that challenge; the Learning Path above is for concepts first. */
                  const challengeHref = challengePath(
                    trackId,
                    moduleDef.lessonSlug,
                    challenge.slug,
                  );

                  const listHint = getChallengeListHint(challenge);
                  const row = (
                    <div className={`flex items-start gap-4 px-5 py-4 transition-colors ${locked ? "opacity-50" : "hover:bg-white/2"}`}>
                      <div className="shrink-0 pt-0.5">
                        {thisDone ? (
                          <CheckCircle2 size={18} className="text-easy" />
                        ) : locked ? (
                          <Lock size={16} className="text-muted-foreground/40" />
                        ) : (
                          <Circle size={18} className="text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium">{challenge.title}</h3>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                          {listHint}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {workshopExtras?.labChallengeIds.includes(challenge.id) && (
                            <span className="text-[9px] font-bold uppercase tracking-widest text-primary border border-primary/30 px-1.5 py-0">
                              Lab
                            </span>
                          )}
                          <DifficultyBadge level={challenge.difficulty} />
                          <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{challenge.xp} XP</span>
                          {thisDone && <span className="text-[10px] font-semibold text-easy uppercase tracking-wider">Solved</span>}
                        </div>
                      </div>
                      {!locked && <ChevronRight size={14} className="shrink-0 text-muted-foreground/30 mt-1" />}
                    </div>
                  );

                  if (locked) {
                    return <div key={challenge.id}>{row}</div>;
                  }

                  return (
                    <Link
                      key={challenge.id}
                      href={challengeHref}
                      className="block group"
                    >
                      {row}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lesson content sections */}
          {content && !moduleHasSteps && (
            <>
              <div className="space-y-6">
                {content.sections.map((section) => (
                  <section key={section.heading} className="space-y-2">
                    <h2 className="text-base font-semibold tracking-tight">{section.heading}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                  </section>
                ))}
              </div>

              <div className="lc-panel overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/30 bg-card">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Terminal</span>
                </div>
                <div className="p-4 terminal-bg">
                  <ul className="space-y-1.5 font-mono text-[12px] text-muted-foreground">
                    {content.terminal.map((line, i) => (
                      <li key={`terminal-${i}`} className="flex gap-2">
                        <span className="text-primary">$</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Footer nav */}
          <div className="flex flex-wrap items-center gap-4 border-t border-border/30 pt-6">
            <Link
              href={trackHref}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; Back to track
            </Link>
          </div>
        </div>
      </ScrollArea>

      {/* Scroll Indicator */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 border-t border-white/5">
        <ChevronDown size={14} className="animate-bounce" />
        <span>Scroll to navigate</span>
        <ChevronDown size={14} className="animate-bounce" />
      </div>
    </article>
  );
}
