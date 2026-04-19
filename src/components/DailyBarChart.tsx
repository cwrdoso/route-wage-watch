import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  routes: RouteEntry[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function buildDays(): { date: Date; key: string }[] {
  const today = new Date();
  const day = today.getDate();
  // First 6 days of the month: show only days 1..today. From day 7: rolling 7-day window.
  const count = day < 7 ? day : 7;
  const days: { date: Date; key: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({ date: d, key: format(d, "yyyy-MM-dd") });
  }
  return days;
}

export function DailyBarChart({ routes: allRoutes }: Props) {
  const routes = onlyRoutes(allRoutes);
  const days = buildDays();

  // Aggregate net profit per day
  const byDay = new Map<string, number>();
  routes.forEach((r) => {
    byDay.set(r.date, (byDay.get(r.date) ?? 0) + r.netProfit);
  });

  const data = days.map((d) => ({
    date: d.date,
    key: d.key,
    profit: byDay.get(d.key) ?? null, // null = no route that day
  }));

  // Hide if fewer than 2 days have routes
  const daysWithData = data.filter((d) => d.profit !== null).length;
  if (daysWithData < 2) return null;

  const max = Math.max(
    1,
    ...data.map((d) => Math.max(0, d.profit ?? 0)),
  );

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          Lucro por dia
          <span className="ml-auto text-[11px] font-normal text-muted-foreground">
            últimos {data.length} dias
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent
        className="pt-0"
        style={{ height: 120 }}
      >
        <ul className="flex flex-col justify-between h-full gap-1.5">
          {data.map((d) => {
            const profit = d.profit;
            const hasData = profit !== null;
            const positive = (profit ?? 0) >= 0;
            const widthPct = hasData
              ? Math.max(2, Math.min(100, (Math.abs(profit ?? 0) / max) * 100))
              : 0;
            const label = format(d.date, "EEE dd", { locale: ptBR })
              .replace(".", "")
              .replace(/^./, (c) => c.toUpperCase());

            return (
              <li key={d.key} className="grid grid-cols-[44px_1fr_64px] items-center gap-2">
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  {label}
                </span>

                <div
                  className="relative h-3 rounded-full bg-secondary/60 overflow-hidden"
                  aria-hidden={!hasData}
                >
                  {hasData ? (
                    <div
                      className={`h-full rounded-full ${positive ? "bg-primary" : "bg-destructive"} animate-grow-bar origin-left`}
                      style={{ width: `${widthPct}%` }}
                    />
                  ) : null}
                </div>

                <span
                  className={`text-[11px] tabular-nums text-right font-medium ${
                    !hasData
                      ? "text-muted-foreground/50"
                      : positive
                      ? "text-foreground"
                      : "text-destructive"
                  }`}
                >
                  {hasData ? fmt(profit ?? 0) : "—"}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
