"use client";

import { useState, useEffect } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import {
  Terminal as TerminalIcon,
  GitBranch,
  Trophy,
  ArrowRight,
  Code,
  Sparkles,
  Users,
  ShieldCheck,
  Mail,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(1);
  const [activeFeature, setActiveFeature] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isBentoAutoPlaying, setIsBentoAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 4) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  useEffect(() => {
    if (!isBentoAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev % 4) + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, [isBentoAutoPlaying]);

  const steps = [
    {
      id: 1,
      title: "Pick a Module",
      description:
        "Choose from specialized tracks: Foundations for beginners, Team Collaboration for PR masters, or Advanced Rebasing for the experts.",
      command: "git init project-mastery",
      output:
        "Initialized empty Git repository in /users/dev/project-mastery/.git/",
      highlight: "Foundations",
    },
    {
      id: 2,
      title: "Solve Challenges in our Terminal",
      description:
        "Write real commands. No boring multiple-choice quizzes. Our integrated terminal validates your every move against a live Git repository.",
      command: 'git commit -m "feat: complete first challenge"',
      output:
        "[master (root-commit) a1b2c3d] feat: complete first challenge\n 1 file changed, 10 insertions(+)\n create mode 100644 challenge.js",
      highlight: "integrated terminal",
    },
    {
      id: 3,
      title: "Earn XP and Badges",
      description:
        "Level up your dev profile. Every commit, push, and merge earns you XP. Unlock modular achievements that showcase your specific expertise to employers.",
      command: "git log --graph --oneline",
      output:
        '* a1b2c3d (HEAD -> master) feat: initial commit\n* f4e5d6c Add achievement: "Commit Master"\n* b8c9a0d +500 XP Earned',
      highlight: "modular achievements",
    },
    {
      id: 4,
      title: "Submit Projects with Confidence",
      description:
        "Apply your skills directly to your own repositories. Go from fear of losing work to total command of your project history.",
      command: "git push origin main",
      output:
        "Enumerating objects: 5, done.\nCounting objects: 100% (5/5), done.\nDelta compression using up to 8 threads\nTo https://github.com/user/mastery.git\n * [new branch]      main -> main",
      highlight: "losing work",
    },
  ];

  return (
    <div className="flex flex-col w-full selection:bg-primary/30 selection:text-primary">
      {/* Header (truncated for brevity in common use, but keeping full logic here) */}
      <header className="fixed top-3 sm:top-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-3rem)] max-w-[1680px] z-50 px-4 sm:px-8 py-3 sm:py-5 rounded-2xl sm:rounded-[2rem] bg-surface/40 backdrop-blur-xl border border-white/5 shadow-2xl flex justify-between items-center transition-all duration-500 hover:bg-surface/60 hover:border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 font-display font-bold text-base sm:text-lg text-on-surface">
          <TerminalIcon size={20} className="text-primary" />
          <span className="tracking-tight">Git Mastery</span>
        </div>
        <nav className="hidden lg:flex gap-10">
          <a
            href="#features"
            className="text-on-surface-variant font-medium transition-all hover:text-primary text-[0.7rem] uppercase tracking-widest"
          >
            Features
          </a>
          <a
            href="#path"
            className="text-on-surface-variant font-medium transition-all hover:text-primary text-[0.7rem] uppercase tracking-widest"
          >
            Curriculum
          </a>
          <a
            href="#pricing"
            className="text-on-surface-variant font-medium transition-all hover:text-primary text-[0.7rem] uppercase tracking-widest"
          >
            Pricing
          </a>
          <a
            href="#universities"
            className="text-on-surface-variant font-medium transition-all hover:text-primary text-[0.7rem] uppercase tracking-widest"
          >
            For Universities
          </a>
        </nav>
        {/* Auth Buttons */}
        <div className="flex gap-2 sm:gap-4 items-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" className="text-on-surface font-semibold hover:text-primary hidden sm:inline-flex">
                Log in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="font-bold hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] transition-all text-sm sm:text-base">
                Join Now
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <div className="flex items-center gap-2 sm:gap-4">
              <a href="/dashboard">
                <Button className="font-bold hover:shadow-[0_0_20px_rgba(173,198,255,0.4)] transition-all text-sm sm:text-base">
                  Dashboard
                </Button>
              </a>
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden section-padding pt-28 sm:pt-36 md:pt-44 lg:pt-48 grid-bg min-h-screen flex flex-col justify-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-[1680px] mx-auto w-full px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-10 md:gap-16 relative z-10">
          <div className="flex-1 text-left">
            <h1 className="mb-6 md:mb-8 text-3xl sm:text-4xl md:text-5xl lg:text-[5.5rem] font-bold leading-[1.1] tracking-tight text-balance">
              Master the Flow, <br />
              <span className="gradient-text">Automate the Chaos.</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-on-surface-variant mb-8 md:mb-12 leading-relaxed max-w-[600px]">
              Bridge the gap between classroom theory and real-world codebase
              management with an immersive, gamified Git experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-10 md:mb-16">
              <SignedOut>
                <SignUpButton mode="modal">
                  <Button size="lg" className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-2xl font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(173,198,255,0.4)] flex items-center gap-3 text-base md:text-lg">
                    Start Your Git Journey <ArrowRight size={20} />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <Button variant="outline" size="lg" className="h-12 sm:h-14 md:h-16 px-6 sm:px-8 md:px-10 rounded-2xl font-bold bg-secondary/5 border-white/10 hover:bg-secondary/10 transition-all text-base md:text-lg">
                View Curriculum
              </Button>
            </div>

            <div className="pt-10 md:pt-16 border-t border-outline-variant/20 hidden lg:block">
              <p className="text-[0.7rem] font-black text-on-surface-variant uppercase tracking-[0.4em] mb-8 opacity-60">
                Trusted by elite teams at
              </p>
              <div className="flex items-center gap-12 group/logos">
                <div className="flex items-center gap-2 text-xl font-display font-black italic tracking-tighter opacity-25 hover:opacity-100 transition-all duration-500 hover:text-primary cursor-default transform hover:scale-110">
                   <span className="w-2 h-6 bg-primary/40 rounded-full"></span>
                   VORTEX
                </div>
                <div className="flex items-center gap-2 text-xl font-display font-black italic tracking-tighter opacity-25 hover:opacity-100 transition-all duration-500 hover:text-primary cursor-default transform hover:scale-110">
                   <div className="w-5 h-5 rounded-full border-2 border-primary/40 flex items-center justify-center">
                     <div className="w-2 h-2 rounded-full bg-primary/60"></div>
                   </div>
                   ORBIT
                </div>
                <div className="flex items-center gap-2 text-xl font-display font-black italic tracking-tighter opacity-25 hover:opacity-100 transition-all duration-500 hover:text-primary cursor-default transform hover:scale-110">
                   <div className="w-5 h-5 border-2 border-primary/40 rotate-45"></div>
                   CORE_OS
                </div>
              </div>
            </div>
          </div>

          <div className="flex-[1.2] w-full max-w-[800px]">
            <div className="relative group p-1.5 sm:p-2 rounded-2xl sm:rounded-[2.5rem] bg-surface-container-highest/30 backdrop-blur-sm border border-white/5 animate-fade-in glow-primary">
              <div className="bg-surface-container-lowest rounded-2xl sm:rounded-4xl overflow-hidden flex flex-col shadow-2xl">
                <div className="bg-white/5 py-3 sm:py-4 px-4 sm:px-6 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#ff5f56]"></span>
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#ffbd2e]"></span>
                    <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-[#27c93f]"></span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.6rem] sm:text-[0.7rem] font-mono text-on-surface-variant/60 uppercase tracking-widest">
                    <GitBranch size={12} className="text-primary" />{" "}
                    feature/mastery
                  </div>
                </div>
                <div className="p-4 sm:p-6 md:p-10 font-mono text-sm sm:text-base md:text-[1.1rem] leading-relaxed text-[#dae2fd]">
                  <div className="flex gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <span className="text-primary shrink-0">$</span>
                    <span className="flex-1 break-all sm:break-normal">
                      git checkout{" "}
                      <span className="text-secondary font-bold">
                        "feature/mastery"
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <span className="text-on-surface-variant/40 shrink-0">
                      #
                    </span>
                    <span className="text-on-surface-variant/60 italic text-xs sm:text-sm md:text-base">
                      Switched to a new branch 'feature/mastery'
                    </span>
                  </div>
                  <div className="flex gap-3 sm:gap-4 mb-5 sm:mb-8">
                    <span className="text-primary shrink-0">$</span>
                    <span className="flex-1">git status</span>
                  </div>
                  <div className="p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-surface-container-high/50 border border-white/5 mb-5 sm:mb-8">
                    <div className="text-[0.8rem] text-secondary/80 font-bold mb-4 uppercase tracking-[0.2em]">
                      on branch mastery
                    </div>
                    <div className="flex justify-between items-center bg-surface-container-highest/50 p-4 rounded-xl">
                      <div className="flex flex-col gap-1">
                        <span className="text-[0.6rem] uppercase tracking-widest opacity-40">
                          Your Status
                        </span>
                        <span className="text-sm font-bold">+6240 XP</span>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[0.6rem] uppercase tracking-widest opacity-40">
                          Next Level
                        </span>
                        <span className="text-sm font-bold text-primary">
                          Junior Dev
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 items-center h-8">
                    <span className="text-primary shrink-0 opacity-40">
                      $
                    </span>
                    <span className="w-[3px] h-7 bg-primary rounded-full animate-cursor-pulse"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineered for Mastery Section */}
      <section
        id="features"
        className="section-padding bg-surface-container-lowest border-y border-outline-variant/20 relative"
      >
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8">
          <div className="text-center mb-12 sm:mb-16 md:mb-24">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 font-bold tracking-tight">
              Engineered for Mastery.
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg max-w-[700px] mx-auto leading-relaxed">
              Our sandbox environments mirror the pressure and precision of a
              professional engineering team, giving you the edge in real-world
              dev cycles.
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 auto-rows-auto md:auto-rows-[200px] lg:auto-rows-[160px] relative"
            onMouseEnter={() => setIsBentoAutoPlaying(false)}
            onMouseLeave={() => setIsBentoAutoPlaying(true)}
          >
            {/* Active Feature Indicator (Floating Glow) */}
            <div className="absolute -inset-4 pointer-events-none z-0 hidden lg:block">
              {/* This could be a floating icon or background glow that moves, but we'll apply it per-card for better control */}
            </div>

            {/* Card 1: Interactive Challenges - Large */}
            <Card 
              onClick={() => setActiveFeature(1)}
              className={`md:col-span-2 md:row-span-2 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-4xl transition-all duration-700 group overflow-hidden relative flex flex-col justify-between shadow-none cursor-pointer border ${
                activeFeature === 1 
                ? "bg-primary/[0.08] border-primary/40 shadow-[0_0_50px_rgba(173,198,255,0.15)] ring-1 ring-primary/20 scale-[1.01]" 
                : "bg-secondary/5 border-white/5 opacity-80"
              }`}
            >
              <div className={`absolute -right-4 -top-4 w-40 h-40 rounded-full blur-3xl transition-all duration-700 ${activeFeature === 1 ? "bg-primary/20 opacity-100" : "bg-primary/5 opacity-0"}`}></div>

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  activeFeature === 1 ? "bg-primary text-primary-foreground scale-110 shadow-[0_0_20px_rgba(173,198,255,0.4)]" : "bg-primary/10 text-primary"
                }`}>
                  <GitBranch size={28} />
                </div>
                <div className={`flex gap-2 p-2 rounded-xl bg-black/40 border border-white/5 transition-opacity duration-500 ${activeFeature === 1 ? "opacity-100" : "opacity-40"}`}>
                  <span className="w-2 h-2 rounded-full bg-[#ff5f56]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#ffbd2e]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#27c93f]"></span>
                </div>
              </div>

              <div className="relative z-10">
                <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${activeFeature === 1 ? "text-primary" : "text-foreground"}`}>
                  Interactive Challenges
                </h3>
                <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                  Solve complex version control puzzles in a real-time,
                  browser-based terminal environment that validates every
                  command.
                </p>
                <Card className={`mt-8 p-4 bg-[#010409] border transition-all duration-700 font-mono text-[0.7rem] shadow-none ${activeFeature === 1 ? "border-primary/30 translate-y-[-4px]" : "border-white/5 opacity-60"}`}>
                  <div className="flex gap-4 text-primary/60">
                    <span>$ git merge --no-ff feature/mastery</span>
                  </div>
                  <div className="opacity-40 mt-1">
                    Merging... Searching for 3-way merge strategy.
                  </div>
                </Card>
              </div>
            </Card>

            {/* Card 2: AI Coach - Small */}
            <Card 
              onClick={() => setActiveFeature(2)}
              className={`md:col-span-1 md:row-span-2 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-4xl transition-all duration-700 group overflow-hidden relative flex flex-col items-center text-center justify-center shadow-none cursor-pointer border ${
                activeFeature === 2 
                ? "bg-[#ffadd2]/[0.08] border-[#ffadd2]/40 shadow-[0_0_50px_rgba(255,173,210,0.15)] ring-1 ring-[#ffadd2]/20 scale-[1.01]" 
                : "bg-secondary/5 border-white/5 opacity-80"
              }`}
            >
              <div className={`absolute inset-0 bg-linear-to-b from-[#ffadd2]/10 to-transparent transition-opacity duration-700 ${activeFeature === 2 ? "opacity-100" : "opacity-0"}`}></div>
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
                activeFeature === 2 ? "bg-[#ffadd2] text-black scale-110 rotate-12 shadow-[0_0_20px_rgba(255,173,210,0.4)]" : "bg-secondary/10 text-[#ffadd2]"
              }`}>
                <Sparkles size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-4 transition-colors duration-500 ${activeFeature === 2 ? "text-[#ffadd2]" : "text-foreground"}`}>AI Coach</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Get instant, smart hints that guide you towards solution without
                spoiling the "Aha!" moment.
              </p>
            </Card>

            {/* Card 3: Real-World Workflows - Small */}
            <Card 
              onClick={() => setActiveFeature(3)}
              className={`md:col-span-1 md:row-span-2 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-4xl transition-all duration-700 group overflow-hidden relative flex flex-col items-center text-center justify-center shadow-none cursor-pointer border ${
                activeFeature === 3 
                ? "bg-[#adffdd]/[0.08] border-[#adffdd]/40 shadow-[0_0_50px_rgba(173,255,221,0.15)] ring-1 ring-[#adffdd]/20 scale-[1.01]" 
                : "bg-primary/5 border-white/5 opacity-80"
              }`}
            >
              <div className={`absolute inset-0 bg-linear-to-b from-[#adffdd]/10 to-transparent transition-opacity duration-700 ${activeFeature === 3 ? "opacity-100" : "opacity-0"}`}></div>
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-8 transition-all duration-500 ${
                activeFeature === 3 ? "bg-[#adffdd] text-black scale-110 -rotate-12 shadow-[0_0_20px_rgba(173,255,221,0.4)]" : "bg-[#adffdd]/10 text-[#adffdd]"
              }`}>
                <Code size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-4 transition-colors duration-500 ${activeFeature === 3 ? "text-[#adffdd]" : "text-foreground"}`}>Pro Workflows</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Master PR reviews, merge conflicts, and rebase strategies used
                by world-class teams.
              </p>
            </Card>

            {/* Card 4: Gamified Progress - Large */}
            <Card 
              onClick={() => setActiveFeature(4)}
              className={`md:col-span-2 md:row-span-2 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-4xl transition-all duration-700 group overflow-hidden relative flex flex-col md:flex-row gap-6 md:gap-8 items-center shadow-none cursor-pointer border ${
                activeFeature === 4 
                ? "bg-[#ffd2ad]/[0.08] border-[#ffd2ad]/40 shadow-[0_0_50px_rgba(255,210,173,0.15)] ring-1 ring-[#ffd2ad]/20 scale-[1.01]" 
                : "bg-secondary/5 border-white/5 opacity-80"
              }`}
            >
              <div className="flex-1 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  activeFeature === 4 ? "bg-[#ffd2ad] text-black scale-110 shadow-[0_0_20px_rgba(255,210,173,0.4)]" : "bg-[#ffd2ad]/10 text-[#ffd2ad]"
                }`}>
                  <Trophy size={28} />
                </div>
                <h3 className={`text-2xl font-bold mb-4 transition-colors duration-500 ${activeFeature === 4 ? "text-[#ffd2ad]" : "text-foreground"}`}>Gamified Progress</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Earn XP, maintain streaks, and collect rare badges as you
                  advance. Your progress is your portfolio.
                </p>
              </div>
              <Card className={`flex-1 w-full p-6 rounded-3xl bg-black/30 border transition-all duration-700 relative shadow-none ${activeFeature === 4 ? "border-[#ffd2ad]/30 scale-105" : "border-white/5 opacity-60"}`}>
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className={`text-[0.6rem] font-black uppercase tracking-widest border-opacity-40 transition-colors ${activeFeature === 4 ? "text-[#ffd2ad] border-[#ffd2ad] bg-[#ffd2ad]/10" : "text-muted-foreground border-white/10"}`}>
                    Level 12 Mastery
                  </Badge>
                  <span className="text-[0.6rem] font-mono text-muted-foreground">
                    880/1000 XP
                  </span>
                </div>
                <Progress value={88} className={`h-3 mb-6 bg-white/5 transition-all duration-500 ${activeFeature === 4 ? "[&>div]:bg-[#ffd2ad]" : ""}`} />
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeFeature === 4 ? "bg-[#ffd2ad] text-black" : "bg-white/5 text-[#ffd2ad]"}`}>
                    <TerminalIcon size={14} />
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10"></div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10"></div>
                </div>
              </Card>
            </Card>
          </div>
        </div>
      </section>

      {/* Path Mastery Section with INTERACTIVE Terminal */}
      <section
        id="path"
        className="section-padding bg-surface relative overflow-hidden"
      >
        <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row gap-8 md:gap-12 items-stretch px-4 sm:px-8">
          {/* Dynamic Terminal Mockup */}
          <div
            className="flex-[1.4] w-full order-2 md:order-1 flex flex-col justify-center"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div className="relative p-1.5 sm:p-2 rounded-2xl sm:rounded-[2.5rem] bg-white/5 border border-white/5 glow-primary transition-all duration-500 min-h-[320px] sm:min-h-[380px] md:min-h-[460px] flex flex-col">
              <div className="flex-1 bg-[#060e20] rounded-2xl sm:rounded-4xl overflow-hidden flex flex-col shadow-2xl border border-white/5">
                {/* Terminal Header */}
                <div className="bg-white/5 py-3 px-5 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-white/20"></span>
                  </div>
                  <div className="text-[0.65rem] font-mono text-on-surface-variant/40 uppercase tracking-[0.2em]">
                    interactive-demo.sh
                  </div>
                </div>
                {/* Terminal Content */}
                <div className="p-4 sm:p-6 md:p-8 font-mono text-xs sm:text-sm overflow-hidden flex-1 flex flex-col">
                  {/* Previous Commands (History) */}
                  <div className="opacity-40 line-through decoration-primary/30 space-y-4 mb-4 overflow-hidden">
                    {steps.slice(0, activeStep - 1).map((step) => (
                      <div key={step.id}>
                        <div className="text-primary">$ {step.command}</div>
                        <div className="text-on-surface-variant/60 whitespace-pre-wrap mt-1">
                          {step.output}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Active Command */}
                  <div className="space-y-4 animate-fade-in" key={activeStep}>
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-mono">$</span>
                      <span className="text-foreground font-bold font-mono">
                        {steps[activeStep - 1].command}
                      </span>
                      <span className="w-2 h-5 bg-primary/60 animate-pulse"></span>
                    </div>
                    <div className="text-muted-foreground whitespace-pre-wrap leading-relaxed py-3 border-l-2 border-primary/40 pl-4 bg-primary/5 rounded-r-lg font-mono text-xs">
                      {steps[activeStep - 1].output}
                    </div>
                  </div>

                  {/* Special Visuals for Step 3 (XP) */}
                  {activeStep === 3 && (
                    <div className="mt-8 grid grid-cols-2 gap-4 animate-fade-in">
                      <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl text-center">
                        <Trophy
                          className="text-secondary mx-auto mb-2"
                          size={20}
                        />
                        <div className="text-[0.6rem] uppercase tracking-widest text-secondary font-bold">
                          Unlocked
                        </div>
                        <div className="text-xs font-bold">Commit Master</div>
                      </div>
                      <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl text-center">
                        <Sparkles
                          className="text-primary mx-auto mb-2"
                          size={20}
                        />
                        <div className="text-[0.6rem] uppercase tracking-widest text-primary font-bold">
                          XP Bonus
                        </div>
                        <div className="text-xs font-bold">+1,200 XP</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute -bottom-4 -left-4 glass-panel py-3 px-5 rounded-2xl ghost-border flex items-center gap-3 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <span className="text-xs font-bold">0{activeStep}</span>
                </div>
                <div>
                  <div className="text-[0.6rem] uppercase tracking-widest font-black text-on-surface-variant">
                    Current Stage
                  </div>
                  <div className="text-[0.7rem] font-bold text-primary">
                    {steps[activeStep - 1].title}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Steps List */}
          <div className="flex-1 order-1 md:order-2 flex flex-col justify-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-6 sm:mb-8 md:mb-12 tracking-tight">
              Your Path to Git Proficiency.
            </h2>
            <div className="space-y-3 sm:space-y-4 md:space-y-6">
              {steps.map((step) => (
                <Card
                  key={step.id}
                  onClick={() => {
                    setActiveStep(step.id);
                    setIsAutoPlaying(false);
                  }}
                  className={`group cursor-pointer p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl transition-all duration-300 border shadow-none ${
                    activeStep === step.id
                      ? "bg-primary/5 border-primary/40 md:translate-x-3"
                      : "bg-transparent border-transparent hover:bg-white/5 md:hover:translate-x-1"
                  }`}
                >
                  <div className="flex gap-3 sm:gap-4 md:gap-6 items-start">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center font-mono font-bold text-sm sm:text-base shrink-0 transition-all ${
                        activeStep === step.id
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(173,198,255,0.4)]"
                          : "bg-white/5 text-muted-foreground border-white/10 group-hover:border-primary/40"
                      }`}
                    >
                      0{step.id}
                    </div>
                    <div>
                      <h4
                        className={`text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 transition-colors ${activeStep === step.id ? "text-primary" : "text-foreground"}`}
                      >
                        {step.title}
                      </h4>
                      <p
                        className={`text-sm leading-relaxed transition-colors ${activeStep === step.id ? "text-muted-foreground" : "text-muted-foreground/60"}`}
                      >
                        {step.description.split(step.highlight)[0]}
                        <span className="text-foreground font-semibold">
                          {step.highlight}
                        </span>
                        {step.description.split(step.highlight)[1]}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Professional IDE Experience Section */}
      <section className="section-padding bg-surface-container-low w-full overflow-hidden">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-4 sm:mb-6">
              A Professional IDE Experience.
            </h2>
            <p className="text-on-surface-variant text-base sm:text-lg">
              Designed for deep focus and technical rigor.
            </p>
          </div>

          <div className="relative max-w-[1680px] mx-auto">
            <div className="rounded-2xl sm:rounded-[2.5rem] overflow-hidden bg-white/5 p-1.5 sm:p-3 ambient-shadow border border-white/5 glow-secondary animate-fade-in">
              {/* VS Code Style Mockup */}
              <div className="bg-[#0d1117] rounded-2xl sm:rounded-4xl overflow-hidden flex flex-col border border-white/5 shadow-2xl h-[360px] sm:h-[450px] md:h-[520px] lg:h-[600px]">
                {/* Editor Header / Tabs */}
                <div className="bg-[#161b22] px-4 flex items-center justify-between border-b border-white/5">
                  <div className="flex gap-px">
                    <div className="px-4 py-3 bg-[#0d1117] border-t-2 border-primary text-xs font-medium text-on-surface flex items-center gap-2">
                      <Code size={14} className="text-primary" /> challenge.py
                    </div>
                    <div className="px-4 py-3 text-xs font-medium text-on-surface-variant/40 flex items-center gap-2 hover:bg-white/5 cursor-pointer">
                      <Code size={14} /> main.py
                    </div>
                  </div>
                  <div className="flex gap-4 opacity-40 pr-2">
                    <span className="w-3 h-3 rounded-full bg-white/20"></span>
                    <span className="w-3 h-3 rounded-full bg-white/20"></span>
                  </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Sidebar */}
                  <div className="w-10 sm:w-12 bg-[#161b22] hidden sm:flex flex-col items-center py-4 sm:py-6 gap-6 sm:gap-8 border-r border-white/5">
                    <div className="text-primary">
                      <Code size={20} />
                    </div>
                    <div className="text-on-surface-variant/40 hover:text-on-surface transition-colors cursor-pointer">
                      <Users size={20} />
                    </div>
                    <div className="text-on-surface-variant/40 hover:text-on-surface transition-colors cursor-pointer">
                      <GitBranch size={20} />
                    </div>
                    <div className="mt-auto text-on-surface-variant/20">
                      <ShieldCheck size={20} />
                    </div>
                  </div>

                  {/* Editor Area */}
                  <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
                    <div className="flex-1 p-3 sm:p-5 md:p-8 font-mono text-[0.65rem] sm:text-xs md:text-sm leading-relaxed overflow-y-auto custom-scrollbar">
                      <div className="flex gap-6">
                        <div className="text-on-surface-variant/20 text-right select-none w-4">
                          1<br />2<br />3<br />4<br />5<br />6<br />7<br />8
                          <br />9<br />
                          10
                          <br />
                          11
                          <br />
                          12
                        </div>
                        <div className="flex-1 space-y-1">
                          <div>
                            <span className="text-secondary">import</span>{" "}
                            git_mastery
                          </div>
                          <div className="h-2"></div>
                          <div>
                            <span className="text-primary">def</span>{" "}
                            <span className="text-[#dcdcaa]">
                              solve_conflict
                            </span>
                            (source, target):
                          </div>
                          <div className="pl-4">
                            <span className="text-on-surface-variant/40">
                              # Initializing AI Coach protocol
                            </span>
                          </div>
                          <div className="pl-4">
                            coach = git_mastery.
                            <span className="text-[#dcdcaa]">AICoach</span>()
                          </div>
                          <div className="h-2"></div>
                          <div className="pl-4">
                            <span className="text-primary">if</span> coach.
                            <span className="text-[#dcdcaa]">analyze_diff</span>
                            (source, target):
                          </div>
                          <div className="pl-8 text-secondary">
                            return coach.
                            <span className="text-[#dcdcaa]">
                              propose_merged_solution
                            </span>
                            ()
                          </div>
                          <div className="h-2"></div>
                          <div className="pl-4 text-on-surface-variant/40 font-italic">
                            # Submit results to secure bridge
                          </div>
                          <div className="pl-4">
                            git_mastery.
                            <span className="text-[#dcdcaa]">submit</span>
                            (source)
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Integrated Terminal (Bottom) */}
                    <div className="h-[140px] sm:h-[180px] md:h-[220px] bg-[#010409] border-t border-white/10 flex flex-col">
                      <div className="px-3 sm:px-6 py-2 bg-white/5 flex items-center justify-between border-b border-white/5">
                        <div className="flex gap-3 sm:gap-6 text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-wider text-on-surface-variant">
                          <span className="text-primary border-b border-primary pb-0.5">
                            Terminal
                          </span>
                          <span className="opacity-40">Debug Console</span>
                          <span className="opacity-40">Problems</span>
                        </div>
                        <div className="flex gap-3 opacity-20">
                          <Code size={14} />
                          <Sparkles size={14} />
                        </div>
                      </div>
                      <div className="p-3 sm:p-4 md:p-6 font-mono text-[0.65rem] sm:text-xs md:text-sm flex-1 overflow-y-auto">
                        <div className="flex gap-3 mb-2">
                          <span className="text-[#238636]">
                            dev@mastery:~/challenge
                          </span>
                          <span className="text-on-surface-variant/40">$</span>
                          <span className="text-on-surface">
                            git log --graph --oneline
                          </span>
                        </div>
                        <div className="text-on-surface-variant/80 mb-4 ml-8 space-y-1">
                          <div className="flex gap-2">
                            <span className="text-secondary">*</span>{" "}
                            <span className="text-[#d2a8ff]">a1b2c3d</span>{" "}
                            (HEAD {"->"}{" "}
                            <span className="text-primary">master</span>) Merge
                            Conflict Resolved
                          </div>
                          <div className="flex gap-2">
                            <span className="text-secondary">|\</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-secondary">| *</span>{" "}
                            <span className="text-[#d2a8ff]">f4e5d6c</span>{" "}
                            Fixed logic in solve_conflict
                          </div>
                          <div className="flex gap-2">
                            <span className="text-secondary">|/</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-secondary">*</span>{" "}
                            <span className="text-[#d2a8ff]">b8c9a0d</span>{" "}
                            Initializing mastery protocol
                          </div>
                        </div>
                        <div className="flex gap-3 animate-pulse">
                          <span className="text-[#238636]">
                            dev@mastery:~/challenge
                          </span>
                          <span className="text-on-surface-variant/40">$</span>
                          <span className="w-2.5 h-5 bg-primary/40"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professor's Command Center Section */}
      <section id="universities" className="section-padding bg-surface">
        <div className="max-w-[1680px] mx-auto flex flex-col md:flex-row gap-10 md:gap-16 items-center px-4 sm:px-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-5 sm:mb-6 md:mb-8 tracking-tight max-w-md">
              Powering the Future of CS Education.
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant mb-6 sm:mb-8 md:mb-10 leading-relaxed">
              Automate your grading and gain unprecedented insights into how
              students master version control proficiency.
            </p>

            <ul className="space-y-6 mb-12">
              <li className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <h5 className="font-bold mb-1">
                    Centralized Class Management
                  </h5>
                  <p className="text-sm text-on-surface-variant">
                    Monitor progress for 1,000+ students from a single
                    dashboard.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <Sparkles size={14} />
                </div>
                <div>
                  <h5 className="font-bold mb-1">
                    Auto-grading for SSH-based assignments
                  </h5>
                  <p className="text-sm text-on-surface-variant">
                    Scripts that validate student push history automatically.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                  <Users size={14} />
                </div>
                <div>
                  <h5 className="font-bold mb-1">
                    Real-time heatmaps of student pitfalls
                  </h5>
                  <p className="text-sm text-on-surface-variant">
                    Identify common Git mistakes across your entire class
                    instantly.
                  </p>
                </div>
              </li>
            </ul>

            <div className="flex gap-4">
              <button className="bg-surface-container-high text-on-surface border border-outline-variant py-4 px-8 rounded-xl font-bold cursor-pointer transition-all hover:bg-surface-bright font-body">
                Evaluate University Version
              </button>
            </div>
          </div>

          <div className="flex-[1.2] w-full relative">
            <div className="absolute inset-0 bg-primary/5 rounded-3xl blur-[100px]"></div>
            <div className="relative bg-[#0d1117] ghost-border p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-4xl glow-primary shadow-2xl min-h-[400px] sm:min-h-[480px] md:min-h-[560px] flex flex-col">
              {/* Leaderboard Header */}
              <div className="flex items-center justify-between mb-5 sm:mb-6 md:mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Trophy size={18} />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Class Leaderboard</h3>
                    <p className="text-[0.65rem] uppercase tracking-widest text-on-surface-variant/60">
                      CS-101: Systems Programming
                    </p>
                  </div>
                </div>
                <div className="hidden sm:flex -space-x-2">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-high border-2 border-[#0d1117] flex items-center justify-center text-[0.55rem] sm:text-[0.6rem] font-bold">
                    JD
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 border-2 border-[#0d1117] flex items-center justify-center text-[0.55rem] sm:text-[0.6rem] font-bold text-primary">
                    AL
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary/20 border-2 border-[#0d1117] flex items-center justify-center text-[0.55rem] sm:text-[0.6rem] font-bold text-secondary">
                    MK
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#161b22] border-2 border-[#0d1117] flex items-center justify-center text-[0.55rem] sm:text-[0.6rem] font-bold">
                    +12
                  </div>
                </div>
              </div>

              {/* Leaderboard Table */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-12 gap-2 sm:gap-4 px-2 sm:px-4 text-[0.55rem] sm:text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">
                  <div className="col-span-1">#</div>
                  <div className="col-span-6">Student</div>
                  <div className="col-span-3 hidden sm:block">Level</div>
                  <div className="col-span-5 sm:col-span-2 text-right">XP</div>
                </div>

                <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-white/5 p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border border-white/5 animate-fade-in">
                  <div className="col-span-1 text-secondary font-bold text-xs sm:text-sm">1</div>
                  <div className="col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-secondary/40 to-secondary/10 flex items-center justify-center text-secondary font-bold text-[0.6rem] sm:text-xs shadow-inner">
                      JS
                    </div>
                    <div className="text-xs sm:text-sm font-bold truncate">Jordan Smith</div>
                  </div>
                  <div className="col-span-3 hidden sm:block">
                    <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[0.6rem] font-black uppercase tracking-tighter shadow-sm">
                      Senior Dev
                    </span>
                  </div>
                  <div className="col-span-5 sm:col-span-2 text-right text-xs sm:text-sm font-mono font-bold text-secondary">
                    24,450
                  </div>
                </div>

                {/* Hover Mockup Row */}
                <div className="relative group">
                  <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-white/5 p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border border-primary/40 shadow-[0_0_15px_rgba(173,198,255,0.2)] animate-fade-in sm:translate-x-2 ring-1 ring-primary/20">
                    <div className="col-span-1 text-primary font-bold text-xs sm:text-sm">2</div>
                    <div className="col-span-6 flex items-center gap-2 sm:gap-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-linear-to-br from-primary/40 to-primary/10 flex items-center justify-center text-primary font-bold text-[0.6rem] sm:text-xs shadow-inner ring-1 ring-primary/30">
                        AL
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-primary truncate">
                        Alex Lee (You)
                      </div>
                    </div>
                    <div className="col-span-3 hidden sm:block">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[0.6rem] font-black uppercase tracking-tighter shadow-sm">
                        Master
                      </span>
                    </div>
                    <div className="col-span-5 sm:col-span-2 text-right text-xs sm:text-sm font-mono font-bold">
                      18,200
                    </div>
                  </div>

                  {/* Hover Tooltip Mockup */}
                  <div className="absolute -top-16 left-1/4 bg-surface-bright/95 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-outline-variant shadow-2xl z-20 hidden sm:flex items-center gap-3 sm:gap-4 animate-bounce-subtle pointer-events-none">
                    <div className="flex -space-x-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-full border-2 border-surface-bright flex items-center justify-center text-[0.5rem] font-bold ${
                            i % 2 === 0
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary/20 text-secondary"
                          }`}
                        >
                          <Users size={10} />
                        </div>
                      ))}
                    </div>
                    <div className="pr-2 border-r border-outline-variant h-8"></div>
                    <div>
                      <div className="text-[0.6rem] uppercase tracking-[0.2em] font-black text-primary mb-0.5">
                        Active Now
                      </div>
                      <div className="text-[0.65rem] font-bold text-on-surface whitespace-nowrap">
                        Collaborative Lab Session
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-white/5/30 p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border border-white/5 opacity-60">
                  <div className="col-span-1 text-on-surface-variant font-bold text-xs sm:text-sm">
                    3
                  </div>
                  <div className="col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-[0.6rem] sm:text-xs">
                      MK
                    </div>
                    <div className="text-xs sm:text-sm font-bold truncate">Maya K.</div>
                  </div>
                  <div className="col-span-3 hidden sm:block">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant/60 text-[0.6rem] font-black uppercase tracking-tighter">
                      Contributor
                    </span>
                  </div>
                  <div className="col-span-5 sm:col-span-2 text-right text-xs sm:text-sm font-mono font-bold">
                    9,840
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 sm:gap-4 items-center bg-white/5/30 p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl border border-white/5 opacity-40">
                  <div className="col-span-1 text-on-surface-variant font-bold text-xs sm:text-sm">
                    4
                  </div>
                  <div className="col-span-6 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant font-bold text-[0.6rem] sm:text-xs">
                      CW
                    </div>
                    <div className="text-xs sm:text-sm font-bold truncate">Chris Wang</div>
                  </div>
                  <div className="col-span-3 hidden sm:block">
                    <span className="px-2 py-0.5 rounded-full bg-white/5 text-on-surface-variant/60 text-[0.6rem] font-black uppercase tracking-tighter">
                      Pro
                    </span>
                  </div>
                  <div className="col-span-5 sm:col-span-2 text-right text-xs sm:text-sm font-mono font-bold">
                    7,200
                  </div>
                </div>
              </div>

              {/* Professor Control Overlay */}
              <div className="absolute top-4 right-4 py-1.5 px-3 glass-panel rounded-lg border border-white/10 font-display font-bold text-[0.6rem] uppercase tracking-widest text-secondary shadow-xl flex items-center gap-2">
                <Sparkles size={10} /> Live Engagement View
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-12 sm:pt-16 md:pt-24 pb-8 sm:pb-12 px-4 sm:px-8 md:px-16 bg-surface-container-lowest border-t border-outline-variant/20">
        <div className="max-w-[1680px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-12 sm:mb-16 md:mb-20">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 font-display font-bold text-lg sm:text-xl text-on-surface mb-5 sm:mb-8">
                <TerminalIcon size={24} className="text-primary" />
                <span>Git Mastery</span>
              </div>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-5 sm:mb-8 max-w-xs">
                Mastering the art of version control, one commit at a time. The
                ultimate platform for developer excellence.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                >
                  <TerminalIcon size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                >
                  <Mail size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                >
                  <Code size={18} />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all"
                >
                  <Users size={18} />
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-widest text-[0.7rem] text-primary mb-4 sm:mb-8">
                Product
              </h5>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <SignedIn>
                  <li>
                    <a
                      href="/dashboard"
                      className="text-primary font-bold hover:text-primary-container transition-colors"
                    >
                      Dashboard
                    </a>
                  </li>
                </SignedIn>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Curriculum
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Universities
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-widest text-[0.7rem] text-primary mb-4 sm:mb-8">
                Resources
              </h5>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Git Cheat Sheet
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Community
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold uppercase tracking-widest text-[0.7rem] text-primary mb-4 sm:mb-8">
                Company
              </h5>
              <ul className="space-y-4 text-sm text-on-surface-variant">
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 sm:pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-xs text-on-surface-variant/60">
              © 2024 Git Mastery. The Terminal Learning Company.
            </p>
            <div className="flex gap-8 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-on-surface-variant/40">
              <span>v2.0.4-stable</span>
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>{" "}
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
