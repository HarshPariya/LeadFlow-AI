import React from "react";
import { cn, getScoreColor } from "@/lib/utils";

export interface ScoreBadgeProps {
  score?: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreBadge({
  score,
  size = "md",
  showLabel = false,
}: ScoreBadgeProps) {
  if (score === undefined || score === null) {
    return (
      <span className="text-xs text-[#8C867B] italic">Not scored</span>
    );
  }

  const clamped = Math.min(100, Math.max(0, score));
  const colors = getScoreColor(clamped);

  if (size === "sm") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold text-xs px-2 py-0.5 rounded-full border",
          colors.bg,
          colors.text,
          colors.border
        )}
      >
        <span>{clamped}</span>
        {showLabel && <span className="text-[10px] uppercase tracking-wider">AI</span>}
      </span>
    );
  }

  if (size === "lg") {
    // Circular Progress Ring SVG for detail views
    const strokeWidth = 5;
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
            {/* Background track */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              className="stroke-[#ECE7DE]"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Progress */}
            <circle
              cx="30"
              cy="30"
              r={radius}
              className={cn("transition-all duration-500", colors.ring)}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-base font-bold text-[#1C1B18]">
            {clamped}
          </span>
        </div>
        <div>
          <div className="text-xs font-semibold text-[#5C5850] uppercase tracking-wider">
            AI Qualification
          </div>
          <div className={cn("text-sm font-bold", colors.text)}>
            {clamped >= 80 ? "High Potential" : clamped >= 50 ? "Moderate Match" : "Low Readiness"}
          </div>
        </div>
      </div>
    );
  }

  // Medium default
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs",
        colors.bg,
        colors.text,
        colors.border
      )}
    >
      <span className="font-bold text-sm leading-none">{clamped}</span>
      <span className="text-[11px] text-[#5C5850] font-normal">/ 100</span>
    </div>
  );
}
