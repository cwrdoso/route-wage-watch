import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Fuel, Users, Landmark, Shield, TrendingDown, Receipt, DollarSign } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import { type AdditionalExpense } from "@/components/ExtraExpenseForm";
import { useCountUp } from "@/hooks/useCountUp";
import { marginColor } from "@/lib/goals";

interface Props {
  routes: RouteEntry[];
  extraExpenses: AdditionalExpense[];
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MARGIN_TEXT = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
} as const;

export function OperationalCosts({ routes: allRoutes, extraExpenses }: Props) {
  const routes = onlyRoutes(allRoutes);
  const totalRevenue = routes.reduce((s, r) => s + r.dailyValue, 0);
  const totalFuel = routes.reduce((s, r) => s + r.fuelCost, 0);
  const totalHelper = routes.reduce((s, r) => s + r.helperCost, 0);
  const totalFixed = routes.reduce((s, r) => s + r.fixedFee, 0);
  const totalReserve = routes.reduce((s, r) => s + (r.recommendedReserve || 0), 0);
  const totalExtra = extraExpenses.reduce((s, e) => s + e.amount, 0);
  const totalCosts = totalFuel + totalHelper + totalFixed + totalExtra;
  const netProfit = totalRevenue - totalCosts;
  const totalKm = routes.reduce((s, r) => s + r.kmDriven, 0);
  const totalLiters = routes.reduce((s, r) => s + r.litersUsed, 0);

  const animatedRevenue = useCountUp(totalRevenue, 800);
  const animatedCosts = useCountUp(totalCosts, 800);
  const animatedProfit = useCountUp(netProfit, 800);

  const profitPercentNum = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const profitPercent = profitPercentNum.toFixed(1);
  const marginCls = MARGIN_TEXT[marginColor(profitPercentNum)];

  const costItems = [
    { label: "Combustível", detail: `${totalLiters.toFixed(1)}L • ${totalKm} km`, value: totalFuel, icon: Fuel, color: "text-warning", bar: "bg-warning" },
    { label: "Ajudante", detail: `${routes.filter(r => r.helperCost > 0).length} rotas`, value: totalHelper, icon: Users, color: "text-info", bar: "bg-info" },
    { label: "Taxa Fixa", detail: `${routes.filter(r => r.fixedFee > 0).length} rotas`, value: totalFixed, icon: Landmark, color: "text-muted-foreground", bar: "bg-muted-foreground" },
    { label: "Gastos Extras", detail: `${extraExpenses.length} itens`, value: totalExtra, icon: Receipt, color: "text-destructive", bar: "bg-destructive" },
  ];

  const [barsReady, setBarsReady] = useState(false);
  useEffect(() => {
    setBarsReady(false);
    const t = setTimeout(() => setBarsReady(true), 50);
    return () => clearTimeout(t);
  }, [totalCosts]);

  return (
    <div className="space-y-4">
      {/* 1º — Lucro Líquido em destaque */}
      <Card className="glass-card border-success/30 animate-stagger-in" style={{ animationDelay: "0ms" }}>
        <CardContent className="pt-5 pb-5 text-center space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Lucro Líquido</p>
          <div className="flex items-baseline justify-center gap-2 flex-wrap">
            <span className={`text-[28px] font-semibold tabular-nums ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {fmt(animatedProfit)}
            </span>
            <span className={`text-base font-semibold ${marginCls} tabular-nums`}>
              ({profitPercent}%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Você ficou com {profitPercent}% do que faturou
          </p>
        </CardContent>
      </Card>

      {/* 2º + 3º — Faturamento e Custos lado a lado */}
      <div className="grid grid-cols-2 gap-3 animate-stagger-in" style={{ animationDelay: "80ms" }}>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Faturamento</span>
            </div>
            <p className="text-base font-bold tabular-nums">{fmt(animatedRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Custos</span>
            </div>
            <p className="text-base font-bold text-foreground tabular-nums">{fmt(animatedCosts)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost breakdown */}
      <Card data-tour="cost-breakdown" className="glass-card animate-stagger-in" style={{ animationDelay: "160ms" }}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="h-5 w-5 text-warning" />
            Detalhamento de Custos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {costItems.map((item) => {
            const pct = totalCosts > 0 ? (item.value / totalCosts) * 100 : 0;
            return (
              <div key={item.label} className="rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${item.color} tabular-nums`}>{fmt(item.value)}</span>
                    <p className="text-xs text-muted-foreground">{pct.toFixed(0)}%</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.bar}`}
                    style={{
                      width: barsReady ? `${pct}%` : "0%",
                      transition: "width 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Reserve info */}
      <Card className="glass-card border-primary/10 animate-stagger-in" style={{ animationDelay: "240ms" }}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <div>
                <span className="text-sm font-medium">Reserva Recomendada</span>
                <p className="text-xs text-muted-foreground">Não descontada do lucro</p>
              </div>
            </div>
            <span className="text-sm font-semibold text-primary tabular-nums">{fmt(totalReserve)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Extra expenses detail */}
      {extraExpenses.length > 0 && (
        <Card className="glass-card animate-stagger-in" style={{ animationDelay: "320ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Gastos Extras Detalhados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {extraExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                <div>
                  <span className="font-medium">{e.description}</span>
                  <span className="text-xs text-muted-foreground ml-2">{e.category}</span>
                </div>
                <span className="font-semibold text-destructive tabular-nums">{fmt(e.amount)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
