"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import {
  Trophy,
  Medal,
  Crown,
  ChevronUp,
  ChevronDown,
  Zap,
  Target,
  Search,
} from "lucide-react";
import Link from "next/link";

import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Leaderboard() {
  const { isLoaded, isSignedIn } = useAuth();

  const topThree = [
    { name: "Sarah.dev", xp: "15.2k", rank: 1, level: 14, color: "text-amber-400" },
    { name: "You", xp: "12.4k", rank: 2, level: 12, me: true, color: "text-slate-300" },
    { name: "AlexCodes", xp: "11.9k", rank: 3, level: 11, color: "text-amber-700" },
  ];

  const rankings = [
    { name: "Sarah.dev", xp: "15,240", rank: 1, change: "up", streak: 24 },
    { name: "You", xp: "12,450", rank: 2, change: "none", streak: 14, me: true },
    { name: "AlexCodes", xp: "11,920", rank: 3, change: "down", streak: 8 },
    { name: "null_pointer", xp: "10,800", rank: 4, change: "up", streak: 32 },
    { name: "git_gud_v2", xp: "9,650", rank: 5, change: "none", streak: 5 },
    { name: "rebase_master", xp: "8,900", rank: 6, change: "up", streak: 12 },
    { name: "terminal_wizard", xp: "8,420", rank: 7, change: "down", streak: 3 },
    { name: "code_luminary", xp: "7,800", rank: 8, change: "up", streak: 19 },
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Trophy size={12} />
                Global Rankings
              </div>
              <h1 className="text-5xl font-bold tracking-tight">Classroom <span className="text-muted-foreground">Elite</span></h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                The world's top Git Masters and CI/CD Architects. Compete for the top spot by completing modules, earning badges, and maintaining streaks.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-1 rounded-sm">
              <button className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground">Global</button>
              <button className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Weekly</button>
              <button className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Friends</button>
            </div>
          </div>

          {/* Podium Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end max-w-5xl mx-auto w-full py-12">
            {/* Rank 2 */}
            <div className="flex flex-col items-center gap-6 order-2 md:order-1">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-slate-300/20 ring-4 ring-slate-300/5">
                  <AvatarFallback className="text-xl font-bold bg-white/5">Y</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-slate-300 border-4 border-[#050505] flex items-center justify-center text-[#050505] text-xs font-black">2</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-lg font-bold text-primary">You</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">12.4k XP • Level 12</div>
              </div>
              <div className="w-full h-32 bg-white/[0.02] border border-white/5 border-b-0" />
            </div>

            {/* Rank 1 */}
            <div className="flex flex-col items-center gap-6 order-1 md:order-2">
              <div className="relative">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-amber-400 animate-bounce">
                  <Crown size={40} />
                </div>
                <Avatar className="h-32 w-32 border-2 border-amber-400/20 ring-8 ring-amber-400/5">
                  <AvatarFallback className="text-2xl font-bold bg-white/5">S</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-amber-400 border-4 border-[#050505] flex items-center justify-center text-[#050505] text-sm font-black">1</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-xl font-bold">Sarah.dev</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">15.2k XP • Level 14</div>
              </div>
              <div className="w-full h-48 bg-white/[0.03] border border-white/5 border-b-0 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
              </div>
            </div>

            {/* Rank 3 */}
            <div className="flex flex-col items-center gap-6 order-3">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-amber-700/20 ring-4 ring-amber-700/5">
                  <AvatarFallback className="text-lg font-bold bg-white/5">A</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-amber-700 border-4 border-[#050505] flex items-center justify-center text-[#050505] text-xs font-black">3</div>
              </div>
              <div className="text-center space-y-1">
                <div className="text-lg font-bold">AlexCodes</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">11.9k XP • Level 11</div>
              </div>
              <div className="w-full h-24 bg-white/[0.01] border border-white/5 border-b-0" />
            </div>
          </div>

          {/* Rankings Table */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <div className="flex items-center gap-12">
                <span className="w-8">Rank</span>
                <span>Master Luminary</span>
              </div>
              <div className="flex items-center gap-24">
                <span className="w-20 text-right">Streak</span>
                <span className="w-24 text-right">Total XP</span>
              </div>
            </div>

            <div className="space-y-2">
              {rankings.map((user, i) => (
                <div 
                  key={user.name} 
                  className={`flex items-center justify-between p-6 border transition-all ${
                    user.me 
                    ? 'bg-primary/5 border-primary/20 shadow-[0_0_30px_rgba(173,198,255,0.05)]' 
                    : 'bg-white/[0.01] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-12">
                    <div className="w-8 flex items-center gap-2">
                      <span className="text-sm font-bold tabular-nums">{user.rank}</span>
                      {user.change === 'up' && <ChevronUp size={12} className="text-emerald-500" />}
                      {user.change === 'down' && <ChevronDown size={12} className="text-red-500" />}
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-8 w-8 border border-white/10 rounded-sm">
                        <AvatarFallback className="text-[10px] font-bold bg-white/5">{user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${user.me ? 'text-primary' : ''}`}>
                          {user.name}
                          {user.me && <span className="ml-2 text-[9px] font-bold uppercase px-1.5 py-0.5 bg-primary/10 text-primary">You</span>}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Master Level {15 - user.rank}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-24">
                    <div className="w-20 flex items-center justify-end gap-2">
                      <Zap size={12} className="text-primary/60" />
                      <span className="text-sm font-bold tabular-nums">{user.streak}</span>
                    </div>
                    <div className="w-24 text-right">
                      <span className="text-sm font-bold tabular-nums text-primary">{user.xp}</span>
                      <span className="ml-1 text-[9px] font-bold text-muted-foreground uppercase">XP</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search & Filters Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-white/3">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={16} />
              <input 
                type="text" 
                placeholder="Search for a luminary..." 
                className="w-full h-12 bg-white/[0.02] border border-white/5 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-primary/30 transition-colors"
              />
            </div>
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Showing top 100 luminaries</span>
              <div className="flex gap-2">
                <Button variant="outline" className="h-10 px-4 rounded-none border-white/5 bg-white/[0.01] hover:bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest">Previous</Button>
                <Button variant="outline" className="h-10 px-4 rounded-none border-white/5 bg-white/[0.01] hover:bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest">Next Page</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
