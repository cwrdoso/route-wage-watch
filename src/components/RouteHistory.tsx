import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  History,
  Trash2,
  Moon,
  Calendar,
  Clock,
  Route as RouteIcon,
  Fuel,
  DollarSign,
  PiggyBank,
  Users,
  TrendingUp,
  Gauge,
} from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { deleteRoute } from "@/lib/storage";
import { getPlatform } from "@/lib/platforms";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { vibrate } from "@/lib/haptics";
import { useEffect, useRef, useState } from "react";

interface RouteHistoryProps {
  routes: RouteEntry[];
  onDelete: (id: string) => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function DetailRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-2 border-b border-border/40 last:border-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="h-7 w-7 rounded-md bg-secondary/60 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <span className="text-[12px] text-muted-foreground truncate">{label}</span>
      </div>
      <span className={`text-[12px] font-semibold tabular-nums text-right ${accent ?? "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function RouteDetailDialog({
  route,
  open,
  onOpenChange,
}: {
  route: RouteEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!route) return null;
  const km = route.kmDriven || route.kmEnd - route.kmStart;
  const hours = route.hoursWorked || 0;
  const totalExpenses = (route.fuelCost || 0) + (route.helperCost || 0) + (route.fixedFee || 0);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh]">
        <div className="mx-auto w-full max-w-md px-4 pb-6 overflow-y-auto">
          <DrawerHeader className="px-0 pt-2 pb-3">
            <DrawerTitle className="flex items-center gap-2 text-sm">
              <RouteIcon className="h-4 w-4 text-primary" />
              Detalhes da rota
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Resumo completo da rota com horário, distância, faturamento, gastos e ganho por hora.
            </DrawerDescription>
          </DrawerHeader>

          {/* Resumo */}
          <div className="rounded-xl bg-secondary/40 p-3 text-center premium-sheen relative overflow-hidden">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {format(parseISO(route.date), "EEE, dd 'de' MMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">
              Lucro líquido
            </p>
            <p
              className={`text-2xl font-bold tabular-nums mt-0.5 animate-number-reveal ${
                route.netProfit >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(route.netProfit)}
            </p>
          </div>

          {/* Detalhes */}
          <div className="mt-3 space-y-0">
            <DetailRow
              icon={Clock}
              label="Horário"
              value={`${route.timeStart || "--"} → ${route.timeEnd || "--"} · ${hours.toFixed(1)}h`}
            />
            <DetailRow
              icon={Gauge}
              label="Distância"
              value={`${km} km (${route.kmStart}→${route.kmEnd})`}
            />
            <DetailRow
              icon={DollarSign}
              label="Faturamento"
              value={formatCurrency(route.dailyValue)}
            />
            <DetailRow
              icon={Fuel}
              label="Combustível"
              value={`${formatCurrency(route.fuelCost)} · ${route.litersUsed.toFixed(2)}L`}
              accent="text-warning"
            />
            {route.helperCost > 0 && (
              <DetailRow
                icon={Users}
                label="Ajudante"
                value={formatCurrency(route.helperCost)}
                accent="text-warning"
              />
            )}
            {route.fixedFee > 0 && (
              <DetailRow
                icon={DollarSign}
                label="Diária / Taxa"
                value={formatCurrency(route.fixedFee)}
                accent="text-warning"
              />
            )}
            <DetailRow
              icon={DollarSign}
              label="Gastos totais"
              value={formatCurrency(totalExpenses)}
              accent="text-warning"
            />
            <DetailRow
              icon={PiggyBank}
              label="Reserva sugerida"
              value={formatCurrency(route.recommendedReserve || 0)}
              accent="text-info"
            />
            <DetailRow
              icon={TrendingUp}
              label="Ganho por hora"
              value={`${formatCurrency(route.earningsPerHour || 0)}/h`}
              accent={(route.earningsPerHour || 0) >= 0 ? "text-success" : "text-destructive"}
            />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function RouteHistory({ routes, onDelete }: RouteHistoryProps) {
  const prevFirstId = useRef<string | undefined>(routes[0]?.id);
  const [newId, setNewId] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<RouteEntry | null>(null);

  useEffect(() => {
    const currentFirst = routes[0]?.id;
    if (currentFirst && currentFirst !== prevFirstId.current) {
      setNewId(currentFirst);
      const t = setTimeout(() => setNewId(undefined), 500);
      prevFirstId.current = currentFirst;
      return () => clearTimeout(t);
    }
    prevFirstId.current = currentFirst;
  }, [routes]);

  const handleDelete = (e: React.MouseEvent | React.PointerEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    vibrate(50);
    deleteRoute(id);
    onDelete(id);
  };

  const openDetails = (r: RouteEntry) => {
    vibrate(10);
    setSelected(r);
  };

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Histórico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {routes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma rota registrada ainda.
          </p>
        )}
        {routes.slice(0, 20).map((r) => {
          const isDayOff = (r.type ?? "route") === "dayoff";
          if (isDayOff) {
            return (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg bg-secondary/30 p-3 border-l-[3px] border-muted-foreground/40 animate-fade-in-soft"
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-muted-foreground">
                      {format(parseISO(r.date), "dd MMM yyyy", { locale: ptBR })} · Folga
                    </p>
                    <p className="text-[11px] text-muted-foreground/70">
                      Registrado automaticamente
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleDelete(e, r.id)}
                  aria-label="Remover folga"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          }
          return (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetails(r)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDetails(r);
                }
              }}
              className={`cursor-pointer w-full text-left flex items-center justify-between rounded-lg bg-secondary/50 p-3 border-l-[3px] border-success/60 transition-all press-feedback hover:bg-secondary/70 hover:border-success ${
                r.id === newId ? "animate-slide-down-fade ring-1 ring-primary/40" : ""
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-medium">
                    {format(parseISO(r.date), "dd MMM yyyy", { locale: ptBR })}
                  </p>
                  {r.platform && r.platform !== "none" && (() => {
                    const p = getPlatform(r.platform);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${p.className}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: p.dot }}
                          aria-hidden="true"
                        />
                        {p.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {r.kmDriven || (r.kmEnd - r.kmStart)} km • {(r.hoursWorked || 0).toFixed(1)}h • {formatCurrency(r.dailyValue)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-sm font-semibold ${
                    r.netProfit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCurrency(r.netProfit)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleDelete(e, r.id)}
                  aria-label="Excluir rota"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <RouteDetailDialog
        route={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </Card>
  );
}
