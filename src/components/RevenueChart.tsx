import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import type { RouteEntry } from "@/lib/storage";
import { getSettings, onlyRoutes } from "@/lib/storage";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { daysInMonth } from "@/lib/goals";

interface RevenueChartProps {
  routes: RouteEntry[];
}

interface DayPoint {
  label: string;
  fullDate: string;
  faturamento: number | null;
  lucro: number | null;
  hours: number;
  perHour: number;
  hasData: boolean;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DayPoint }> }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card/95 backdrop-blur-md px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold mb-1 capitalize">
        {format(parseISO(p.fullDate), "EEE, dd MMM", { locale: ptBR })}
      </p>
      {p.hasData ? (
        <div className="space-y-0.5">
          <p className="text-info">Faturamento: <span className="font-semibold tabular-nums">{fmt(p.faturamento || 0)}</span></p>
          <p className="text-success">Lucro: <span className="font-semibold tabular-nums">{fmt(p.lucro || 0)}</span></p>
          <p className="text-muted-foreground">Horas: <span className="font-semibold tabular-nums">{p.hours.toFixed(1)}h</span></p>
          <p className="text-muted-foreground">Lucro/h: <span className="font-semibold tabular-nums">{fmt(p.perHour)}</span></p>
        </div>
      ) : (
        <p className="text-muted-foreground italic">Sem rotas registradas</p>
      )}
    </div>
  );
}

export function RevenueChart({ routes: allRoutes }: RevenueChartProps) {
  const routes = onlyRoutes(allRoutes);
  const settings = getSettings();
  const last7: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, "yyyy-MM-dd");
    const dayRoutes = routes.filter((r) => r.date === dateStr);
    const fat = dayRoutes.reduce((s, r) => s + r.dailyValue, 0);
    const luc = dayRoutes.reduce((s, r) => s + r.netProfit, 0);
    const hrs = dayRoutes.reduce((s, r) => s + (r.hoursWorked || 0), 0);
    return {
      label: format(d, "dd/MM", { locale: ptBR }),
      fullDate: dateStr,
      faturamento: dayRoutes.length ? fat : null,
      lucro: dayRoutes.length ? luc : null,
      hours: hrs,
      perHour: hrs > 0 ? luc / hrs : 0,
      hasData: dayRoutes.length > 0,
    };
  });

  const dailyGoal = settings.monthlyGoal && settings.monthlyGoal > 0
    ? settings.monthlyGoal / Math.max(1, daysInMonth())
    : 0;

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-primary" />
          Faturamento e Lucro — últimos 7 dias
        </CardTitle>
        <p className="text-[11px] text-muted-foreground">Toque num ponto para ver detalhes</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={last7} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="label"
              tick={(props) => {
                const { x, y, payload, index } = props;
                const point = last7[index];
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={12} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={11}>
                      {payload.value}
                    </text>
                    {!point?.hasData && (
                      <text x={0} y={0} dy={26} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={9} fontStyle="italic">
                        folga
                      </text>
                    )}
                  </g>
                );
              }}
              axisLine={false}
              tickLine={false}
              height={42}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.3, strokeWidth: 1 }} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              iconType="circle"
              formatter={(v) => (v === "faturamento" ? "Faturamento" : "Lucro")}
            />
            {dailyGoal > 0 && (
              <ReferenceLine
                y={dailyGoal}
                stroke="hsl(var(--primary))"
                strokeDasharray="4 4"
                strokeOpacity={0.7}
                label={{
                  value: "Meta/dia",
                  position: "insideTopRight",
                  fill: "hsl(var(--primary))",
                  fontSize: 10,
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="faturamento"
              stroke="hsl(var(--info))"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload, key } = props;
                if (!payload.hasData) return <circle key={key} cx={cx} cy={cy} r={3} fill="hsl(var(--muted-foreground))" opacity={0.4} />;
                return <circle key={key} cx={cx} cy={cy} r={3} fill="hsl(var(--info))" />;
              }}
              activeDot={{ r: 5 }}
              name="faturamento"
              connectNulls={false}
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="lucro"
              stroke="hsl(var(--success))"
              strokeWidth={2.5}
              strokeDasharray="0"
              dot={(props) => {
                const { cx, cy, payload, key } = props;
                if (!payload.hasData) return <circle key={key} cx={cx} cy={cy} r={3} fill="hsl(var(--muted-foreground))" opacity={0.4} />;
                return <circle key={key} cx={cx} cy={cy} r={3} fill="hsl(var(--success))" />;
              }}
              activeDot={{ r: 5 }}
              name="lucro"
              connectNulls={false}
              isAnimationActive
              animationDuration={600}
              animationBegin={150}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
