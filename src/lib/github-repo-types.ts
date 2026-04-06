/** GitHub repo row from GET /api/repos (matches API JSON). */
export type GitHubRepoRow = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  default_branch: string;
  updated_at: string | null;
};
