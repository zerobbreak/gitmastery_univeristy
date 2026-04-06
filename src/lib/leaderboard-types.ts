/** Response for GET /api/leaderboard */
export type LeaderboardPayload = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  query: string;
  entries: Array<{
    rank: number;
    displayName: string;
    totalXp: number;
    totalXpLabel: string;
    streakDays: number;
    masteryLevel: number;
    isYou: boolean;
  }>;
  podium: Array<{
    rank: number;
    displayName: string;
    totalXpLabel: string;
    masteryLevel: number;
    isYou: boolean;
  }>;
};
