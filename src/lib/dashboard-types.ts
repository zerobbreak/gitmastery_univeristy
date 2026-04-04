/** Mirrors user_module_progress + modules.track_year for curriculum UI. */
export type LearningPathModuleStatus =
  | "locked"
  | "active"
  | "next"
  | "completed";

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
  } | null;
  learningPath: Array<{
    moduleId: string;
    title: string;
    level: string;
    xp: number;
    done: boolean;
    status: LearningPathModuleStatus;
    trackYear: number;
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
};
