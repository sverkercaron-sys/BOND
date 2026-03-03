"use client";

import { motion } from "framer-motion";

interface StreakCounterProps {
  count: number;
}

export function StreakCounter({ count }: StreakCounterProps) {
  return (
    <motion.div
      initial={{ scale: 0.5 }}
      animate={{ scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 10,
      }}
      className="flex items-center justify-center gap-2"
    >
      <span className="text-4xl">🔥</span>
      <div className="text-center">
        <p className="text-bond-streak font-bold text-2xl">{count}</p>
        <p className="text-bond-gray text-sm">dagar i rad</p>
      </div>
    </motion.div>
  );
}
