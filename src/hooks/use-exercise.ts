"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { DailyAssignment, Exercise } from "@/types";

export function useExercise(coupleId: string | null = null) {
  const [assignment, setAssignment] = useState<DailyAssignment | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const today = new Date().toISOString().split("T")[0];

  const assignDailyExercise = async () => {
    if (!coupleId) return;

    try {
      // Get 30 days ago date
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

      // Get exercises not done in last 30 days
      const { data: recentExercises } = await supabase
        .from("daily_assignments")
        .select("exercise_id")
        .eq("couple_id", coupleId)
        .gte("date", thirtyDaysAgoStr)
        .lte("date", today);

      const recentIds = new Set(
        recentExercises?.map((a) => a.exercise_id) || []
      );

      // Get random active exercise not in recent list
      const { data: availableExercises, error: exerciseError } =
        await supabase
          .from("exercises")
          .select("*")
          .eq("is_active", true)
          .order("id");

      if (exerciseError) throw exerciseError;

      const eligibleExercises = availableExercises?.filter(
        (e) => !recentIds.has(e.id)
      ) || [availableExercises?.[0]];

      if (eligibleExercises.length === 0 && availableExercises) {
        eligibleExercises.push(availableExercises[0]);
      }

      const randomExercise =
        eligibleExercises[Math.floor(Math.random() * eligibleExercises.length)];

      if (!randomExercise) return;

      // Create new assignment
      const { data: newAssignment, error: assignmentError } = await supabase
        .from("daily_assignments")
        .insert({
          couple_id: coupleId,
          exercise_id: randomExercise.id,
          date: today,
          user1_completed: false,
          user2_completed: false,
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      if (newAssignment) {
        setAssignment(newAssignment);
        setExercise(randomExercise);
      }
    } catch (error) {
      console.error("Error assigning daily exercise:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchExercise = async () => {
      if (!coupleId) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch today's assignment with exercise data
        const { data: assignmentData, error: assignmentError } = await supabase
          .from("daily_assignments")
          .select("*, exercises(*)")
          .eq("couple_id", coupleId)
          .eq("date", today)
          .single();

        if (assignmentError && assignmentError.code !== "PGRST116") {
          throw assignmentError;
        }

        if (isMounted) {
          if (assignmentData) {
            setAssignment(assignmentData);
            setExercise(assignmentData.exercises);
          } else {
            // No assignment for today, create one
            await assignDailyExercise();
          }
        }
      } catch (error) {
        console.error("Error fetching exercise:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExercise();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel(`daily_assignments:couple_id=eq.${coupleId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_assignments",
          filter: `couple_id=eq.${coupleId}`,
        },
        (payload) => {
          if (isMounted) {
            if (payload.new && payload.new.date === today) {
              setAssignment(payload.new);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [coupleId]);

  const markComplete = async (userId: string, isUser1: boolean) => {
    if (!assignment) return;

    try {
      const updateData = isUser1
        ? { user1_completed: true }
        : { user2_completed: true };

      const { data: updated, error } = await supabase
        .from("daily_assignments")
        .update(updateData)
        .eq("id", assignment.id)
        .select()
        .single();

      if (error) throw error;

      if (updated) {
        setAssignment(updated);
      }
    } catch (error) {
      console.error("Error marking exercise complete:", error);
    }
  };

  return { assignment, exercise, loading, markComplete };
}
