"use client";

import { useEffect, useState } from "react";
import { RedirectToSignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import { apiUrl } from "@/lib/api";
import { isOnboardingCompleteLocally, setOnboardingCompleteLocally } from "@/lib/onboarding-local";

export function RequireOnboardingComplete({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "complete" | "incomplete">(
    "loading",
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) {
            setStatus(
              isOnboardingCompleteLocally() ? "complete" : "incomplete",
            );
          }
          return;
        }
        const res = await fetch(apiUrl("/api/onboarding"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (!res.ok) {
          setStatus(
            isOnboardingCompleteLocally() ? "complete" : "incomplete",
          );
          return;
        }
        const data = (await res.json()) as {
          onboardingCompletedAt: string | null;
        };
        const done = data.onboardingCompletedAt != null;
        if (done) setOnboardingCompleteLocally();
        setStatus(
          done || isOnboardingCompleteLocally() ? "complete" : "incomplete",
        );
      } catch {
        if (!cancelled) {
          setStatus(
            isOnboardingCompleteLocally() ? "complete" : "incomplete",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (status === "incomplete") {
      router.replace("/onboarding");
    }
  }, [status, router]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <RedirectToSignIn />;

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (status === "incomplete") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
}
