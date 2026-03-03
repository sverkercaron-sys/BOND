"use client";

import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { MILESTONE_INFO } from "@/types";

interface MilestoneBadgeProps {
  type: string;
  achieved: boolean;
  achievedAt: string | null;
}

export default function MilestoneBadge({
  type,
  achieved,
  achievedAt,
}: MilestoneBadgeProps) {
  const milestoneInfo = MILESTONE_INFO[type as keyof typeof MILESTONE_INFO];

  if (!milestoneInfo) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        achieved
          ? "border-bond-success bg-bond-bg-alt"
          : "border-bond-bg-light bg-bond-bg-alt opacity-50"
      }`}
    >
      {achieved ? (
        <div className="text-center space-y-2">
          <div className="text-3xl">{milestoneInfo.emoji}</div>
          <h3 className="font-semibold text-bond-text text-sm">
            {milestoneInfo.label}
          </h3>
          {achievedAt && (
            <p className="text-xs text-bond-text-light">
              {format(new Date(achievedAt), "d MMM yyyy", { locale: sv })}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="text-3xl opacity-50">{milestoneInfo.emoji}</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
          </div>
          <h3 className="font-semibold text-bond-text text-sm">
            {milestoneInfo.label}
          </h3>
          <p className="text-xs text-bond-text-light">
            {milestoneInfo.description}
          </p>
        </div>
      )}
    </div>
  );
}
