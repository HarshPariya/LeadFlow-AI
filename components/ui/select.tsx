import React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  options: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, options, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[#5C5850]"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-9 w-full rounded-lg border border-[#D9D2C4] bg-white px-3 py-1.5 text-sm text-[#1C1B18] shadow-2xs transition-colors",
            "focus-ring focus:border-[#8D5B28]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F3EFE7]",
            error && "border-[#B91C1C] focus:border-[#B91C1C]",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-[#B91C1C] font-medium">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
