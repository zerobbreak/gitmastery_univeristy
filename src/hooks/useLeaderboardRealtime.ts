import { useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type LeaderboardLiveStatus = "off" | "connecting" | "live";

const DEBOUNCE_MS = 450;

/**
 * Subscribes to Supabase Realtime updates on `leaderboard_realtime_signals`.
 * When the singleton row is bumped (profile XP/streak/name changes), debounces
 * and calls `onRefresh` so the UI refetches from GET /api/leaderboard.
 */
export function useLeaderboardRealtime(onRefresh: () => void): LeaderboardLiveStatus {
  const [status, setStatus] = useState<LeaderboardLiveStatus>("off");
  const refreshRef = useRef(onRefresh);
  refreshRef.current = onRefresh;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("off");
      return;
    }

    let debounce: ReturnType<typeof setTimeout> | undefined;

    const bump = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        refreshRef.current();
      }, DEBOUNCE_MS);
    };

    setStatus("connecting");

    const channel = supabase
      .channel("leaderboard-realtime-signals")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leaderboard_realtime_signals",
          filter: "id=eq.1",
        },
        () => {
          bump();
        },
      )
      .subscribe((subStatus, err) => {
        if (err) {
          console.warn("leaderboard realtime:", err.message);
          setStatus("off");
          return;
        }
        if (subStatus === "SUBSCRIBED") setStatus("live");
        else if (subStatus === "CHANNEL_ERROR" || subStatus === "TIMED_OUT")
          setStatus("off");
      });

    return () => {
      if (debounce) clearTimeout(debounce);
      void supabase.removeChannel(channel);
      setStatus("off");
    };
  }, []);

  return status;
}
