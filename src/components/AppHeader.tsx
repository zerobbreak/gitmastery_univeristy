"use client";

import { UserButton } from "@clerk/nextjs";
import { GitBranch, LayoutDashboard, BookOpen, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Problems", icon: BookOpen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export function AppHeader() {
  const pathname = usePathname() ?? "";

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-8 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
            <GitBranch className="text-primary" size={15} />
          </div>
          <span className="text-sm font-semibold tracking-tight">GitMastery</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-3.5 py-4 text-[13px] font-medium transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-[2px] rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox:
                  "h-7 w-7 ring-1 ring-border hover:ring-primary/40 transition",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
