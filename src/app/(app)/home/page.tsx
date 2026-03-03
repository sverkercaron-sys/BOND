"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { useExercise } from "@/hooks/use-exercise";
import { useStreak } from "@/hooks/use-streak";
import { ExerciseCard } from "@/components/exercise-card";
import { StreakCounter } from "@/components/streak-counter";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { couple, partner, loading: coupleLoading } = useCouple(user || null);
  const { assignment, exercise, loading: exerciseLoading, markComplete } = useExercise(user?.couple_id || null);
  const { streakCurrent, loading: streakLoading } = useStreak(user?.couple_id || null);

  const isLoading = authLoading || coupleLoading || exerciseLoading || streakLoading;

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  // Redirect if onboarding not completed
  useEffect(() => {
    if (!authLoading && user && !user.onboarding_completed) {
      router.push("/onboarding");
    }
  }, [authLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bond-light to-white flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="h-12 bg-bond-light rounded-lg animate-pulse"></div>
          <div className="h-64 bg-bond-light rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!user.couple_id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bond-light to-white flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-bond-dark">
            Välkommen till BOND!
          </h1>
          <p className="text-bond-gray text-lg">
            Bjud in din partner för att börja göra övningar tillsammans och stärka er relation.
          </p>
          <Link
            href="/invite"
            className="inline-block bg-bond-primary hover:bg-bond-primary/90 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Bjud in din partner
          </Link>
        </div>
      </div>
    );
  }

  const handleMarkComplete = async () => {
    if (user) {
      await markComplete(user.id, couple?.user1_id === user.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bond-light to-white">
      {/* Header with Streak Counter */}
      <div className="py-8 px-4 border-b border-bond-gray/10">
        <div className="max-w-md mx-auto">
          <StreakCounter count={streakCurrent} />
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-4">
        <div className="max-w-md mx-auto">
          {exercise && assignment ? (
            <ExerciseCard
              exercise={exercise}
              assignment={assignment}
              user={user}
              partner={partner}
              couple={couple!}
              onComplete={handleMarkComplete}
            />
          ) : (
            <div className="text-center text-bond-gray">
              <p>Laddar övning...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-bond-gray/10 p-4">
        <div className="max-w-md mx-auto flex justify-center gap-4">
          <Link
            href="/history"
            className="text-bond-primary hover:text-bond-primary/80 font-medium transition-colors"
          >
            Historia
          </Link>
          <span className="text-bond-gray/20">•</span>
          <Link
            href="/streak"
            className="text-bond-primary hover:text-bond-primary/80 font-medium transition-colors"
          >
            Statistik
          </Link>
        </div>
      </div>
    </div>
  );
}
