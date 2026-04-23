import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return (amount / 1000).toFixed(1) + "k";
  }
  return amount.toFixed(2);
}

export function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (e) {
    return "Invalid Date";
  }
}

export function formatMonth(date: Date): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    return "Invalid Date";
  }
}

export function getProgressPercent(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}
