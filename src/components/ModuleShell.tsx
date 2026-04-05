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
    <div className="min-h-screen bg-background text-foreground">
      {!hideHeader && <AppHeader />}

      <main
        className={`${
          hideHeader ? "h-screen" : "h-[calc(100vh-57px)]"
        } w-full ${hideHeader ? "" : "px-6 pb-6"}`}
      >
        {children}
      </main>
    </div>
  );
}
