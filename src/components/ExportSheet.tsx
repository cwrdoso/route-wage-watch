import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Share2, ClipboardList, FileSpreadsheet } from "lucide-react";
import type { RouteEntry } from "@/lib/storage";
import { onlyRoutes } from "@/lib/storage";
import type { AdditionalExpense } from "@/components/ExtraExpenseForm";
import { getPlatform } from "@/lib/platforms";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { vibrate } from "@/lib/haptics";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  routes: RouteEntry[];
  extraExpenses: AdditionalExpense[];
  /** Optional human-readable label for the period (e.g. "01–15 nov 2025") */
  periodLabel?: string;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildSummaryText(args: {
  routes: RouteEntry[];
  extraExpenses: AdditionalExpense[];
  periodLabel?: string;
}) {
  const r = onlyRoutes(args.routes);
  const revenue = r.reduce((s, x) => s + x.dailyValue, 0);
  const fuel = r.reduce((s, x) => s + x.fuelCost, 0);
  const helper = r.reduce((s, x) => s + x.helperCost, 0);
  const fixed = r.reduce((s, x) => s + x.fixedFee, 0);
  const extras = args.extraExpenses.reduce((s, x) => s + x.amount, 0);
  const costs = fuel + helper + fixed + extras;
  const profit = revenue - costs;
  const days = new Set(r.map((x) => x.date)).size;
  const hours = r.reduce((s, x) => s + (x.hoursWorked || 0), 0);

  const lines = [
    `📊 Resumo${args.periodLabel ? ` · ${args.periodLabel}` : ""}`,
    ``,
    `💰 Faturamento: ${fmtBRL(revenue)}`,
    `⛽ Combustível: ${fmtBRL(fuel)}`,
    `🧾 Outros custos: ${fmtBRL(helper + fixed + extras)}`,
    `✅ Lucro líquido: ${fmtBRL(profit)}`,
    ``,
    `📅 Dias trabalhados: ${days}`,
    `⏱️ Horas: ${hours.toFixed(1)}h`,
  ];
  return lines.join("\n");
}

function buildTSV(routes: RouteEntry[]) {
  const r = onlyRoutes(routes);
  const headers = [
    "Data",
    "KM",
    "Horas",
    "Faturamento",
    "Combustível",
    "Outros custos",
    "Lucro líquido",
    "Plataforma",
  ];
  const fmt = (n: number) => n.toFixed(2).replace(".", ",");
  const rows = r.map((x) => {
    const others = (x.helperCost || 0) + (x.fixedFee || 0);
    const dateLabel = (() => {
      try { return format(parseISO(x.date), "dd/MM/yyyy", { locale: ptBR }); } catch { return x.date; }
    })();
    return [
      dateLabel,
      String(x.kmDriven || x.kmEnd - x.kmStart),
      (x.hoursWorked || 0).toFixed(1).replace(".", ","),
      fmt(x.dailyValue),
      fmt(x.fuelCost),
      fmt(others),
      fmt(x.netProfit),
      getPlatform(x.platform).label,
    ].join("\t");
  });
  return [headers.join("\t"), ...rows].join("\n");
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through */ }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function ExportSheet({ open, onOpenChange, routes, extraExpenses, periodLabel }: Props) {
  const summaryText = useMemo(
    () => buildSummaryText({ routes, extraExpenses, periodLabel }),
    [routes, extraExpenses, periodLabel],
  );
  const tsvText = useMemo(() => buildTSV(routes), [routes]);

  const hasAnyRoute = onlyRoutes(routes).length > 0;

  const handleShare = async () => {
    vibrate(20);
    if (!hasAnyRoute) {
      toast.error("Nenhuma rota no período para compartilhar.");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Resumo financeiro",
          text: summaryText,
        });
        onOpenChange(false);
        return;
      } catch (err) {
        // User cancel or unsupported — fall back to clipboard
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    const ok = await copyToClipboard(summaryText);
    if (ok) {
      toast.success("Resumo copiado para a área de transferência!");
      onOpenChange(false);
    } else {
      toast.error("Não foi possível compartilhar nem copiar.");
    }
  };

  const handleCopyTSV = async () => {
    vibrate(20);
    if (!hasAnyRoute) {
      toast.error("Nenhuma rota no período para copiar.");
      return;
    }
    const ok = await copyToClipboard(tsvText);
    if (ok) {
      toast.success("Copiado! Cole em qualquer planilha.");
      onOpenChange(false);
    } else {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Exportar
          </SheetTitle>
          <SheetDescription className="text-xs">
            {periodLabel ? `Período: ${periodLabel}` : "Compartilhe ou copie os dados do período."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2 pb-4">
          <button
            type="button"
            onClick={handleShare}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors text-left press-feedback"
          >
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Compartilhar resumo</p>
              <p className="text-xs text-muted-foreground">Texto formatado com totais do período</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCopyTSV}
            className="w-full flex items-center gap-3 p-4 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors text-left press-feedback"
          >
            <div className="h-10 w-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-5 w-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Copiar para planilha</p>
              <p className="text-xs text-muted-foreground">Tabela TSV pronta para colar no Excel/Sheets</p>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
