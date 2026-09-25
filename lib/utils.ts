import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string | Date | undefined | null): string {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getScoreColor(score: number): {
  text: string;
  bg: string;
  border: string;
  ring: string;
} {
  if (score >= 80) {
    return {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "stroke-emerald-600",
    };
  }
  if (score >= 50) {
    return {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "stroke-amber-600",
    };
  }
  return {
    text: "text-zinc-600",
    bg: "bg-zinc-100",
    border: "border-zinc-200",
    ring: "stroke-zinc-500",
  };
}
