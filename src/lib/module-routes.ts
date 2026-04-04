import { notFound } from "next/navigation";

/** URL segment for each academic track (matches roadmap ids in Modules). */
export const TRACK_IDS = ["foundations", "architecture", "mastery"] as const;
export type TrackId = (typeof TRACK_IDS)[number];

export function isTrackId(value: string): value is TrackId {
  return (TRACK_IDS as readonly string[]).includes(value);
}

export type ModuleStatus = "completed" | "active" | "next" | "locked";

export type ModuleIconName = "GitBranch" | "Code2" | "Layers" | "Cpu";

export interface ChallengeDef {
  id: string;
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  xp: number;
  description: string;
  objectives: { id: string; text: string; completed: boolean }[];
}

export interface TrackModuleDef {
  id: string;
  lessonSlug: string;
  title: string;
  status: ModuleStatus;
  summary: string;
  bullets: string[];
  iconName: ModuleIconName;
  challenges?: ChallengeDef[];
}

export interface TrackDef {
  id: TrackId;
  title: string;
  sub: string;
  year: number;
  level: string;
  yearLabel: string;
  /** When set, /modules/:track redirects here (optional UX). */
  defaultLessonSlug: string;
  locked: boolean;
  modules: TrackModuleDef[];
}

/** Canonical curriculum + URL slugs. Foundations default lesson is git basics. */
export const TRACKS: Record<TrackId, TrackDef> = {
  foundations: {
    id: "foundations",
    title: "Foundations",
    sub: "Core git & ecosystem basics",
    year: 1,
    level: "Beginner",
    yearLabel: "Year 1: Foundations",
    defaultLessonSlug: "git-basics",
    locked: false,
    modules: [
      {
        id: "IMAD5112",
        lessonSlug: "github-ecosystem",
        title: "GitHub Ecosystem Foundations",
        status: "completed",
        summary: "GitHub UI, remotes, and Actions at a high level.",
        bullets: ["Basics of GitHub", "Pushing to repos", "Actions pipelines"],
        iconName: "GitBranch",
      },
      {
        id: "PROG5112",
        lessonSlug: "git-basics",
        title: "Logic & Version Control",
        status: "active",
        summary: "Git objects, commits, branches — the core of version control.",
        bullets: ["Git core basics", "Branching logic", "Commit standards"],
        iconName: "Code2",
        challenges: [
          {
            id: "CHAL101",
            slug: "feature-branching-101",
            title: "Feature Branching 101",
            difficulty: "EASY",
            xp: 250,
            description: "Branches are essential for parallel development. They allow you to work on new features without affecting the main branch stability. In this challenge, you need to isolate your upcoming \"Login\" feature into its own workspace.",
            objectives: [
              { id: "obj1", text: "Create branch feature-login", completed: true },
              { id: "obj2", text: "Stage all current changes", completed: false },
              { id: "obj3", text: "Commit changes with message \"init login\"", completed: false },
            ],
          },
        ],
      },
    ],
  },
  architecture: {
    id: "architecture",
    title: "Architecture",
    sub: "Automation & testing scale",
    year: 2,
    level: "Intermediate",
    yearLabel: "Year 2: Architecture",
    defaultLessonSlug: "merge-conflicts",
    locked: false,
    modules: [
      {
        id: "PROG6112",
        lessonSlug: "merge-conflicts",
        title: "Advanced Git Testing",
        status: "next",
        summary: "CI-aware workflows, test gates, and resolving merge conflicts.",
        bullets: ["Automated testing", "CI/CD integration", "Conflict resolution"],
        iconName: "Layers",
      },
    ],
  },
  mastery: {
    id: "mastery",
    title: "Mastery",
    sub: "Enterprise management",
    year: 3,
    level: "Pro",
    yearLabel: "Year 3: Mastery",
    defaultLessonSlug: "branch-mastery",
    locked: true,
    modules: [
      {
        id: "PROG7313",
        lessonSlug: "branch-mastery",
        title: "Branch Mastery & Management",
        status: "locked",
        summary: "Governance, policies, and advanced automation at scale.",
        bullets: ["Enterprise workflows", "Repo governance", "Advanced automation"],
        iconName: "Cpu",
      },
    ],
  },
};

export function getTrack(track: string): TrackDef | null {
  if (!isTrackId(track)) return null;
  return TRACKS[track];
}

export function lessonPath(track: TrackId, lessonSlug: string): string {
  return `/modules/${track}/${lessonSlug}`;
}

export function trackPath(track: TrackId): string {
  return `/modules/${track}`;
}

export function getModuleByLesson(
  track: TrackId,
  lessonSlug: string,
): TrackModuleDef | null {
  return TRACKS[track].modules.find((m) => m.lessonSlug === lessonSlug) ?? null;
}

/** Resolve curriculum module id to App Router segment (matches dashboard `modules.id`). */
export function getModuleRouteById(
  moduleId: string,
): { track: TrackId; lessonSlug: string } | null {
  for (const trackId of TRACK_IDS) {
    const mod = TRACKS[trackId].modules.find((m) => m.id === moduleId);
    if (mod) return { track: trackId, lessonSlug: mod.lessonSlug };
  }
  return null;
}

export function getChallengeBySlug(
  track: TrackId,
  lessonSlug: string,
  challengeSlug: string,
): ChallengeDef | null {
  const mod = getModuleByLesson(track, lessonSlug);
  return mod?.challenges?.find((c) => c.slug === challengeSlug) ?? null;
}

export function challengePath(
  track: TrackId,
  lessonSlug: string,
  challengeSlug: string,
): string {
  return `/modules/${track}/${lessonSlug}/${challengeSlug}`;
}

/** Resolve track + lesson + challenge or call `notFound()`. */
export function assertChallenge(
  trackParam: string,
  lessonParam: string,
  challengeParam: string,
): { track: TrackId; lesson: TrackModuleDef; challenge: ChallengeDef } {
  const { track, lesson } = assertLesson(trackParam, lessonParam);
  const challenge = getChallengeBySlug(track, lesson.lessonSlug, challengeParam);
  if (!challenge) notFound();
  return { track, lesson, challenge };
}

/** Resolve track + lesson or call `notFound()`. */
export function assertLesson(
  trackParam: string,
  lessonParam: string,
): { track: TrackId; lesson: TrackModuleDef } {
  const track = getTrack(trackParam);
  if (!track) notFound();
  if (track.locked) notFound();
  const lesson = getModuleByLesson(track.id, lessonParam);
  if (!lesson) notFound();
  return { track: track.id, lesson };
}
