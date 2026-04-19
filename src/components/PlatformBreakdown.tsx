import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import { PLATFORMS, getPlatform } from "@/lib/platforms";

interface Props {
  routes: RouteEntry[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function PlatformBreakdown({ routes: allRoutes }: Props) {
  const routes = onlyRoutes(allRoutes);

  const byPlatform = new Map<string, { revenue: number; profit: number; count: number }>();
  routes.forEach((r) => {
    const id = r.platform || "none";
    const cur = byPlatform.get(id) ?? { revenue: 0, profit: 0, count: 0 };
    cur.revenue += r.dailyValue;
    cur.profit += r.netProfit;
    cur.count += 1;
    byPlatform.set(id, cur);
  });

  // Show only platforms with at least one route, ordered by canonical PLATFORMS list
  const items = PLATFORMS
    .map((p) => ({ def: p, agg: byPlatform.get(p.id) }))
    .filter((x) => !!x.agg && x.agg.count > 0);

  if (items.length === 0) return null;

  const maxProfit = Math.max(1, ...items.map((i) => Math.abs(i.agg!.profit)));

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Por Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.map(({ def, agg }) => {
          const pct = (Math.abs(agg!.profit) / maxProfit) * 100;
          const positive = agg!.profit >= 0;
          return (
            <div key={def.id} className="rounded-lg bg-secondary/40 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: def.dot }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium truncate">{def.label}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    · {agg!.count} {agg!.count === 1 ? "rota" : "rotas"}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
                    {fmt(agg!.profit)}
                  </p>
                  <p className="text-[10px] text-muted-foreground tabular-nums">
                    Faturamento {fmt(agg!.revenue)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: def.dot,
                    transition: "width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
