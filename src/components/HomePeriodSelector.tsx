import { useState } from "react";
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarRange, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DateRange } from "react-day-picker";
import type { RouteEntry } from "@/lib/storage";
import { cn } from "@/lib/utils";

export type HomePeriod =
  | { kind: "month" }
  | { kind: "all" }
  | { kind: "custom"; from: Date; to: Date };

interface Props {
  period: HomePeriod;
  onChange: (p: HomePeriod) => void;
}

export function periodLabel(p: HomePeriod) {
  if (p.kind === "month") return "Mês atual";
  if (p.kind === "all") return "Total";
  return `${format(p.from, "dd/MM/yy")} – ${format(p.to, "dd/MM/yy")}`;
}

export function filterRoutesByPeriod(routes: RouteEntry[], p: HomePeriod): RouteEntry[] {
  if (p.kind === "all") return routes;
  let from: Date, to: Date;
  if (p.kind === "month") {
    const now = new Date();
    from = startOfMonth(now);
    to = endOfMonth(now);
  } else {
    from = startOfDay(p.from);
    to = endOfDay(p.to);
  }
  return routes.filter((r) => {
    try {
      const d = parseISO(r.date);
      return isWithinInterval(d, { start: from, end: to });
    } catch {
      return false;
    }
  });
}

export function HomePeriodSelector({ period, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(
    period.kind === "custom" ? { from: period.from, to: period.to } : undefined
  );

  const isCustom = period.kind === "custom";

  return (
    <div className="flex items-center justify-end gap-1.5 -mt-2 -mb-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-full"
          >
            {periodLabel(period)}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={() => onChange({ kind: "month" })}
            className="text-xs gap-2"
          >
            <Check className={cn("h-3.5 w-3.5", period.kind === "month" ? "opacity-100" : "opacity-0")} />
            Mês atual
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onChange({ kind: "all" })}
            className="text-xs gap-2"
          >
            <Check className={cn("h-3.5 w-3.5", period.kind === "all" ? "opacity-100" : "opacity-0")} />
            Total (todos)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              setPickerOpen(true);
            }}
            className="text-xs gap-2"
          >
            <Check className={cn("h-3.5 w-3.5", isCustom ? "opacity-100" : "opacity-0")} />
            Personalizado…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full",
              isCustom ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
            )}
            aria-label="Selecionar período personalizado"
          >
            <CalendarRange className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={range}
            onSelect={(r) => {
              setRange(r);
              if (r?.from && r?.to) {
                onChange({ kind: "custom", from: r.from, to: r.to });
                setPickerOpen(false);
              }
            }}
            numberOfMonths={1}
            locale={ptBR}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
