"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TRACKS,
  lessonPath,
  stepPath,
  trackPath,
  type TrackId,
  type TrackModuleDef,
} from "@/lib/module-routes";
import { lessonParagraphToHtml } from "@/lib/lesson-markdown";
import { type LessonStep, getTotalSteps } from "@/lib/module-steps";

interface StepNavigation {
  prevHref: string | null;
  nextHref: string | null;
  lessonHref: string;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export function LessonStepView({
  trackId,
  moduleDef,
  step,
  stepNumber,
  totalSteps,
  navigation,
  afterStepsHref,
  afterStepsLabel,
}: {
  trackId: TrackId;
  moduleDef: TrackModuleDef;
  step: LessonStep;
  stepNumber: number;
  totalSteps: number;
  navigation: StepNavigation;
  /** URL for the final-step CTA (e.g. first challenge or lesson). */
  afterStepsHref: string;
  afterStepsLabel: string;
}) {
  const trackHref = trackPath(trackId);
  const progressPercent = (stepNumber / totalSteps) * 100;

  return (
    <article className="mx-auto flex h-full max-w-3xl flex-col pt-6">
      {/* Fixed Header: Breadcrumb + Progress + Step Indicators */}
      <div className="shrink-0 space-y-6 pb-6">
        {/* Breadcrumb */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link href="/modules" className="hover:text-foreground transition-colors font-medium">
              Problems
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link href={trackHref} className="hover:text-foreground transition-colors font-medium">
              {TRACKS[trackId].title}
            </Link>
            <ChevronRight size={12} className="opacity-40 shrink-0" />
            <Link
              href={navigation.lessonHref}
              className="hover:text-foreground transition-colors font-medium"
            >
              {moduleDef.title}
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>
                Step {stepNumber} of {totalSteps}
              </span>
              <span>{Math.round(progressPercent)}% complete</span>
            </div>
            <div className="h-1 w-full overflow-hidden bg-white/5">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const num = i + 1;
            const isCurrent = num === stepNumber;
            const isPast = num < stepNumber;
            return (
              <Link
                key={num}
                href={stepPath(trackId, moduleDef.lessonSlug, num)}
                className={`flex h-8 w-8 items-center justify-center text-xs font-bold transition-all ${
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isPast
                      ? "bg-emerald-500/20 text-emerald-500"
                      : "bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                {isPast ? <CheckCircle2 size={14} /> : num}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-8 pb-8">
          {/* Step Content */}
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="rounded-none border-primary/20 bg-primary/5 text-[9px] font-bold uppercase tracking-widest text-primary"
            >
              Step {stepNumber}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{step.title}</h1>
            <div className="prose prose-invert max-w-none">
              {step.body.split("\n\n").map((paragraph, i) => (
                <p
                  key={i}
                  className="text-base leading-relaxed text-muted-foreground"
                  dangerouslySetInnerHTML={{
                    __html: lessonParagraphToHtml(paragraph),
                  }}
                />
              ))}
            </div>
          </div>

          {/* Terminal Commands */}
          {step.terminal && step.terminal.length > 0 && (
            <div className="border border-white/5 bg-[#0a0a0a] p-6">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Try These Commands
              </h3>
              <ul className="space-y-2 font-mono text-[11px] text-muted-foreground">
                {step.terminal.map((line, i) => (
                  <li key={`terminal-${i}`} className="flex gap-2">
                    <span className="text-primary">$</span>
                    <span className="text-foreground">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tip Box */}
          {step.tip && (
            <div className="flex gap-4 border border-amber-500/20 bg-amber-500/5 p-4">
              <Lightbulb size={20} className="shrink-0 text-amber-500" />
              <p className="text-sm leading-relaxed text-muted-foreground">{step.tip}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-white/5 pt-8">
            {navigation.prevHref ? (
              <Link href={navigation.prevHref}>
                <Button
                  variant="outline"
                  className="gap-2 rounded-none border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  <ArrowLeft size={14} />
                  Previous Step
                </Button>
              </Link>
            ) : (
              <Link href={navigation.lessonHref}>
                <Button
                  variant="outline"
                  className="gap-2 rounded-none border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10"
                >
                  <ArrowLeft size={14} />
                  Back to Overview
                </Button>
              </Link>
            )}

            {navigation.nextHref ? (
              <Link href={navigation.nextHref}>
                <Button className="gap-2 rounded-none text-[10px] font-bold uppercase tracking-widest">
                  Next Step
                  <ArrowRight size={14} />
                </Button>
              </Link>
            ) : (
              <Link href={afterStepsHref}>
                <Button className="gap-2 rounded-none text-[10px] font-bold uppercase tracking-widest">
                  {afterStepsLabel}
                  <ChevronRight size={14} />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Scroll Indicator - Fixed at bottom */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-4 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 border-t border-white/5">
        <ChevronDown size={14} className="animate-bounce" />
        <span>Scroll to navigate</span>
        <ChevronDown size={14} className="animate-bounce" />
      </div>
    </article>
  );
}
