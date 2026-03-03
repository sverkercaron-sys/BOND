"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Milestone } from "@/types";

export function useStreak(coupleId: string | null = null) {
  const [streakCurrent, setStreakCurrent] = useState(0);
  const [streakBest, setStreakBest] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let isMounted = true;

    const fetchStreakData = async () => {
      if (!coupleId) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch couple streak data
        const { data: coupleData, error: coupleError } = await supabase
          .from("couples")
          .select("streak_current, streak_best, total_exercises_completed")
          .eq("id", coupleId)
          .single();

        if (coupleError) throw coupleError;

        if (isMounted && coupleData) {
          setStreakCurrent(coupleData.streak_current || 0);
          setStreakBest(coupleData.streak_best || 0);
          setTotalExercises(coupleData.total_exercises_completed || 0);
        }

        // Fetch milestones
        const { data: milestoneData, error: milestoneError } = await supabase
          .from("milestones")
          .select("*")
          .eq("couple_id", coupleId)
          .order("threshold");

        if (milestoneError) throw milestoneError;

        if (isMounted) {
          setMilestones(milestoneData || []);
        }

        // Fetch completed assignments for last 60 days
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];

        const { data: completedData, error: completedError } = await supabase
          .from("daily_assignments")
          .select("date")
          .eq("couple_id", coupleId)
          .gte("date", sixtyDaysAgoStr)
          .filter(
            "(user1_completed, eq, true), (user2_completed, eq, true)",
            "or"
          );

        if (completedError) throw completedError;

        if (isMounted) {
          const days = completedData?.map((a) => a.date) || [];
          setCompletedDays(days);
        }
      } catch (error) {
        console.error("Error fetching streak data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStreakData();

    return () => {
      isMounted = false;
    };
  }, [coupleId]);

  return {
    streakCurrent,
    streakBest,
    totalExercises,
    milestones,
    completedDays,
    loading,
  };
}
