import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
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
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-[#D9D2C4] bg-white px-3 py-2 text-sm text-[#1C1B18] placeholder:text-[#8C867B] shadow-2xs transition-colors",
            "focus-ring focus:border-[#8D5B28]",
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

Textarea.displayName = "Textarea";
