import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#5C5850]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-lg border border-[#D9D2C4] bg-white px-3 py-1.5 text-sm text-[#1C1B18] placeholder:text-[#8C867B] shadow-2xs transition-colors",
            "focus-ring focus:border-[#8D5B28] focus:bg-[#FFFFFF]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F3EFE7]",
            error && "border-[#B91C1C] focus:border-[#B91C1C] focus-visible:outline-[#B91C1C]",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[#B91C1C] font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
