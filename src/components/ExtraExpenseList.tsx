import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Receipt } from "lucide-react";
import { type AdditionalExpense, deleteExtraExpense } from "@/components/ExtraExpenseForm";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  expenses: AdditionalExpense[];
  onDelete: () => void;
}

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ExtraExpenseList({ expenses, onDelete }: Props) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5 text-warning" />
            Gastos Extras
          </CardTitle>
          {expenses.length > 0 && (
            <span className="text-sm font-semibold text-warning">{formatCurrency(total)}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
        {expenses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum gasto extra registrado.</p>
        )}
        {expenses.slice(0, 20).map((e) => (
          <div key={e.id} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{e.description}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(e.date), "dd MMM", { locale: ptBR })} • {e.category}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-warning">{formatCurrency(e.amount)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => { deleteExtraExpense(e.id); onDelete(); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
