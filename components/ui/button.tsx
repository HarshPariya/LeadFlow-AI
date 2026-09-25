import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#8D5B28] hover:bg-[#73471D] text-white shadow-xs active:bg-[#5C3714]",
      secondary:
        "bg-[#F3EFE7] hover:bg-[#EAE4D8] text-[#1C1B18] border border-[#D9D2C4]/60",
      outline:
        "bg-white hover:bg-[#F9F8F5] text-[#1C1B18] border border-[#D9D2C4] shadow-2xs",
      ghost:
        "hover:bg-[#F3EFE7] text-[#1C1B18] bg-transparent",
      destructive:
        "bg-[#B91C1C] hover:bg-[#991B1B] text-white shadow-xs",
    };

    const sizeStyles = {
      sm: "h-8 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-sm gap-2",
      lg: "h-11 px-5 text-base gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
