import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, Pencil } from "lucide-react";
import {
  calculateEntry,
  getActiveRoute,
  getSettings,
  saveRoute,
  setActiveRoute,
  type ActiveRoute,
  type RouteEntry,
} from "@/lib/storage";
import { vibrate } from "@/lib/haptics";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onFinished: (entry: RouteEntry) => void;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function elapsedLabel(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h}h ${pad(m)}min`;
}

export function FinishRouteSheet({ open, onOpenChange, onFinished }: Props) {
  // Re-read settings + active route every time the sheet opens
  const [active, setActive] = useState<ActiveRoute | null>(null);
  const [kmEnd, setKmEnd] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [dailyValue, setDailyValue] = useState("");
  const [avgConsumption, setAvgConsumption] = useState(10);
  const [hasDefaultPrice, setHasDefaultPrice] = useState(true);
  const [saving, setSaving] = useState<"idle" | "saving" | "done">("idle");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (open) {
      const settings = getSettings();
      const a = getActiveRoute();
      setActive(a);
      setKmEnd("");
      const defaultPrice = Number(settings.defaultPricePerLiter ?? 0);
      setPricePerLiter(defaultPrice > 0 ? String(defaultPrice) : "");
      setHasDefaultPrice(defaultPrice > 0);
      setDailyValue(String(settings.defaultDailyValue ?? 350));
      setAvgConsumption(settings.avgConsumption || 10);
      setSaving("idle");
      setNow(Date.now());
    }
  }, [open]);

  // Keep "agora" / "tempo" live while sheet is open
  useEffect(() => {
    if (!open || !active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [open, active]);

  const startDate = useMemo(
    () => (active ? new Date(active.startedAt) : new Date()),
    [active]
  );
  const elapsedMs = now - startDate.getTime();

  const kmDriven = active ? Math.max(0, Number(kmEnd) - active.kmStart) : 0;
  const litersUsed = kmDriven / Math.max(0.1, avgConsumption);
  const fuelCost = litersUsed * (Number(pricePerLiter) || 0);

  const valid =
    !!active &&
    !!kmEnd &&
    Number(kmEnd) > active.kmStart &&
    Number(pricePerLiter) > 0 &&
    Number(dailyValue) > 0;

  const handleSave = () => {
    if (!valid || !active) return;
    setSaving("saving");
    setTimeout(() => {
      try {
        const endNow = new Date();
        // Use the END date so cross-midnight routes show on the correct day
        const dateStr = format(endNow, "yyyy-MM-dd");
        const timeStart = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
        const timeEnd = `${pad(endNow.getHours())}:${pad(endNow.getMinutes())}`;
        const entry = calculateEntry(
          dateStr,
          active.kmStart,
          Number(kmEnd),
          Number(dailyValue),
          Number(pricePerLiter),
          timeStart,
          timeEnd,
          active.helperCost,
        );
        saveRoute(entry);
        setActiveRoute(null);
        vibrate(60);
        setSaving("done");
        setTimeout(() => {
          onFinished(entry);
          onOpenChange(false);
        }, 450);
      } catch (err) {
        console.error("Erro ao finalizar rota:", err);
        toast.error("Erro ao salvar rota. Tente novamente.");
        setSaving("idle");
      }
    }, 300);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t-2 border-success/30 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Finalizando rota</SheetTitle>
          <SheetDescription className="sr-only">
            Informe o KM final, preço da gasolina e diária para encerrar a rota.
          </SheetDescription>
        </SheetHeader>

        {!active ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma rota em andamento.
          </div>
        ) : (
          <div className="space-y-4 mt-4 pb-6">
            <div className="rounded-lg bg-secondary/50 p-3 space-y-1 text-sm">
              <p className="text-muted-foreground">
                Início:{" "}
                <span className="text-foreground font-medium tabular-nums">
                  {pad(startDate.getHours())}:{pad(startDate.getMinutes())}
                </span>{" "}
                · Agora:{" "}
                <span className="text-foreground font-medium tabular-nums">
                  {pad(new Date(now).getHours())}:{pad(new Date(now).getMinutes())}
                </span>
              </p>
              <p className="text-muted-foreground">
                Tempo:{" "}
                <span className="text-primary font-semibold tabular-nums">
                  {elapsedLabel(elapsedMs)}
                </span>
              </p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">KM Final</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder={`Maior que ${active.kmStart}`}
                value={kmEnd}
                onChange={(e) => setKmEnd(e.target.value)}
                className="mt-1 text-lg"
                autoFocus
              />
              {kmDriven > 0 && (
                <p className="text-xs text-muted-foreground mt-1 animate-time-flash" key={kmDriven}>
                  {kmDriven} km percorridos
                </p>
              )}
            </div>

            {!hasDefaultPrice && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
                Defina o <span className="font-semibold">Preço Padrão da Gasolina</span> em Configurações para calcular o custo automaticamente.
              </div>
            )}

            {kmDriven > 0 && Number(pricePerLiter) > 0 && (
              <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground animate-time-flash flex items-center justify-between gap-2" key={`${kmDriven}-${pricePerLiter}`}>
                <span>
                  Combustível: {litersUsed.toFixed(1)} L · {fmt(fuelCost)}{" "}
                  <span className="text-muted-foreground/70">(R$ {Number(pricePerLiter).toFixed(2)}/L)</span>
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Ajustar preço da gasolina"
                      className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 p-3">
                    <Label className="text-xs text-muted-foreground">Preço da gasolina (R$/L)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      value={pricePerLiter}
                      onChange={(e) => setPricePerLiter(e.target.value)}
                      className="mt-1 h-9"
                      autoFocus
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Apenas para esta rota. Para alterar o padrão, use Configurações.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Diária (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={dailyValue}
                onChange={(e) => setDailyValue(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!valid || saving !== "idle"}
              className="w-full h-12 gap-2 text-base font-semibold bg-success hover:bg-success/90 text-white"
            >
              {saving === "idle" && "Salvar e ver resumo"}
              {saving === "saving" && (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Salvando…
                </>
              )}
              {saving === "done" && (
                <>
                  <Check className="h-5 w-5 animate-stagger-in" strokeWidth={3} />
                  Salvo!
                </>
              )}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
