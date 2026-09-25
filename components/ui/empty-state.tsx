import React from "react";
import { LucideIcon, Inbox } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D9D2C4] bg-[#FFFFFF]/70 p-12 text-center my-6">
      <div className="rounded-full bg-[#F3EFE7] p-3 text-[#8D5B28] mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#1C1B18]">{title}</h3>
      <p className="mt-1.5 text-xs text-[#5C5850] max-w-sm">{description}</p>
      {(actionLabel || secondaryLabel) && (
        <div className="mt-5 flex items-center gap-3">
          {secondaryLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
