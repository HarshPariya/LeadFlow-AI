"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = "lg",
}: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const maxWidthStyles: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1C1B18]/60 backdrop-blur-xs transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* Dialog Panel - Centered, bounded height, scrollable body */}
      <div
        className={cn(
          "relative w-full rounded-2xl border border-[#D9D2C4] bg-white text-[#1C1B18] shadow-2xl z-10 flex flex-col my-auto max-h-[88vh] animate-fade-in",
          maxWidthStyles[maxWidth],
          className
        )}
      >
        {/* Header - Pinned at top with border and close button */}
        <div className="flex items-start justify-between border-b border-[#ECE7DE] px-5 py-4 shrink-0 bg-white rounded-t-2xl">
          <div className="pr-4">
            {title && (
              <h2 className="text-base sm:text-lg font-semibold text-[#1C1B18] leading-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-[#5C5850] mt-1 leading-snug">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5C5850] hover:bg-[#F3EFE7] hover:text-[#1C1B18] transition-colors focus-ring shrink-0 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
