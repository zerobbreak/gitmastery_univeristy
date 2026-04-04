"use client";

import { UserButton } from "@clerk/nextjs";
import { GitBranch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function navClass(active: boolean) {
  return active
    ? "border-b border-primary pb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground transition-colors"
    : "text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground";
}

export function AppHeader() {
  const pathname = usePathname() ?? "";
  const modulesActive = pathname === "/modules" || pathname.startsWith("/modules/");
  const workshopsActive = pathname.startsWith("/workshops");
  const leaderboardActive = pathname.startsWith("/leaderboard");

  return (
    <header className="sticky top-0 z-50 bg-transparent">
      <div className="mx-auto flex h-20 w-full items-center gap-12 px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10"
          >
            <GitBranch className="text-primary" size={16} />
          </Link>
          <span className="text-sm font-bold uppercase tracking-tight">GitLuminary</span>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/modules" className={navClass(modulesActive)}>
            Modules
          </Link>
          <Link href="/workshops" className={navClass(workshopsActive)}>
            Workshops
          </Link>
          <Link href="/leaderboard" className={navClass(leaderboardActive)}>
            Leaderboard
          </Link>
          <button
            type="button"
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Roadmap
          </button>
          <button
            type="button"
            className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Activity
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "h-8 w-8 ring-1 ring-white/10 hover:ring-primary/40 transition",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
