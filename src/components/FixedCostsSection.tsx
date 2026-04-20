import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Sparkles, CheckCircle2, Pencil, X } from "lucide-react";
import {
  type FixedCost,
  getFixedCosts,
  saveFixedCost,
  deleteFixedCost,
  newFixedCost,
  suggestPerRoute,
  cycleEndDate,
  daysRemainingInCycle,
} from "@/lib/fixedCosts";
import { onCloudChange } from "@/lib/cloudSync";
import { toast } from "sonner";
import { vibrate } from "@/lib/haptics";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function fmtCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface DraftState {
  id: string | null; // null = new
  name: string;
  totalAmount: string;
  period: "monthly" | "biweekly";
  perRouteAmount: string;
}

const emptyDraft = (): DraftState => ({
  id: null,
  name: "",
  totalAmount: "",
  period: "monthly",
  perRouteAmount: "",
});

export function FixedCostsSection() {
  const [costs, setCosts] = useState<FixedCost[]>(() => getFixedCosts());
  const [draft, setDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    const unsub = onCloudChange(() => setCosts(getFixedCosts()));
    return () => { unsub(); };
  }, []);

  const refresh = () => setCosts(getFixedCosts());

  const startNew = () => setDraft(emptyDraft());
  const startEdit = (c: FixedCost) =>
    setDraft({
      id: c.id,
      name: c.name,
      totalAmount: String(c.totalAmount),
      period: c.period,
      perRouteAmount: String(c.perRouteAmount),
    });
  const cancelDraft = () => setDraft(null);

  const handleSuggest = () => {
    if (!draft) return;
    const total = Number(draft.totalAmount) || 0;
    if (total <= 0) {
      toast.error("Informe o valor total primeiro");
      return;
    }
    const fake: FixedCost = {
      ...newFixedCost({
        totalAmount: total,
        period: draft.period,
        accumulated: 0,
      }),
    };
    const suggestion = suggestPerRoute(fake, 1);
    setDraft({ ...draft, perRouteAmount: String(suggestion) });
  };

  const handleSave = async () => {
    if (!draft) return;
    const name = draft.name.trim();
    const total = Number(draft.totalAmount) || 0;
    const perRoute = Number(draft.perRouteAmount) || 0;
    if (!name) return toast.error("Dê um nome ao custo");
    if (total <= 0) return toast.error("Valor total deve ser maior que zero");
    if (perRoute <= 0) return toast.error("Valor por rota deve ser maior que zero");

    if (draft.id) {
      const existing = costs.find((c) => c.id === draft.id);
      if (existing) {
        await saveFixedCost({
          ...existing,
          name,
          totalAmount: total,
          period: draft.period,
          perRouteAmount: perRoute,
        });
      }
    } else {
      await saveFixedCost(
        newFixedCost({
          name,
          totalAmount: total,
          period: draft.period,
          perRouteAmount: perRoute,
        }),
      );
    }
    vibrate(40);
    toast.success(draft.id ? "Custo atualizado!" : "Custo fixo criado!");
    setDraft(null);
    refresh();
  };

  const handleDelete = async (id: string) => {
    await deleteFixedCost(id);
    vibrate(50);
    toast.success("Custo removido");
    refresh();
  };

  return (
    <div className="space-y-3">
      {costs.length === 0 && !draft && (
        <p className="text-[12px] text-muted-foreground leading-snug">
          Cadastre custos recorrentes (aluguel, internet, plano de celular). O app desconta um valor de cada rota até quitar o total.
        </p>
      )}

      {costs.map((c) => {
        const remaining = Math.max(0, c.totalAmount - c.accumulated);
        const pct = c.totalAmount > 0 ? Math.min(100, (c.accumulated / c.totalAmount) * 100) : 0;
        const done = remaining <= 0;
        const end = cycleEndDate(c.cycleStart, c.period);
        const days = daysRemainingInCycle(c);
        return (
          <div
            key={c.id}
            className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  {done && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="h-3 w-3" /> Quitado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {c.period === "monthly" ? "Mensal" : "Quinzenal"} •{" "}
                  {fmtCurrency(c.perRouteAmount)}/rota • {days}d restantes (até{" "}
                  {format(end, "dd/MM", { locale: ptBR })})
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => startEdit(c)}
                  aria-label="Editar"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(c.id)}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <Progress
                value={pct}
                className={done ? "[&>div]:bg-success" : ""}
              />
              <div className="flex justify-between mt-1 text-[11px] tabular-nums">
                <span className="text-muted-foreground">
                  {fmtCurrency(c.accumulated)} / {fmtCurrency(c.totalAmount)}
                </span>
                <span className={done ? "text-success font-medium" : "text-muted-foreground"}>
                  {pct.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {draft && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              {draft.id ? "Editar custo" : "Novo custo fixo"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={cancelDraft}
              aria-label="Cancelar"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Nome</Label>
            <Input
              placeholder="Ex: Aluguel do veículo"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Valor total (R$)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex: 800"
                value={draft.totalAmount}
                onChange={(e) => setDraft({ ...draft, totalAmount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Período</Label>
              <Select
                value={draft.period}
                onValueChange={(v) => setDraft({ ...draft, period: v as "monthly" | "biweekly" })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="biweekly">Quinzenal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Descontar por rota (R$)</Label>
            <Input
              type="number"
              step="0.01"
              inputMode="decimal"
              placeholder="Ex: 20"
              value={draft.perRouteAmount}
              onChange={(e) => setDraft({ ...draft, perRouteAmount: e.target.value })}
              className="mt-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSuggest}
              className="mt-2 h-8 gap-1.5 text-xs w-full"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Sugerir valor automaticamente
            </Button>
            <p className="text-[11px] text-muted-foreground mt-1">
              Sugestão = valor restante ÷ dias restantes do ciclo (1 rota/dia).
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={cancelDraft}>
              Cancelar
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      )}

      {!draft && (
        <Button
          type="button"
          variant="outline"
          onClick={startNew}
          className="w-full gap-2 h-9"
        >
          <Plus className="h-4 w-4" />
          Adicionar custo fixo
        </Button>
      )}
    </div>
  );
}
