"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api";
import type { PublicWorkshopQuizQuestion } from "@/lib/workshop-quizzes";
import { WORKSHOP_LABELS } from "@/lib/workshop-copy";

export function ReviewSessionClient({
  segments,
}: {
  segments: Array<{ moduleId: string; questions: PublicWorkshopQuizQuestion[] }>;
}) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ totalPercent: number } | null>(null);

  const flat = segments.flatMap((s) => s.questions);
  const totalQ = flat.length;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const segs = segments.map((s) => {
        const ans: Record<string, number> = {};
        for (const q of s.questions) {
          const v = answers[q.id];
          if (v !== undefined) ans[q.id] = v;
        }
        return { moduleId: s.moduleId, answers: ans };
      });
      const res = await fetchWithAuth(
        "/api/workshop/quiz",
        getToken,
        {
          method: "POST",
          body: JSON.stringify({
            mode: "review",
            segments: segs,
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
      const avg =
        json.results.length === 0
          ? 0
          : Math.round(
              json.results.reduce((s, r) => s + r.totalPercent, 0) /
                json.results.length,
            );
      setResult({ totalPercent: avg });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (totalQ === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          No concepts are due for review right now. Complete modules and check back after the
          scheduled review date.
        </p>
        <Button asChild variant="outline" className="rounded-none">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <h1 className="text-xl font-semibold tracking-tight">{WORKSHOP_LABELS.spacedReview}</h1>
        <p className="text-sm text-muted-foreground">
          Average score across modules:{" "}
          <span className="font-mono tabular-nums text-foreground">{result.totalPercent}%</span>
        </p>
        <Button asChild className="rounded-none">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{WORKSHOP_LABELS.spacedReview}</h1>
        <p className="text-sm text-muted-foreground">{WORKSHOP_LABELS.spacedReviewHint}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-10">
        {segments.map((seg) => (
          <div key={seg.moduleId} className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Module {seg.moduleId}
            </h2>
            {seg.questions.map((q, idx) => (
              <div key={q.id} className="space-y-3 border-b border-border/30 pb-6 last:border-0">
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
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          disabled={submitting || Object.keys(answers).length < totalQ}
          className="rounded-none font-semibold"
        >
          {submitting ? "Submitting…" : WORKSHOP_LABELS.startReview}
        </Button>
        <Button type="button" variant="ghost" asChild className="rounded-none">
          <Link href="/dashboard">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
