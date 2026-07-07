import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Display formatters (moved from salon.ts — plain utilities, no data deps) ──

export function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
