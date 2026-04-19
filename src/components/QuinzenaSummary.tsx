import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight, CalendarRange, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import type { DateRange } from "react-day-picker";
import { MoneyValue } from "@/components/MoneyValue";
import { vibrate } from "@/lib/haptics";

interface Props {
  routes: RouteEntry[];
}

function getCurrentQuinzena(): { month: number; year: number; half: 1 | 2 } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear(), half: now.getDate() <= 15 ? 1 : 2 };
}

function quinzenaKey(year: number, month: number, half: 1 | 2) {
  return `${year}-${month}-${half}`;
}

function quinzenaLabel(year: number, month: number, half: 1 | 2) {
  const d = new Date(year, month);
  const monthName = d.toLocaleString("pt-BR", { month: "short" }).replace(".", "");
  return half === 1 ? `01–15 ${monthName} ${year}` : `16–31 ${monthName} ${year}`;
}

function shiftQuinzena(year: number, month: number, half: 1 | 2, dir: -1 | 1) {
  if (dir === 1) {
    if (half === 1) return { year, month, half: 2 as const };
    const m = month + 1;
    return m > 11 ? { year: year + 1, month: 0, half: 1 as const } : { year, month: m, half: 1 as const };
  }
  if (half === 2) return { year, month, half: 1 as const };
  const m = month - 1;
  return m < 0 ? { year: year - 1, month: 11, half: 2 as const } : { year, month: m, half: 2 as const };
}

function filterRoutes(routes: RouteEntry[], key: string) {
  const data = { revenue: 0, profit: 0, expenses: 0, days: new Set<string>(), hours: 0 };
  routes.forEach((r) => {
    try {
      const d = parseISO(r.date);
      const half: 1 | 2 = d.getDate() <= 15 ? 1 : 2;
      if (quinzenaKey(d.getFullYear(), d.getMonth(), half) === key) {
        data.revenue += r.dailyValue;
        data.profit += r.netProfit;
        data.expenses += r.fuelCost + r.helperCost + r.fixedFee;
        data.days.add(r.date);
        data.hours += r.hoursWorked || 0;
      }
    } catch { /* skip */ }
  });
  return data;
}

function filterByRange(routes: RouteEntry[], from: Date, to: Date) {
  const data = { revenue: 0, profit: 0, expenses: 0, days: new Set<string>(), hours: 0 };
  routes.forEach((r) => {
    try {
      const d = parseISO(r.date);
      if (isWithinInterval(d, { start: startOfDay(from), end: endOfDay(to) })) {
        data.revenue += r.dailyValue;
        data.profit += r.netProfit;
        data.expenses += r.fuelCost + r.helperCost + r.fixedFee;
        data.days.add(r.date);
        data.hours += r.hoursWorked || 0;
      }
    } catch { /* skip */ }
  });
  return data;
}

function DataGrid({ data }: { data: { revenue: number; profit: number; expenses: number; days: Set<string>; hours: number } }) {
  const hasData = data.days.size > 0;
  if (!hasData) return <p className="text-sm text-muted-foreground text-center py-4">Sem rotas neste período.</p>;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-secondary/50 p-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Faturamento</span>
        <div className="text-base text-info mt-1">
          <MoneyValue value={data.revenue} />
        </div>
      </div>
      <div className="rounded-lg bg-secondary/50 p-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Lucro</span>
        <div className={`text-base mt-1 ${data.profit >= 0 ? "text-success" : "text-destructive"}`}>
          <MoneyValue value={data.profit} />
        </div>
      </div>
      <div className="rounded-lg bg-secondary/50 p-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Gastos Totais</span>
        <div className="text-base text-warning mt-1">
          <MoneyValue value={data.expenses} />
        </div>
      </div>
      <div className="rounded-lg bg-secondary/50 p-3">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Dias / Horas</span>
        <p className="text-sm font-medium mt-1 tabular-nums">{data.days.size}d • {data.hours.toFixed(1)}h</p>
      </div>
    </div>
  );
}

export function QuinzenaSummary({ routes: allRoutes }: Props) {
  const routes = onlyRoutes(allRoutes);
  const cur = getCurrentQuinzena();
  const [sel, setSel] = useState(cur);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);

  const usingCustom = !!(dateRange?.from && dateRange?.to);

  const qKey = quinzenaKey(sel.year, sel.month, sel.half);
  const qData = filterRoutes(routes, qKey);
  const rangeData = usingCustom ? filterByRange(routes, dateRange!.from!, dateRange!.to!) : null;

  const data = usingCustom ? rangeData! : qData;

  const titleLabel = usingCustom
    ? `${format(dateRange!.from!, "dd/MM/yy")} — ${format(dateRange!.to!, "dd/MM/yy")}`
    : quinzenaLabel(sel.year, sel.month, sel.half);

  const goPrev = () => {
    if (usingCustom) setDateRange(undefined);
    else setSel((s) => shiftQuinzena(s.year, s.month, s.half, -1));
    vibrate(15);
  };
  const goNext = () => {
    if (usingCustom) setDateRange(undefined);
    else setSel((s) => shiftQuinzena(s.year, s.month, s.half, 1));
    vibrate(15);
  };

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const SWIPE_THRESHOLD = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else goPrev();
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {usingCustom ? "Período Personalizado" : "Quinzena"}
        </CardTitle>
      </CardHeader>
      <CardContent
        className="space-y-3 select-none touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={goPrev}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-center">
            <span className="text-sm font-semibold capitalize truncate">{titleLabel}</span>
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 shrink-0 rounded-full transition-colors ${
                    usingCustom ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                  }`}
                  aria-label="Selecionar período personalizado"
                >
                  <CalendarRange className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(r) => {
                    setDateRange(r);
                    if (r?.from && r?.to) setPickerOpen(false);
                  }}
                  numberOfMonths={1}
                  locale={ptBR}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
                {usingCustom && (
                  <div className="border-t border-border/40 p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs gap-1.5"
                      onClick={() => {
                        setDateRange(undefined);
                        setPickerOpen(false);
                      }}
                    >
                      <X className="h-3 w-3" />
                      Limpar período
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={goNext}
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <DataGrid data={data} />
      </CardContent>
    </Card>
  );
}
