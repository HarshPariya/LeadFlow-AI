import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  change,
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#ECE7DE] bg-white p-5 shadow-2xs hover:border-[#D9D2C4] transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5C5850]">
          {title}
        </span>
        {Icon && (
          <div className="rounded-lg bg-[#F6EDE3] p-2 text-[#8D5B28]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#1C1B18]">
          {value}
        </span>
        {change && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded",
              change.isPositive
                ? "bg-[#EEF7F2] text-[#246E47]"
                : "bg-[#FEF2F2] text-[#B91C1C]"
            )}
          >
            {change.isPositive ? "+" : ""}
            {change.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-[#8C867B]">{description}</p>
      )}
    </div>
  );
}
