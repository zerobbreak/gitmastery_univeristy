/** Mirrors user_module_progress + modules.track_year for curriculum UI. */
export type LearningPathModuleStatus =
  | "locked"
  | "active"
  | "next"
  | "completed";

/** Workshop / spaced review / improve (from GET /api/dashboard). */
export type ImproveItem = {
  conceptId: string;
  moduleId: string;
  conceptTitle: string;
  href: string;
};

/** Per-module workshop pills (track + lesson UIs). */
export type ModuleWorkshopPill = {
  quizDone: boolean;
  labsDone: boolean;
  reviewDue: number;
};

/** Lesson page workshop panel (from server). */
export type LessonWorkshopExtras = {
  quizHref: string;
  reviewDueCount: number;
  improveHref: string;
  labChallengeIds: readonly string[];
  pills: ModuleWorkshopPill;
};

export type LearningModesPayload = {
  reviewDueCount: number;
  improveCount: number;
  improveItems: ImproveItem[];
};

/** Response shape for GET /api/dashboard (client-safe). */
export type DashboardPayload = {
  user: {
    displayName: string;
    masteryLevel: number;
    totalXp: number;
    totalXpLabel: string;
    streakDays: number;
    globalRank: number;
    totalLearners: number;
    topPercentLabel: string;
  };
  headline: {
    welcomeName: string;
    subtitle: string;
  };
  activeModule: {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    xpReward: number;
    progressPercent: number;
    videoBriefAvailable: boolean;
    /** Lesson or track URL to resume where the learner left off */
    resumeHref: string;
  } | null;
  learningPath: Array<{
    moduleId: string;
    title: string;
    level: string;
    xp: number;
    done: boolean;
    status: LearningPathModuleStatus;
    trackYear: number;
    resumeHref: string;
  }>;
  leaderboardPreview: Array<{
    rank: number;
    displayName: string;
    xpLabel: string;
    isYou: boolean;
  }>;
  recentActivity: Array<{
    id: number;
    title: string;
    timeLabel: string;
  }>;
  heatmap: number[];
  coachHint: string;
  activityYearLabel: string;
  /** Pro track is listed but lessons stay locked in progression until Intermediate is fully complete. */
  trackAccess: {
    pro: boolean;
  };
  learningModes: LearningModesPayload;
};
