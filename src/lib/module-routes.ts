import { notFound } from "next/navigation";

import { hasSteps } from "@/lib/module-steps";

/** URL segment for each difficulty tier (Problems tabs + lesson routes). */
export const TRACK_IDS = ["foundations", "intermediate", "pro"] as const;
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
    yearLabel: "Foundations · Beginner",
    defaultLessonSlug: "git-basics",
    locked: false,
    modules: [
      {
        id: "PROG5112",
        lessonSlug: "git-basics",
        title: "Getting Started with Git",
        status: "active",
        summary: "Learn git init, staging, commits, and branches — the foundation of all version control.",
        bullets: ["Initializing repos with git init", "Staging & committing changes", "Creating branches"],
        iconName: "Code2",
      },
      {
        id: "IMAD5112",
        lessonSlug: "github-ecosystem",
        title: "GitHub Ecosystem Foundations",
        status: "next",
        summary: "Connect local Git to GitHub: authentication, remotes, pushes, and Actions.",
        bullets: ["Pushing to GitHub", "Remotes & upstream", "Actions pipelines"],
        iconName: "GitBranch",
      },
      {
        id: "PROG6212",
        lessonSlug: "remote-management",
        title: "Remote Repository Management",
        status: "next",
        summary: "Master working with remotes, forks, and keeping repositories in sync.",
        bullets: ["Understanding remotes", "Multiple remotes", "Syncing forks"],
        iconName: "GitBranch",
      },
    ],
  },
  intermediate: {
    id: "intermediate",
    title: "Intermediate",
    sub: "Automation, testing, and team workflows at scale",
    year: 2,
    level: "Intermediate",
    yearLabel: "Intermediate",
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
      {
        id: "PROG6213",
        lessonSlug: "pull-requests",
        title: "Pull Request Mastery",
        status: "next",
        summary: "Create effective PRs, conduct code reviews, and merge with confidence.",
        bullets: ["Creating PRs", "Code review workflow", "Merge strategies"],
        iconName: "GitBranch",
      },
      {
        id: "PROG6214",
        lessonSlug: "git-recovery",
        title: "Git History & Recovery",
        status: "next",
        summary: "Navigate history, recover lost work, and debug with bisect.",
        bullets: ["Reading history", "Reflog recovery", "Cherry-pick & bisect"],
        iconName: "Layers",
      },
    ],
  },
  pro: {
    id: "pro",
    title: "Pro",
    sub: "Enterprise governance, advanced Git, and a full open-source style capstone",
    year: 3,
    level: "Pro",
    yearLabel: "Pro",
    defaultLessonSlug: "branch-mastery",
    locked: false,
    modules: [
      {
        id: "PROG7313",
        lessonSlug: "branch-mastery",
        title: "Branch Mastery & Management",
        status: "next",
        summary: "Branch protection, CODEOWNERS, and release tagging for governed repos.",
        bullets: ["Branch protection rules", "Governance & conventions", "Releases and stability"],
        iconName: "Cpu",
      },
      {
        id: "PROG7314",
        lessonSlug: "interactive-rebase",
        title: "Interactive Rebase Mastery",
        status: "next",
        summary: "Rewrite local history safely: squash, reword, and reorder before review.",
        bullets: ["git rebase -i", "Squash & fixup", "When to rebase vs merge"],
        iconName: "Layers",
      },
      {
        id: "PROG7315",
        lessonSlug: "advanced-merge-strategies",
        title: "Advanced Merge Strategies",
        status: "next",
        summary: "Merge options, rerere, and resolving messy integrations.",
        bullets: ["Merge strategies & rerere", "Complex conflicts", "Team merge policy"],
        iconName: "GitBranch",
      },
      {
        id: "PROG7316",
        lessonSlug: "git-hooks-automation",
        title: "Git Hooks & Automation",
        status: "next",
        summary: "Automate quality gates with client-side hooks and CI alignment.",
        bullets: ["pre-commit / pre-push", "Commit-msg conventions", "Hooks vs CI"],
        iconName: "Cpu",
      },
      {
        id: "PROG7317",
        lessonSlug: "monorepo-submodules",
        title: "Monorepos & Submodules",
        status: "next",
        summary: "Compose repositories: submodules, subtrees, and sparse checkouts.",
        bullets: ["git submodule", "Subtree basics", "Scaling huge repos"],
        iconName: "Layers",
      },
      {
        id: "PROG7318",
        lessonSlug: "security-history",
        title: "Security & History Rewriting",
        status: "next",
        summary: "Remove leaked secrets, sign commits, and prevent repeats.",
        bullets: ["filter-repo mindset", "Signed commits", "Secrets hygiene"],
        iconName: "GitBranch",
      },
      {
        id: "PROG7319",
        lessonSlug: "git-internals",
        title: "Git Internals & Troubleshooting",
        status: "next",
        summary: "Objects, packfiles, fsck, and debugging real repositories.",
        bullets: ["Objects & cat-file", "fsck & integrity", "blame & pickaxe"],
        iconName: "Cpu",
      },
      {
        id: "PROG7320",
        lessonSlug: "full-project-capstone",
        title: "Full Project: Fork to Push",
        status: "next",
        summary: "End-to-end: branch, remotes, fetch, merge conflicts mindset, PR-ready push.",
        bullets: ["Combines Foundations + Intermediate + Pro flows", "Realistic OSS fork", "Checklist-driven"],
        iconName: "GitBranch",
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

/** Workshop “Check understanding” quiz for a lesson. */
export function lessonQuizPath(track: TrackId, lessonSlug: string): string {
  return `/modules/${track}/${lessonSlug}/quiz`;
}

export const LEARN_REVIEW_PATH = "/learn/review";
export const LEARN_IMPROVE_PATH = "/learn/improve";

export function trackPath(track: TrackId): string {
  return `/modules/${track}`;
}

export function getModuleByLesson(
  track: TrackId,
  lessonSlug: string,
): TrackModuleDef | null {
  return TRACKS[track].modules.find((m) => m.lessonSlug === lessonSlug) ?? null;
}

export function getTrackModuleDefByModuleId(
  moduleId: string,
): { track: TrackId; lesson: TrackModuleDef } | null {
  for (const trackId of TRACK_IDS) {
    const mod = TRACKS[trackId].modules.find((m) => m.id === moduleId);
    if (mod) return { track: trackId, lesson: mod };
  }
  return null;
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

/**
 * Deep link for dashboard / “resume” navigation. Locked tracks use the track overview
 * (lessons 404 until unlocked); otherwise the lesson page for that module.
 */
export function getModuleResumeHref(moduleId: string): string {
  const route = getModuleRouteById(moduleId);
  if (!route) return "/modules";
  const track = TRACKS[route.track];
  if (track.locked) return trackPath(route.track);
  return lessonPath(route.track, route.lessonSlug);
}

export function challengePath(
  track: TrackId,
  lessonSlug: string,
  challengeSlug: string,
): string {
  return `/modules/${track}/${lessonSlug}/${challengeSlug}`;
}

/**
 * Next challenge in the same module (client fallback). `orderedSlugs` must match DB sort order.
 */
export function getNextHrefAfterChallengesInModule(
  trackId: TrackId,
  lessonSlug: string,
  challengeSlug: string,
  orderedSlugs: string[],
): string {
  const moduleDef = getModuleByLesson(trackId, lessonSlug);
  const moduleId = moduleDef?.id;
  const idx = orderedSlugs.indexOf(challengeSlug);
  if (idx !== -1 && idx + 1 < orderedSlugs.length) {
    if (moduleId && hasSteps(moduleId)) {
      return stepPath(trackId, lessonSlug, 1);
    }
    return challengePath(trackId, lessonSlug, orderedSlugs[idx + 1]!);
  }
  return lessonPath(trackId, lessonSlug);
}

export function firstChallengePathOrLesson(
  trackId: TrackId,
  lessonSlug: string,
  firstChallengeSlug: string | null,
): string {
  if (firstChallengeSlug) {
    return challengePath(trackId, lessonSlug, firstChallengeSlug);
  }
  return lessonPath(trackId, lessonSlug);
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

/** Build URL path for a specific step within a lesson. */
export function stepPath(track: TrackId, lessonSlug: string, stepNumber: number): string {
  return `/modules/${track}/${lessonSlug}/step/${stepNumber}`;
}

/** Get navigation URLs for a step (prev, next, lesson index). */
export function getStepNavigation(
  track: TrackId,
  lessonSlug: string,
  stepNumber: number,
  totalSteps: number,
): {
  prevHref: string | null;
  nextHref: string | null;
  lessonHref: string;
  isFirstStep: boolean;
  isLastStep: boolean;
} {
  const lessonHref = lessonPath(track, lessonSlug);
  const isFirstStep = stepNumber === 1;
  const isLastStep = stepNumber === totalSteps;

  return {
    prevHref: isFirstStep ? null : stepPath(track, lessonSlug, stepNumber - 1),
    nextHref: isLastStep ? null : stepPath(track, lessonSlug, stepNumber + 1),
    lessonHref,
    isFirstStep,
    isLastStep,
  };
}

/** Resolve track + lesson + step or call `notFound()`. */
export function assertStep(
  trackParam: string,
  lessonParam: string,
  stepParam: string,
): { track: TrackId; lesson: TrackModuleDef; stepNumber: number } {
  const { track, lesson } = assertLesson(trackParam, lessonParam);
  const stepNumber = parseInt(stepParam, 10);
  if (isNaN(stepNumber) || stepNumber < 1) notFound();
  return { track, lesson, stepNumber };
}
