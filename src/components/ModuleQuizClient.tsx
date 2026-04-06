"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import type { PublicWorkshopQuizQuestion } from "@/lib/workshop-quizzes";
import { WORKSHOP_LABELS } from "@/lib/workshop-copy";
import { TRACKS, type TrackId } from "@/lib/module-routes";

export type ModuleQuizMode = "learning" | "review" | "improve";

export function ModuleQuizClient({
  trackId,
  lessonSlug,
  moduleId,
  moduleTitle,
  mode,
  questions,
}: {
  trackId: TrackId;
  lessonSlug: string;
  moduleId: string;
  moduleTitle: string;
  mode: ModuleQuizMode;
  questions: PublicWorkshopQuizQuestion[];
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    totalPercent: number;
  } | null>(null);

  const title = useMemo(() => {
    if (mode === "review") return "Spaced review";
    if (mode === "improve") return WORKSHOP_LABELS.improveQueue;
    return WORKSHOP_LABELS.checkUnderstanding;
  }, [mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(
        "/api/workshop/quiz",
        getToken,
        {
          method: "POST",
          body: JSON.stringify({
            mode,
            segments: [{ moduleId, answers }],
          }),
        },
      );
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as {
        results: Array<{ moduleId: string; totalPercent: number }>;
      };
      const seg = json.results.find((r) => r.moduleId === moduleId);
      setResult({ totalPercent: seg?.totalPercent ?? 0 });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  const trackHref = `/modules/${trackId}`;
  const lessonHref = `/modules/${trackId}/${lessonSlug}`;

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Link
          href={lessonHref}
          className="text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          &larr; Back to lesson
        </Link>
        <p className="text-sm text-muted-foreground">
          No quiz questions are configured for this module yet.
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Score: <span className="font-mono tabular-nums text-foreground">{result.totalPercent}%</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-none">
            <Link href={lessonHref}>Back to lesson</Link>
          </Button>
          <Button variant="ghost" className="rounded-none" onClick={() => setResult(null)}>
            Retake
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Link href="/modules" className="hover:text-foreground">
            Problems
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link href={trackHref} className="hover:text-foreground">
            {TRACKS[trackId].title}
          </Link>
          <ChevronRight size={12} className="opacity-40" />
          <Link href={lessonHref} className="hover:text-foreground">
            {moduleTitle}
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "improve"
            ? WORKSHOP_LABELS.improveQueueHint
            : WORKSHOP_LABELS.checkUnderstandingHint}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {questions.map((q, idx) => (
          <div key={q.id} className="space-y-3 border-b border-border/30 pb-8 last:border-0">
            <p className="text-sm font-medium leading-relaxed">
              <span className="text-muted-foreground">Q{idx + 1}. </span>
              {q.prompt}
            </p>
            <div className="grid gap-2">
              {q.choices.map((choice, i) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition-colors ${
                    answers[q.id] === i
                      ? "border-primary bg-primary/5"
                      : "border-border/40 hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    className="mt-1"
                    checked={answers[q.id] === i}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={submitting || Object.keys(answers).length < questions.length}
          className="rounded-none font-semibold"
        >
          {submitting ? "Submitting…" : "Submit answers"}
        </Button>
        <Button type="button" variant="ghost" asChild className="rounded-none">
          <Link href={lessonHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
