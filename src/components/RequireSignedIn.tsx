"use client";

import { RedirectToSignIn, useAuth } from "@clerk/nextjs";

export function RequireSignedIn({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;
  return <>{children}</>;
}
