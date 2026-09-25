import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline" | "bronze";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "bg-[#F3EFE7] text-[#5C5850] border-[#D9D2C4]",
    bronze: "bg-[#F6EDE3] text-[#8D5B28] border-[#E5C9A8]",
    success: "bg-[#EEF7F2] text-[#246E47] border-[#C6E7D2]",
    warning: "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    danger: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
    info: "bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]",
    outline: "bg-transparent text-[#5C5850] border-[#D9D2C4]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border tracking-wide uppercase",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
