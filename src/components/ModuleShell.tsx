"use client";

import { AppHeader } from "@/components/AppHeader";

export function ModuleShell({
  children,
  hideHeader = false,
}: {
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-foreground selection:bg-primary/30 selection:text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      {!hideHeader && <AppHeader />}

      <main
        className={`${
          hideHeader ? "h-screen" : "h-[calc(100vh-80px)]"
        } w-full ${hideHeader ? "" : "px-8 pb-8"}`}
      >
        {children}
      </main>
    </div>
  );
}
