import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Fuel, Users, Landmark, Shield } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { type AdditionalExpense } from "@/components/ExtraExpenseForm";

interface Props {
  routes: RouteEntry[];
  extraExpenses: AdditionalExpense[];
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ExpenseBreakdown({ routes, extraExpenses }: Props) {
  const totalFuel = routes.reduce((s, r) => s + r.fuelCost, 0);
  const totalHelper = routes.reduce((s, r) => s + r.helperCost, 0);
  const totalFixed = routes.reduce((s, r) => s + r.fixedFee, 0);
  const totalReserve = routes.reduce((s, r) => s + (r.recommendedReserve || 0), 0);
  const totalExtra = extraExpenses.reduce((s, e) => s + e.amount, 0);
  const grandTotal = totalFuel + totalHelper + totalFixed + totalExtra;

  const items = [
    { label: "Combustível", value: totalFuel, icon: Fuel, color: "text-warning" },
    { label: "Ajudante", value: totalHelper, icon: Users, color: "text-info" },
    { label: "Taxa Fixa", value: totalFixed, icon: Landmark, color: "text-muted-foreground" },
    { label: "Reserva Recomendada", value: totalReserve, icon: Shield, color: "text-primary" },
    { label: "Gastos Extras", value: totalExtra, icon: Wallet, color: "text-destructive" },
  ];

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Resumo de Gastos</CardTitle>
          <span className="text-sm font-bold text-destructive">{formatCurrency(grandTotal)}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div className="flex items-center gap-2">
              <item.icon className={`h-4 w-4 ${item.color}`} />
              <span className="text-sm">{item.label}</span>
            </div>
            <span className={`text-sm font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
