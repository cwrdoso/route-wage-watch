/**
 * Fixed Costs module
 * - Recurring monthly/biweekly costs (rent, internet, etc.)
 * - Each cost has a per-route deduction that lowers netProfit until total is reached.
 * - Auto-resets when cycle ends.
 */
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "./cloudSync";

export type FixedCostPeriod = "monthly" | "biweekly";

export interface FixedCost {
  id: string;
  name: string;
  totalAmount: number;
  period: FixedCostPeriod;
  perRouteAmount: number;
  accumulated: number;
  cycleStart: string; // YYYY-MM-DD
  active: boolean;
}

const STORAGE_KEY = "driver_fixed_costs";

/* ---------- local cache ---------- */
function readLocal(): FixedCost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeLocal(list: FixedCost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/* ---------- mappers ---------- */
function rowToCost(r: any): FixedCost {
  return {
    id: r.id,
    name: r.name,
    totalAmount: Number(r.total_amount) || 0,
    period: (r.period as FixedCostPeriod) ?? "monthly",
    perRouteAmount: Number(r.per_route_amount) || 0,
    accumulated: Number(r.accumulated) || 0,
    cycleStart: r.cycle_start,
    active: !!r.active,
  };
}
function costToRow(c: FixedCost, userId: string) {
  return {
    id: c.id,
    user_id: userId,
    name: c.name,
    total_amount: c.totalAmount,
    period: c.period,
    per_route_amount: c.perRouteAmount,
    accumulated: c.accumulated,
    cycle_start: c.cycleStart,
    active: c.active,
  };
}

/* ---------- cycle helpers ---------- */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns cycle end date (inclusive) for given start + period */
export function cycleEndDate(cycleStart: string, period: FixedCostPeriod): Date {
  const start = new Date(cycleStart + "T00:00:00");
  if (period === "biweekly") {
    const end = new Date(start);
    end.setDate(end.getDate() + 13); // 14-day window
    return end;
  }
  // monthly: same-day next month - 1
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  return end;
}

/** Days remaining in current cycle including today (min 1) */
export function daysRemainingInCycle(c: FixedCost, ref = new Date()): number {
  const end = cycleEndDate(c.cycleStart, c.period);
  const refDay = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const diff = Math.ceil((end.getTime() - refDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

/** Suggest per-route amount based on remaining amount and average routes per day */
export function suggestPerRoute(c: FixedCost, avgRoutesPerDay = 1): number {
  const remaining = Math.max(0, c.totalAmount - c.accumulated);
  if (remaining <= 0) return 0;
  const days = daysRemainingInCycle(c);
  const estimatedRoutes = Math.max(1, Math.round(days * avgRoutesPerDay));
  return Math.ceil((remaining / estimatedRoutes) * 100) / 100;
}

/** Reset cycles that already ended; returns possibly-mutated list (and persists changes). */
function autoResetCycles(list: FixedCost[]): FixedCost[] {
  const today = new Date();
  let changed = false;
  const next = list.map((c) => {
    const end = cycleEndDate(c.cycleStart, c.period);
    if (today > end) {
      // advance start until today fits in the cycle
      let newStart = new Date(end);
      newStart.setDate(newStart.getDate() + 1);
      while (today > cycleEndDate(toISO(newStart), c.period)) {
        const e = cycleEndDate(toISO(newStart), c.period);
        newStart = new Date(e);
        newStart.setDate(newStart.getDate() + 1);
      }
      changed = true;
      return { ...c, cycleStart: toISO(newStart), accumulated: 0 };
    }
    return c;
  });
  if (changed) {
    writeLocal(next);
    // push each updated row
    const uid = getCurrentUserId();
    if (uid) {
      next.forEach((c) => {
        supabase.from("fixed_costs").update({
          cycle_start: c.cycleStart,
          accumulated: c.accumulated,
        }).eq("id", c.id).eq("user_id", uid).then(undefined, () => {});
      });
    }
  }
  return next;
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ---------- public API ---------- */

export function getFixedCosts(): FixedCost[] {
  return autoResetCycles(readLocal());
}

export async function pullFixedCosts() {
  const uid = getCurrentUserId();
  if (!uid) return;
  const { data, error } = await supabase
    .from("fixed_costs")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: true });
  if (!error && data) {
    writeLocal(data.map(rowToCost));
  }
}

export async function saveFixedCost(cost: FixedCost) {
  const list = readLocal();
  const idx = list.findIndex((c) => c.id === cost.id);
  if (idx >= 0) list[idx] = cost;
  else list.unshift(cost);
  writeLocal(list);
  const uid = getCurrentUserId();
  if (uid) {
    await supabase.from("fixed_costs").upsert(costToRow(cost, uid));
  }
}

export async function deleteFixedCost(id: string) {
  writeLocal(readLocal().filter((c) => c.id !== id));
  const uid = getCurrentUserId();
  if (uid) {
    await supabase.from("fixed_costs").delete().eq("id", id).eq("user_id", uid);
  }
}

export function newFixedCost(partial: Partial<FixedCost> = {}): FixedCost {
  return {
    id: crypto.randomUUID(),
    name: "",
    totalAmount: 0,
    period: "monthly",
    perRouteAmount: 0,
    accumulated: 0,
    cycleStart: todayISO(),
    active: true,
    ...partial,
  };
}

/**
 * Apply per-route deductions for active fixed costs.
 * Returns total amount deducted. Mutates accumulated for each cost (capped at total).
 * Persists locally + cloud.
 */
export function applyFixedCostsDeduction(): number {
  const list = autoResetCycles(readLocal());
  let totalDeducted = 0;
  let changed = false;
  const next = list.map((c) => {
    if (!c.active) return c;
    const remaining = c.totalAmount - c.accumulated;
    if (remaining <= 0) return c;
    const deduct = Math.min(c.perRouteAmount, remaining);
    if (deduct <= 0) return c;
    totalDeducted += deduct;
    changed = true;
    return { ...c, accumulated: c.accumulated + deduct };
  });
  if (changed) {
    writeLocal(next);
    const uid = getCurrentUserId();
    if (uid) {
      next.forEach((c) => {
        supabase
          .from("fixed_costs")
          .update({ accumulated: c.accumulated })
          .eq("id", c.id)
          .eq("user_id", uid)
          .then(undefined, () => {});
      });
    }
  }
  return totalDeducted;
}
