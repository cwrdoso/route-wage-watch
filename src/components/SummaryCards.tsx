import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Calendar } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import { useCountUp } from "@/hooks/useCountUp";

interface SummaryCardsProps {
  routes: RouteEntry[];
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface CardData {
  title: string;
  value: number;
  icon: typeof DollarSign;
  accent: string;
  format: "currency" | "number" | "hours";
}

function AnimatedCard({ card, index }: { card: CardData; index: number }) {
  const animated = useCountUp(card.value, 600);
  let display: string;
  if (card.format === "currency") display = formatCurrency(animated);
  else if (card.format === "hours") display = `${animated.toFixed(1)}h`;
  else display = String(Math.round(animated));

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
        <p
          className={`text-[22px] font-semibold ${card.accent} tabular-nums leading-none mt-2 animate-number-reveal`}
          style={{ animationDelay: `${index * 80 + 180}ms` }}
        >
          {display}
        </p>
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
  const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
  const profitPerHour = totalHours > 0 ? totalProfit / totalHours : 0;

  // Paleta harmônica: foreground neutro para totais e contexto;
  // success/destructive só para sinalizar lucro (positivo/negativo).
  const cards: CardData[] = [
    { title: "Faturamento Total", value: totalRevenue, icon: DollarSign, accent: "text-foreground", format: "currency" },
    { title: "Lucro Total", value: totalProfit, icon: TrendingUp, accent: totalProfit >= 0 ? "text-success" : "text-destructive", format: "currency" },
    { title: "Dias Trabalhados", value: uniqueDays, icon: Calendar, accent: "text-foreground", format: "number" },
    { title: "Horas Trabalhadas", value: totalHours, icon: Clock, accent: "text-foreground", format: "hours" },
    { title: "Faturamento/Hora", value: revenuePerHour, icon: DollarSign, accent: "text-foreground/80", format: "currency" },
    { title: "Lucro/Hora", value: profitPerHour, icon: TrendingUp, accent: profitPerHour >= 0 ? "text-success" : "text-destructive", format: "currency" },
  ];

  return (
    <div data-tour="summary-cards" className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => (
        <AnimatedCard key={c.title} card={c} index={i} />
      ))}
    </div>
  );
}
