/**
 * User-facing labels for workshop learning modes (quizzes, labs, review, improve).
 * Placement: Workshops hub, track page, lesson page, dashboard — keep wording consistent.
 */
export const WORKSHOP_LABELS = {
  checkUnderstanding: "Check understanding",
  checkUnderstandingHint:
    "Short quiz tied to this module’s concepts. Optional XP; strengthens your review schedule when you pass.",
  practiceLabs: "Practice labs",
  practiceLabsHint:
    "Hands-on challenges tagged for this module. Complete them to build muscle memory alongside the lesson.",
  spacedReview: "Spaced review",
  spacedReviewHint:
    "Quick recalls from completed modules on a light schedule (1d → 3d → 7d → 14d). Does not block your path.",
  improveQueue: "Strengthen weak spots",
  improveQueueHint:
    "Concepts that scored below the bar on a recent quiz or review. Short retries until they stick.",
  reviewDue: "Review due",
  quizDone: "Quiz",
  labsDone: "Labs",
  reviewBadge: "Review",
  startReview: "Start review session",
  startImprove: "Open strengthen queue",
  takeQuiz: "Take module quiz",
  retakeQuiz: "Retake quiz",
} as const;

/** Threshold (0–100) for passing a concept or module check. */
export const WORKSHOP_PASS_PERCENT = 70;

/**
 * Phase 1 (shipped): module quiz bank, spaced review scheduling on completed modules,
 * improve queue from quiz attempts below the pass threshold, practice labs = tagged challenges.
 * Phase 2+: inline checks per lesson section, dedicated short lab scenarios beyond tagged challenges.
 */
