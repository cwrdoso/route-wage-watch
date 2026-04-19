import { Card, CardContent } from "@/components/ui/card";
import { Check, X, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { getSettings, type RouteEntry } from "@/lib/storage";
import {
  getMonthRoutes,
  getFortnightRoutes,
  daysInMonth,
  fortnightRange,
} from "@/lib/goals";
import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  route: RouteEntry;
  allRoutes: RouteEntry[];
  onClose: () => void;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface BadgeData {
  label: string;
  classes: string;
  Icon: typeof TrendingUp;
}

function ProfitHighlight({
  profit,
  hours,
  perHour,
}: {
  profit: number;
  hours: number;
  perHour: number;
}) {
  const animated = useCountUp(profit, 800);
  return (
    <div className="text-center py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Lucro da rota</p>
      <p className={`text-[22px] font-bold tabular-nums ${profit >= 0 ? "text-success" : "text-destructive"}`}>
        {fmt(animated)}
      </p>
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground mt-1">
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{hours.toFixed(1)}h</span>
        <span>·</span>
        <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{fmt(perHour)}/h</span>
      </div>
    </div>
  );
}

export function RouteFeedback({ route, allRoutes, onClose }: Props) {
  const settings = getSettings();
  const hours = route.hoursWorked || 0;
  const perHour = route.earningsPerHour || 0;
  const now = new Date();

  const monthlyGoal = settings.monthlyGoal || 0;
  const fortGoalRaw =
    settings.fortnightGoal && settings.fortnightGoal > 0
      ? settings.fortnightGoal
      : monthlyGoal / 2;
  const hourlyGoal = settings.hourlyGoal || 0;

  const monthRoutes = getMonthRoutes(allRoutes, now);
  const fortRoutes = getFortnightRoutes(allRoutes, now);

  const monthProfit = monthRoutes.reduce((s, r) => s + r.netProfit, 0);
  const fortProfit = fortRoutes.reduce((s, r) => s + r.netProfit, 0);

  // Lucro mínimo diário para bater a meta mensal (referência principal)
  const totalDays = daysInMonth(now);
  const fr = fortnightRange(now);
  const fortDaysTotal = fr.end - fr.start + 1;

  const dailyTargetMonth = monthlyGoal > 0 ? monthlyGoal / totalDays : 0;
  const dailyTargetFort = fortGoalRaw > 0 ? fortGoalRaw / fortDaysTotal : 0;
  // Referência usada para classificar a rota (prioriza meta mensal)
  const dailyTarget = dailyTargetMonth > 0 ? dailyTargetMonth : dailyTargetFort;

  const profit = route.netProfit;
  const diff = profit - dailyTarget;
  const diffPct = dailyTarget > 0 ? (diff / dailyTarget) * 100 : 0;

  let status: "above" | "on" | "below" | "first" = "on";
  if (dailyTarget <= 0) {
    status = "first";
  } else if (diffPct >= 10) status = "above";
  else if (diffPct <= -10) status = "below";
  else status = "on";

  const badge =
    status === "first"
      ? { label: "Defina uma meta para acompanhar", classes: "bg-primary/15 text-primary", Icon: Minus }
      : status === "above"
      ? { label: `🟢 Acima da meta diária · +${fmt(diff)} (${diffPct.toFixed(0)}%)`, classes: "bg-success/15 text-success", Icon: TrendingUp }
      : status === "below"
      ? { label: `🔴 Abaixo da meta diária · ${fmt(diff)} (${diffPct.toFixed(0)}%)`, classes: "bg-destructive/15 text-destructive", Icon: TrendingDown }
      : { label: `🟡 Na meta diária (${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(0)}%)`, classes: "bg-warning/15 text-warning", Icon: Minus };

  const monthPct = monthlyGoal > 0 ? Math.min((monthProfit / monthlyGoal) * 100, 100) : 0;
  const fortPct = fortGoalRaw > 0 ? Math.min((fortProfit / fortGoalRaw) * 100, 100) : 0;

  const showGoals = monthlyGoal > 0;

  // Explicação curta do "porquê"
  let reason: string | null = null;
  if (status === "below" && dailyTarget > 0) {
    reason = `Para a meta mensal você precisa de ${fmt(dailyTarget)}/dia. Faltaram ${fmt(Math.abs(diff))} nessa rota.`;
  } else if (status === "above" && dailyTarget > 0) {
    reason = `Meta diária é ${fmt(dailyTarget)}. Essa rota rendeu ${fmt(Math.abs(diff))} a mais — ajuda a compensar dias mais fracos.`;
  } else if (status === "on" && dailyTarget > 0) {
    reason = `Meta diária ${fmt(dailyTarget)}. Mantendo esse ritmo, você bate a meta do mês.`;
  }

  return (
    <Card className="glass-card border-success/30 animate-slide-down-fade">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-success/15 flex items-center justify-center">
              <Check className="h-5 w-5 text-success animate-stagger-in" strokeWidth={3} />
            </div>
            <h3 className="font-semibold text-base">Rota registrada!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground rounded-full h-7 w-7 flex items-center justify-center hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Lucro destaque — counter animado 0 → profit em 800ms */}
        <ProfitHighlight
          profit={profit}
          hours={hours}
          perHour={perHour}
        />


        {/* Impacto nas metas */}
        {showGoals && (
          <div className="space-y-3 pt-3 border-t border-border/40">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Impacto nas metas</p>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Quinzena</span>
                <span className="font-semibold tabular-nums">{fmt(fortProfit)} de {fmt(fortGoalRaw)} ({fortPct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary animate-grow-bar" style={{ width: `${fortPct}%` }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Mês</span>
                <span className="font-semibold tabular-nums">{fmt(monthProfit)} de {fmt(monthlyGoal)} ({monthPct.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary animate-grow-bar" style={{ width: `${monthPct}%` }} />
              </div>
            </div>

            {hourlyGoal > 0 && (
              <p className={`text-[12px] ${perHour >= hourlyGoal ? "text-success" : "text-destructive"}`}>
                {perHour >= hourlyGoal
                  ? `Hora trabalhada acima da meta (${fmt(hourlyGoal)}/h). Continue assim.`
                  : `Hora trabalhada abaixo de ${fmt(hourlyGoal)}/h. Tente rotas mais curtas e lucrativas.`}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
