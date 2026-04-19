import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Calendar, DollarSign } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";

interface Props {
  routes: RouteEntry[];
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function HoursSummary({ routes }: Props) {
  const totalHours = routes.reduce((s, r) => s + (r.hoursWorked || 0), 0);
  const uniqueDays = new Set(routes.map((r) => r.date)).size;
  const totalProfit = routes.reduce((s, r) => s + r.netProfit, 0);
  const avgPerHour = totalHours > 0 ? totalProfit / totalHours : 0;
  const avgPerDay = uniqueDays > 0 ? totalProfit / uniqueDays : 0;

  const cards = [
    {
      title: "Horas Totais",
      value: `${totalHours.toFixed(1)}h`,
      icon: Clock,
      accent: "text-primary",
    },
    {
      title: "Dias Trabalhados",
      value: String(uniqueDays),
      icon: Calendar,
      accent: "text-info",
    },
    {
      title: "Ganho/Hora",
      value: formatCurrency(avgPerHour),
      icon: DollarSign,
      accent: avgPerHour >= 0 ? "text-success" : "text-destructive",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Card key={c.title} className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  {c.title}
                </span>
                <c.icon className={`h-4 w-4 ${c.accent}`} />
              </div>
              <p className={`text-lg font-bold ${c.accent}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Per-route breakdown */}
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Detalhamento por Rota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {routes.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma rota registrada.</p>
          )}
          {routes.slice(0, 30).map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{r.date}</p>
                <p className="text-xs text-muted-foreground">
                  {r.timeStart || "--:--"} → {r.timeEnd || "--:--"} • {(r.hoursWorked || 0).toFixed(1)}h
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p className={`text-sm font-semibold ${(r.earningsPerHour || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(r.earningsPerHour || 0)}/h
                </p>
                <p className="text-xs text-muted-foreground">{formatCurrency(r.netProfit)} lucro</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
