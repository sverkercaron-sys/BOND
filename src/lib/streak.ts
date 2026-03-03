/**
 * Calculate current streak from array of completed dates
 * @param completedDays - Array of date strings (ISO format: YYYY-MM-DD)
 * @returns Current streak count
 */
export function calculateStreak(completedDays: string[]): number {
  if (completedDays.length === 0) {
    return 0;
  }

  // Sort dates in descending order (newest first)
  const sortedDates = [...completedDays].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  for (const dateStr of sortedDates) {
    const completedDate = new Date(dateStr);
    completedDate.setHours(0, 0, 0, 0);

    const daysDifference = Math.floor(
      (currentDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // If the difference is 0 or 1, it's consecutive
    if (daysDifference === 0 || daysDifference === 1) {
      streak++;
      currentDate = completedDate;
    } else {
      // Streak broken
      break;
    }
  }

  return streak;
}

/**
 * Check if streak is at risk (last completed exercise was yesterday)
 * @param lastCompletedDate - ISO format date string (YYYY-MM-DD)
 * @returns True if streak will break tomorrow without completing today
 */
export function isStreakAtRisk(lastCompletedDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastCompleted = new Date(lastCompletedDate);
  lastCompleted.setHours(0, 0, 0, 0);

  const daysSinceLast = Math.floor(
    (today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Streak is at risk if last exercise was yesterday (1 day ago)
  return daysSinceLast === 1;
}

/**
 * Get motivational message based on streak count
 * @param streak - Current streak number
 * @returns Motivational message in Swedish
 */
export function getStreakMessage(streak: number): string {
  if (streak === 0) {
    return 'Starta en ny streak idag! 🚀';
  }

  if (streak === 1) {
    return 'Du är igång! En dag ner, många kvar! 💪';
  }

  if (streak === 3) {
    return 'Tre dagar! Ni bygger en vana tillsammans! 🌱';
  }

  if (streak === 7) {
    return 'En vecka! Ni är superstjärnor! ⭐';
  }

  if (streak === 14) {
    return 'Två veckor! Det här är sant engagemang! 💫';
  }

  if (streak === 30) {
    return 'En månad! Ni är odödbara! 🔥';
  }

  if (streak === 100) {
    return 'Hundra dagar! Ni är legender! 👑';
  }

  if (streak === 365) {
    return 'Ett helt år! Ni är helt underbar! 🌟';
  }

  // Generic messages for other milestones
  if (streak % 30 === 0) {
    return `${streak} dagar! Ni växer starkare varje dag! 💪`;
  }

  if (streak % 10 === 0) {
    return `${streak} dagar! Fortsätt så! 🎉`;
  }

  if (streak % 5 === 0) {
    return `${streak} dagar! Ni gör fantastiskt! ✨`;
  }

  return 'Håll ut! Ni gör det bra tillsammans! 💖';
}

/**
 * Format streak days to readable string
 * @param days - Number of days
 * @returns Formatted string (e.g., "7 dagar", "1 dag")
 */
export function formatStreakDays(days: number): string {
  if (days === 1) {
    return '1 dag';
  }

  return `${days} dagar`;
}

/**
 * Get remaining hours until streak breaks
 * @param lastCompletedDate - ISO format date string (YYYY-MM-DD)
 * @returns Hours remaining (null if not at risk)
 */
export function getHoursUntilStreakBreaks(lastCompletedDate: string): number | null {
  if (!isStreakAtRisk(lastCompletedDate)) {
    return null;
  }

  const today = new Date();
  const midnight = new Date(today);
  midnight.setDate(midnight.getDate() + 1);
  midnight.setHours(0, 0, 0, 0);

  const hoursRemaining = Math.ceil(
    (midnight.getTime() - today.getTime()) / (1000 * 60 * 60)
  );

  return Math.max(0, hoursRemaining);
}

/**
 * Get streak statistics
 * @param completedDays - Array of date strings (ISO format: YYYY-MM-DD)
 * @returns Object with streak stats
 */
export function getStreakStats(completedDays: string[]) {
  const currentStreak = calculateStreak(completedDays);
  const totalDays = completedDays.length;
  const lastCompleted = completedDays.length > 0 
    ? completedDays[completedDays.length - 1] 
    : null;

  return {
    currentStreak,
    totalDays,
    lastCompleted,
    isAtRisk: lastCompleted ? isStreakAtRisk(lastCompleted) : false,
    message: getStreakMessage(currentStreak),
    formattedStreak: formatStreakDays(currentStreak),
  };
}
