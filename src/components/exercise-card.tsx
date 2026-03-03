"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { User, Exercise, DailyAssignment, Couple, CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";

interface ExerciseCardProps {
  exercise: Exercise;
  assignment: DailyAssignment;
  user: User;
  partner: User | null;
  couple: Couple;
  onComplete: () => void;
}

export function ExerciseCard({
  exercise,
  assignment,
  user,
  partner,
  couple,
  onComplete,
}: ExerciseCardProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  const isUser1 = user.is_user1;
  const userCompleted = isUser1 ? assignment.user1_completed : assignment.user2_completed;
  const partnerCompleted = isUser1 ? assignment.user2_completed : assignment.user1_completed;
  const bothCompleted = userCompleted && partnerCompleted;

  const categoryColor = CATEGORY_COLORS[exercise.category] || "bg-bond-gray";
  const categoryLabel = CATEGORY_LABELS[exercise.category] || exercise.category;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8"
    >
      {/* Category Badge */}
      <div className="flex justify-center mb-6">
        <span
          className={`${categoryColor} text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide`}
        >
          {categoryLabel}
        </span>
      </div>

      {/* Exercise Title */}
      <h1 className="text-3xl font-bold text-center text-bond-dark mb-4">
        {exercise.title}
      </h1>

      {/* Exercise Description */}
      <p className="text-center text-bond-gray text-base mb-6 leading-relaxed">
        {exercise.description}
      </p>

      {/* Instructions Section */}
      <div className="mb-6 bg-bond-light rounded-lg p-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full flex items-center justify-between text-bond-dark hover:text-bond-primary transition-colors"
        >
          <span className="text-sm font-medium">Instruktioner</span>
          <motion.div
            animate={{ rotate: showInstructions ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={18} />
          </motion.div>
        </button>

        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 pt-3 border-t border-bond-gray/20"
          >
            <p className="text-sm text-bond-gray leading-relaxed">
              {exercise.instructions}
            </p>
          </motion.div>
        )}
      </div>

      {/* Duration */}
      <div className="text-center mb-8">
        <p className="text-bond-gray text-sm">
          ⏱ Ca {exercise.duration_minutes} minuter
        </p>
      </div>

      {/* Completion Status Section */}
      <div className="space-y-4">
        {bothCompleted ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-bond-success/10 border-2 border-bond-success rounded-lg p-4 text-center"
          >
            <p className="text-bond-success font-semibold text-lg">
              ✓ Ni har gjort dagens övning! 🎉
            </p>
          </motion.div>
        ) : userCompleted && !partnerCompleted ? (
          <div className="bg-bond-info/10 border-2 border-bond-info rounded-lg p-4 text-center">
            <p className="text-bond-info font-medium">
              Du har gjort den ✓ — väntar på {partner?.name || "din partner"}...
            </p>
          </div>
        ) : partnerCompleted && !userCompleted ? (
          <div className="bg-bond-warning/10 border-2 border-bond-warning rounded-lg p-4 text-center">
            <p className="text-bond-warning font-medium">
              {partner?.name || "Din partner"} har gjort den! ✓ Din tur.
            </p>
          </div>
        ) : null}

        {!bothCompleted && !userCompleted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onComplete}
            className="w-full bg-bond-primary hover:bg-bond-primary/90 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors"
          >
            Vi har gjort det! 💪
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
