import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Target, TrendingUp, TrendingDown } from "lucide-react";
import { getSettings, type RouteEntry } from "@/lib/storage";
import {
  getMonthRoutes,
  getFortnightRoutes,
  daysInMonth,
  fortnightRange,
  progressColor,
} from "@/lib/goals";
import { useCountUp } from "@/hooks/useCountUp";
import { vibrate } from "@/lib/haptics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  routes: RouteEntry[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TONE = {
  success: { stroke: "hsl(var(--success))", text: "text-success", chip: "bg-success/15 text-success" },
  warning: { stroke: "hsl(var(--warning))", text: "text-warning", chip: "bg-warning/15 text-warning" },
  destructive: { stroke: "hsl(var(--destructive))", text: "text-destructive", chip: "bg-destructive/15 text-destructive" },
} as const;

function GoalRing({
  pct,
  expectedPct,
  tone,
  active,
}: {
  pct: number;
  expectedPct: number;
  tone: keyof typeof TONE;
  active: boolean;
}) {
  const size = 150;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const [drawn, setDrawn] = useState(0);
  useEffect(() => {
    if (!active) {
      setDrawn(0);
      return;
    }
    const id = requestAnimationFrame(() => setDrawn(pct));
    return () => cancelAnimationFrame(id);
  }, [pct, active]);

  const offset = c - (Math.min(drawn, 100) / 100) * c;
  const animatedPct = useCountUp(active ? pct : 0, 900);

  const markerAngle = (Math.min(expectedPct, 100) / 100) * 2 * Math.PI - Math.PI / 2;
  const mx = size / 2 + r * Math.cos(markerAngle);
  const my = size / 2 + r * Math.sin(markerAngle);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--secondary))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={TONE[tone].stroke}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1100ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        {expectedPct > 0 && expectedPct < 100 && (
          <circle cx={mx} cy={my} r={3.5} fill="hsl(var(--foreground) / 0.55)" />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[32px] font-bold tabular-nums leading-none ${TONE[tone].text}`}>
          {Math.round(animatedPct)}%
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">da meta</span>
      </div>
    </div>
  );
}

type View = "month" | "fortnight";

interface FaceData {
  pct: number;
  expectedPct: number;
  tone: keyof typeof TONE;
  current: number;
  goal: number;
  remaining: number;
  remainingDays: number;
  dailyNeeded: number;
  title: string;
  periodLabel: string;
  statusText: string;
  StatusIcon: typeof TrendingUp;
}

function CardFace({ data, active }: { data: FaceData; active: boolean }) {
  const { tone } = data;
  return (
    <CardContent className="relative p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/15 shrink-0">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold leading-none">{data.title}</h3>
          <p className="text-[11px] text-muted-foreground capitalize mt-0.5 truncate">{data.periodLabel}</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <GoalRing pct={data.pct} expectedPct={data.expectedPct} tone={tone} active={active} />
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Lucro acumulado</p>
            <p className="text-2xl font-bold tabular-nums leading-tight">
              {fmt(useCountUp(active ? data.current : 0, 800))}
            </p>
            <p className="text-[11px] text-muted-foreground tabular-nums">meta {fmt(data.goal)}</p>
          </div>
        </div>
      </div>

      {data.remaining <= 0 && data.goal > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 py-1.5 rounded-lg bg-success/10">
          <span className="text-base">🎯</span>
          <span className="text-success font-semibold text-sm">Meta atingida!</span>
        </div>
      )}
    </CardContent>
  );
}

export function GoalProgress({ routes }: Props) {
  const settings = getSettings();
  const [view, setView] = useState<View>("month");

  if (!settings.monthlyGoal || settings.monthlyGoal <= 0) return null;

  const now = new Date();
  const monthlyGoal = settings.monthlyGoal;
  const fortnightGoal =
    settings.fortnightGoal && settings.fortnightGoal > 0 ? settings.fortnightGoal : monthlyGoal / 2;

  const monthProfit = getMonthRoutes(routes, now).reduce((s, r) => s + r.netProfit, 0);
  const fortProfit = getFortnightRoutes(routes, now).reduce((s, r) => s + r.netProfit, 0);

  const totalDays = daysInMonth(now);
  const today = now.getDate();
  const expectedMonthlyPct = (today / totalDays) * 100;

  const fr = fortnightRange(now);
  const fortDaysTotal = fr.end - fr.start + 1;
  const fortDayElapsed = Math.max(0, Math.min(fortDaysTotal, today - fr.start + 1));
  const expectedFortPct = (fortDayElapsed / fortDaysTotal) * 100;

  const monthName = format(now, "MMMM", { locale: ptBR });

  function buildFace(isMonth: boolean): FaceData {
    const current = isMonth ? monthProfit : fortProfit;
    const goal = isMonth ? monthlyGoal : fortnightGoal;
    const expectedPct = isMonth ? expectedMonthlyPct : expectedFortPct;
    const daysTotal = isMonth ? totalDays : fortDaysTotal;
    const dayIn = isMonth ? today : fortDayElapsed;
    const remainingDays = Math.max(0, daysTotal - dayIn);
    const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    const tone = progressColor(pct, expectedPct);
    const remaining = Math.max(0, goal - current);
    const dailyNeeded = remainingDays > 0 ? remaining / remainingDays : 0;

    let statusText = "no ritmo";
    let StatusIcon = TrendingUp;
    if (tone === "warning") statusText = "atenção";
    else if (tone === "destructive") {
      statusText = "abaixo";
      StatusIcon = TrendingDown;
    }

    return {
      pct,
      expectedPct,
      tone,
      current,
      goal,
      remaining,
      remainingDays,
      dailyNeeded,
      title: isMonth ? "Progresso do Mês" : "Progresso da Quinzena",
      periodLabel: isMonth
        ? format(now, "MMMM yyyy", { locale: ptBR })
        : `Quinzena ${fr.start}–${fr.end} ${monthName}`,
      statusText,
      StatusIcon,
    };
  }

  const monthData = buildFace(true);
  const fortData = buildFace(false);
  const isMonth = view === "month";

  const switchView = (next: View) => {
    if (next === view) return;
    vibrate(15);
    setView(next);
  };

  return (
    <div data-tour="goal-progress" className="relative">
      {/* Toggle (fora da cena 3D para não rodar com o flip) */}
      <div className="flex justify-center mb-3">
        <div className="relative inline-flex bg-secondary/70 rounded-full p-0.5 border border-border/40">
          <span
            className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-primary shadow-sm"
            style={{
              transform: isMonth ? "translateX(0%)" : "translateX(100%)",
              transition: "transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)",
            }}
          />
          <button
            type="button"
            onClick={() => switchView("month")}
            className={`relative z-10 px-4 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
              isMonth ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Mês
          </button>
          <button
            type="button"
            onClick={() => switchView("fortnight")}
            className={`relative z-10 px-4 py-1.5 text-[11px] font-medium rounded-full transition-colors ${
              !isMonth ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            Quinzena
          </button>
        </div>
      </div>

      {/* Cena 3D */}
      <div className="scene">
        <div className={`card-flip ${!isMonth ? "flipped" : ""}`}>
          {/* Frente: Mês */}
          <Card className="glass-card premium-sheen ambient-glow border-primary/20 overflow-hidden relative face">
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 85% 15%, hsl(var(--primary) / 0.18), transparent 60%)",
              }}
            />
            <CardFace data={monthData} active={isMonth} />
          </Card>

          {/* Verso: Quinzena */}
          <Card className="glass-card premium-sheen ambient-glow border-primary/20 overflow-hidden face face-back">
            <div
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 15% 15%, hsl(var(--primary) / 0.18), transparent 60%)",
              }}
            />
            <CardFace data={fortData} active={!isMonth} />
          </Card>
        </div>
      </div>
    </div>
  );
}
