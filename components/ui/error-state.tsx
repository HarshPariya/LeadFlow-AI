import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2]/60 p-8 text-center my-6">
      <div className="rounded-full bg-[#FEE2E2] p-3 text-[#B91C1C] mb-3">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-[#B91C1C]">{title}</h3>
      <p className="mt-1 text-xs text-[#7F1D1D] max-w-md">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 border-[#FECACA] text-[#B91C1C] hover:bg-[#FEE2E2]"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Retry Request
        </Button>
      )}
    </div>
  );
}
