"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import {
  CheckCircle2,
  ChevronRight,
  GitBranch,
  Trophy,
  Zap,
  Target,
  Award,
  ShieldCheck,
  Flame,
  Terminal,
  Code2,
  Cpu,
} from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function Workshops() {
  const { isLoaded, isSignedIn } = useAuth();

  const achievements = [
    { title: "First Commit", icon: <GitBranch size={16} />, unlocked: true, date: "2 days ago" },
    { title: "Conflict Crusher", icon: <ShieldCheck size={16} />, unlocked: true, date: "Yesterday" },
    { title: "Rebase Master", icon: <Zap size={16} />, unlocked: false, progress: 65 },
    { title: "CI/CD Architect", icon: <Cpu size={16} />, unlocked: false, progress: 10 },
  ];

  const workshops = [
    {
      id: "W-01",
      title: "The Git Beginner Path",
      level: "Beginner",
      desc: "Master the fundamental commands and mental model of version control.",
      skills: ["Commits", "Branching", "Merging"],
      status: "completed",
      xp: 1200,
    },
    {
      id: "W-02",
      title: "Intermediate Workflows",
      level: "Intermediate",
      desc: "Learn collaborative strategies, rebasing, and managing remotes.",
      skills: ["Rebasing", "Stashing", "Upstream Sync"],
      status: "active",
      xp: 2400,
    },
    {
      id: "W-03",
      title: "The Professional Architect",
      level: "Pro",
      desc: "Advanced automation, custom hooks, and large-scale repo management.",
      skills: ["Git Hooks", "Submodules", "LFS"],
      status: "locked",
      xp: 5000,
    },
  ];

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      <AppHeader />

      <main className="mx-auto w-full px-8 py-12">
        <div className="flex flex-col gap-16">
          {/* Hero Section */}
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Target size={12} />
              Skill Progression
            </div>
            <h1 className="text-5xl font-bold tracking-tight">Workshops: <span className="text-muted-foreground">Beginner to Pro</span></h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Intensive, hands-on training sessions designed to take you from your first commit to architecting enterprise-grade CI/CD pipelines.
            </p>
          </div>

          {/* Achievements Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Achievements</h3>
              <button className="text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">View All Badges</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {achievements.map((item, i) => (
                <div key={i} className={`p-6 border ${item.unlocked ? 'bg-white/5 border-primary/20' : 'bg-white/[0.01] border-white/5 opacity-60'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 flex items-center justify-center rounded-lg border ${item.unlocked ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}>
                      {item.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold tracking-tight">{item.title}</h4>
                      {item.unlocked ? (
                        <div className="text-[9px] font-bold uppercase text-primary/60 tracking-widest">Unlocked {item.date}</div>
                      ) : (
                        <div className="w-24 space-y-1">
                          <div className="flex justify-between text-[8px] font-bold uppercase text-muted-foreground">
                            <span>Progress</span>
                            <span>{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className="h-1 bg-white/5" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progression Path */}
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/5" />
              <div className="flex items-center gap-3 px-4 py-1.5 bg-white/[0.02] border border-white/5 rounded-sm">
                <Flame size={14} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">The Mastery Path</span>
              </div>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="grid grid-cols-1 gap-8">
              {workshops.map((ws, i) => (
                <div key={ws.id} className={`group relative grid grid-cols-1 md:grid-cols-12 border ${ws.status === 'active' ? 'bg-white/2 border-primary/20' : 'bg-white/1 border-white/5'} transition-all hover:bg-white/2`}>
                  {/* Left: Info */}
                  <div className="md:col-span-7 p-10 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{ws.id}</span>
                        <Badge variant="outline" className={`rounded-none border-white/10 text-[9px] font-bold uppercase tracking-widest px-3 ${
                          ws.level === 'Pro' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' : 
                          ws.level === 'Intermediate' ? 'text-primary border-primary/20 bg-primary/5' : 
                          'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                        }`}>
                          {ws.level}
                        </Badge>
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight">{ws.title}</h2>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                        {ws.desc}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {ws.skills.map((skill, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Action/Status */}
                  <div className="md:col-span-5 bg-white/[0.01] border-l border-white/5 p-10 flex flex-col justify-center items-center text-center space-y-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Workshop Reward</div>
                      <div className="text-2xl font-black tabular-nums text-primary">+{ws.xp} XP</div>
                    </div>

                    {ws.status === 'completed' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Certified</span>
                      </div>
                    ) : ws.status === 'active' ? (
                      <Button className="w-full rounded-none font-bold uppercase tracking-widest text-[10px] h-12 bg-primary text-primary-foreground hover:bg-primary/90">
                        Enter Workshop
                      </Button>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <div className="h-12 w-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground">
                          <Target size={24} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Locked</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Skills to Learn */}
          <div className="space-y-8 pt-12 border-t border-white/3">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Critical Skills for Mastery</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { title: "Surgical Rebasing", desc: "Learn to rewrite history with precision, keeping your commit graph clean and meaningful.", icon: <Zap size={18} /> },
                { title: "Pipeline Debugging", desc: "Master the art of troubleshooting CI/CD workflows and optimizing runtimes.", icon: <Terminal size={18} /> },
                { title: "Security & Compliance", desc: "Implement secret scanning and branch protection rules to keep your codebase safe.", icon: <ShieldCheck size={18} /> },
              ].map((skill, i) => (
                <div key={i} className="space-y-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-white/5 text-primary">
                    {skill.icon}
                  </div>
                  <h4 className="text-base font-bold tracking-tight">{skill.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {skill.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
