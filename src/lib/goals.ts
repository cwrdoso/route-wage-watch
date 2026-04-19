import { parseISO } from "date-fns";
import type { RouteEntry } from "./storage";
import { onlyRoutes } from "./storage";

export function getCurrentHalf(date = new Date()): 1 | 2 {
  return date.getDate() <= 15 ? 1 : 2;
}

export function getMonthRoutes(routes: RouteEntry[], ref = new Date()) {
  const m = ref.getMonth();
  const y = ref.getFullYear();
  return onlyRoutes(routes).filter((r) => {
    try {
      const d = parseISO(r.date);
      return d.getMonth() === m && d.getFullYear() === y;
    } catch {
      return false;
    }
  });
}

export function getFortnightRoutes(routes: RouteEntry[], ref = new Date()) {
  const half = getCurrentHalf(ref);
  return getMonthRoutes(routes, ref).filter((r) => {
    const d = parseISO(r.date);
    const h: 1 | 2 = d.getDate() <= 15 ? 1 : 2;
    return h === half;
  });
}

export function daysInMonth(ref = new Date()) {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
}

export function fortnightRange(ref = new Date()): { start: number; end: number } {
  const half = getCurrentHalf(ref);
  if (half === 1) return { start: 1, end: 15 };
  return { start: 16, end: daysInMonth(ref) };
}

export function progressColor(actualPct: number, expectedPct: number): "success" | "warning" | "destructive" {
  if (expectedPct <= 0) return "success";
  const ratio = actualPct / expectedPct;
  if (ratio >= 0.8) return "success";
  if (ratio >= 0.5) return "warning";
  return "destructive";
}

export function marginColor(pct: number): "success" | "warning" | "destructive" {
  if (pct >= 50) return "success";
  if (pct >= 30) return "warning";
  return "destructive";
}
