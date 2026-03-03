"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  subMonths,
  isSameDay,
} from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { useCouple } from "@/hooks/useCouple";
import { useStreak } from "@/hooks/useStreak";
import { MILESTONE_INFO } from "@/types";
import MilestoneBadge from "@/components/milestone-badge";

interface CalendarDay {
  date: Date;
  isCompleted: boolean;
  isFuture: boolean;
  isMissed: boolean;
}

export default function StreakPage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const { streak, bestStreak, totalExercises, loading: streakLoading } =
    useStreak();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [previousMonth, setPreviousMonth] = useState(subMonths(new Date(), 1));
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [milestoneData, setMilestoneData] = useState<any[]>([]);

  useEffect(() => {
    // Generate calendar data for current and previous month
    const startCurrent = startOfMonth(currentMonth);
    const endCurrent = endOfMonth(currentMonth);
    const currentMonthDays = eachDayOfInterval({
      start: startCurrent,
      end: endCurrent,
    });

    const startPrev = startOfMonth(previousMonth);
    const endPrev = endOfMonth(previousMonth);
    const prevMonthDays = eachDayOfInterval({
      start: startPrev,
      end: endPrev,
    });

    const allDays = [...prevMonthDays, ...currentMonthDays];

    // TODO: Fetch completed exercises from Supabase to mark days
    const calendarWithStatus = allDays.map((day) => ({
      date: day,
      isCompleted: false, // Will be populated from Supabase query
      isFuture: day > new Date(),
      isMissed: day <= new Date() && !false, // Placeholder
    }));

    setCalendarData(calendarWithStatus);
  }, [currentMonth, previousMonth]);

  useEffect(() => {
    // TODO: Fetch milestone achievements from Supabase
    setMilestoneData(
      Object.entries(MILESTONE_INFO).map(([key, info]) => ({
        type: key,
        ...info,
        achieved: false,
        achievedAt: null,
      }))
    );
  }, []);

  if (authLoading || coupleLoading || streakLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-bond-bg-alt rounded-lg" />
          <div className="h-48 bg-bond-bg-alt rounded-lg" />
          <div className="h-64 bg-bond-bg-alt rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-12">
      {/* Animated Streak Counter */}
      <motion.div
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-6xl font-bold text-bond-accent"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔥 {streak}
        </motion.div>
        <h1 className="text-3xl font-bold text-bond-text">ERAN RESA TILLSAMMANS</h1>
        <p className="text-bond-text-light">dagar i rad</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="bg-bond-bg-alt p-4 rounded-lg text-center">
          <p className="text-sm text-bond-text-light mb-2">Bästa streak</p>
          <p className="text-3xl font-bold text-bond-success">{bestStreak}</p>
        </div>
        <div className="bg-bond-bg-alt p-4 rounded-lg text-center">
          <p className="text-sm text-bond-text-light mb-2">Totala övningar</p>
          <p className="text-3xl font-bold text-bond-primary">{totalExercises}</p>
        </div>
      </motion.div>

      {/* Calendar View */}
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Previous Month */}
        <div>
          <h2 className="text-lg font-semibold text-bond-text mb-4">
            {format(previousMonth, "MMMM yyyy", { locale: sv })}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-bond-text-light"
              >
                {day}
              </div>
            ))}
            {calendarData
              .filter((day) => day.date.getMonth() === previousMonth.getMonth())
              .map((day, idx) => (
                <div key={`prev-${idx}`} className="text-center">
                  {day.isCompleted ? (
                    <span className="text-bond-success text-xl">●</span>
                  ) : day.isFuture ? (
                    <span className="text-bond-text-light text-xl">·</span>
                  ) : (
                    <span className="text-bond-text-light text-xl">○</span>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Current Month */}
        <div>
          <h2 className="text-lg font-semibold text-bond-text mb-4">
            {format(currentMonth, "MMMM yyyy", { locale: sv })}
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-bond-text-light"
              >
                {day}
              </div>
            ))}
            {calendarData
              .filter((day) => day.date.getMonth() === currentMonth.getMonth())
              .map((day, idx) => (
                <div key={`curr-${idx}`} className="text-center">
                  {day.isCompleted ? (
                    <span className="text-bond-success text-xl">●</span>
                  ) : day.isFuture ? (
                    <span className="text-bond-text-light text-xl">·</span>
                  ) : (
                    <span className="text-bond-text-light text-xl">○</span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </motion.div>

      {/* Milestones Section */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-bond-text">Milestones</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {milestoneData.map((milestone) => (
            <MilestoneBadge
              key={milestone.type}
              type={milestone.type}
              achieved={milestone.achieved}
              achievedAt={milestone.achievedAt}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
