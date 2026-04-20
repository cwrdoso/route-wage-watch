import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Calendar } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import { useCountUp } from "@/hooks/useCountUp";
import { MoneyValue } from "@/components/MoneyValue";

interface SummaryCardsProps {
  routes: RouteEntry[];
}

interface CardData {
  title: string;
  value: number | null; // null => render em-dash (no data)
  icon: typeof DollarSign;
  accent: string;
  format: "currency" | "number" | "hours";
}

function AnimatedCard({ card, index }: { card: CardData; index: number }) {
  const safeValue = card.value ?? 0;
  const animated = useCountUp(safeValue, 600);
  const isEmpty = card.value === null;

  return (
    <Card
      className="glass-card premium-sheen animate-stagger-in min-h-[88px] flex"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <CardContent className="relative z-[1] p-4 flex flex-col justify-between w-full">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal leading-tight">
            {card.title}
          </span>
          <card.icon
            className="h-4 w-4 shrink-0 text-muted-foreground animate-icon-pop"
            style={{ animationDelay: `${index * 80 + 120}ms` }}
          />
        </div>

        <div
          className={`text-[22px] ${card.accent} leading-none mt-2 animate-number-reveal`}
          style={{ animationDelay: `${index * 80 + 180}ms` }}
        >
          {isEmpty ? (
            <span className="font-medium tabular-nums opacity-70">—</span>
          ) : card.format === "currency" ? (
            <MoneyValue value={animated} />
          ) : card.format === "hours" ? (
            <span className="font-medium tabular-nums">{animated.toFixed(1)}h</span>
          ) : (
            <span className="font-medium tabular-nums">{Math.round(animated)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SummaryCards({ routes: allRoutes }: SummaryCardsProps) {
  const routes = onlyRoutes(allRoutes);
  const totalRevenue = routes.reduce((sum, r) => sum + r.dailyValue, 0);
  const totalProfit = routes.reduce((sum, r) => sum + r.netProfit, 0);
  const totalHours = routes.reduce((s, r) => s + (r.hoursWorked || 0), 0);
  const uniqueDays = new Set(routes.map((r) => r.date)).size;
  const hasHours = totalHours > 0;
  const revenuePerHour = hasHours ? totalRevenue / totalHours : null;
  const profitPerHour = hasHours ? totalProfit / totalHours : null;

  const cards: CardData[] = [
    { title: "Faturamento Total", value: totalRevenue, icon: DollarSign, accent: "text-foreground", format: "currency" },
    { title: "Lucro Total", value: totalProfit, icon: TrendingUp, accent: totalProfit >= 0 ? "text-success" : "text-destructive", format: "currency" },
    { title: "Dias Trabalhados", value: uniqueDays, icon: Calendar, accent: "text-foreground", format: "number" },
    { title: "Horas Trabalhadas", value: totalHours, icon: Clock, accent: "text-foreground", format: "hours" },
    { title: "Faturamento/Hora", value: revenuePerHour, icon: DollarSign, accent: "text-foreground/80", format: "currency" },
    { title: "Lucro/Hora", value: profitPerHour, icon: TrendingUp, accent: (profitPerHour ?? 0) >= 0 ? "text-success" : "text-destructive", format: "currency" },
  ];

  return (
    <div data-tour="summary-cards" className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => (
        <AnimatedCard key={c.title} card={c} index={i} />
      ))}
    </div>
  );
}
