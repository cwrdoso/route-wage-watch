import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import { parseISO, startOfWeek, endOfWeek, isWithinInterval, subWeeks } from "date-fns";

interface Props {
  routes: RouteEntry[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function sumProfit(routes: RouteEntry[], from: Date, to: Date) {
  let sum = 0;
  routes.forEach((r) => {
    try {
      const d = parseISO(r.date);
      if (isWithinInterval(d, { start: from, end: to })) sum += r.netProfit;
    } catch { /* skip */ }
  });
  return sum;
}

export function WeekComparison({ routes: allRoutes }: Props) {
  const routes = onlyRoutes(allRoutes);
  if (routes.length === 0) return null;

  const now = new Date();
  // Brazilian week starts on Monday
  const thisStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  const thisWeek = sumProfit(routes, thisStart, thisEnd);
  const lastWeek = sumProfit(routes, lastStart, lastEnd);

  const hasLast = lastWeek !== 0;
  const diff = thisWeek - lastWeek;
  const pct = hasLast ? (diff / Math.abs(lastWeek)) * 100 : 0;
  const up = diff > 0;
  const flat = Math.abs(diff) < 0.01;

  if (!hasLast) {
    return (
      <Card className="glass-card animate-fade-in">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Esta semana</p>
            <p className="text-sm font-semibold tabular-nums leading-tight">
              {fmt(thisWeek)}
            </p>
            <p className="text-[11px] text-muted-foreground">primeira semana registrada</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trendCls = flat
    ? "text-muted-foreground"
    : up
    ? "text-success"
    : "text-destructive";
  const TrendIcon = up ? TrendingUp : TrendingDown;
  const arrow = up ? "↑" : "↓";

  return (
    <Card className="glass-card animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Semana passada</p>
            <p className="text-sm font-semibold tabular-nums truncate">{fmt(lastWeek)}</p>
          </div>

          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Esta semana</p>
            <p className="text-sm font-semibold tabular-nums truncate">{fmt(thisWeek)}</p>
          </div>
        </div>

        <div className={`mt-2 flex items-center justify-end gap-1 text-xs font-medium ${trendCls}`}>
          {!flat && <TrendIcon className="h-3.5 w-3.5" />}
          <span>{flat ? "—" : `${arrow} ${Math.abs(pct).toFixed(0)}%`}</span>
          {!flat && (
            <span className="text-muted-foreground font-normal">
              ({up ? "+" : "-"}{fmt(Math.abs(diff))})
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
