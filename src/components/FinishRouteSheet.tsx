import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, AlertCircle } from "lucide-react";
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
  /** Optional callback when user clicks "Alterar" on the daily value line */
  onOpenSettings?: () => void;
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

export function FinishRouteSheet({ open, onOpenChange, onFinished, onOpenSettings }: Props) {
  const [active, setActive] = useState<ActiveRoute | null>(null);
  const [kmEnd, setKmEnd] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [dailyValue, setDailyValue] = useState<string>("");
  const [defaultDailyValue, setDefaultDailyValue] = useState(0);
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
      const dDaily = Number(settings.defaultDailyValue ?? 350);
      setDefaultDailyValue(dDaily);
      setDailyValue(dDaily > 0 ? String(dDaily) : "");
      setAvgConsumption(settings.avgConsumption || 10);
      setSaving("idle");
      setNow(Date.now());
    }
  }, [open]);

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

  const kmEndNum = Number(kmEnd);
  const kmStart = active?.kmStart ?? 0;
  const kmDriven = active ? Math.max(0, kmEndNum - kmStart) : 0;
  const litersUsed = kmDriven / Math.max(0.1, avgConsumption);
  const fuelCost = litersUsed * (Number(pricePerLiter) || 0);

  // Inline KM validation
  const kmTouched = kmEnd.trim() !== "";
  const kmInvalid = kmTouched && (Number.isNaN(kmEndNum) || kmEndNum <= kmStart);

  const dailyValueNum = Number(dailyValue);
  const valid =
    !!active &&
    kmTouched &&
    !kmInvalid &&
    Number(pricePerLiter) > 0 &&
    dailyValueNum > 0;

  const handleSave = () => {
    if (!valid || !active) return;
    setSaving("saving");
    setTimeout(() => {
      try {
        const endNow = new Date();
        const dateStr = format(endNow, "yyyy-MM-dd");
        const timeStart = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`;
        const timeEnd = `${pad(endNow.getHours())}:${pad(endNow.getMinutes())}`;
        const entry = calculateEntry(
          dateStr,
          active.kmStart,
          kmEndNum,
          dailyValueNum,
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
            Informe o KM final para encerrar a rota. A diária é lida das Configurações.
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

            {/* Diária — editável, padrão das configurações */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs text-muted-foreground">
                  Diária (R$)
                  {defaultDailyValue > 0 && (
                    <span className="text-muted-foreground/60"> — padrão {fmt(defaultDailyValue)}</span>
                  )}
                </Label>
                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      setTimeout(() => onOpenSettings(), 150);
                    }}
                    className="text-xs font-medium text-primary hover:underline shrink-0"
                  >
                    Alterar padrão
                  </button>
                )}
              </div>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={dailyValue}
                onChange={(e) => setDailyValue(e.target.value)}
                placeholder="Ex.: 350"
                className="text-lg"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">KM Final</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder={`Maior que ${kmStart}`}
                value={kmEnd}
                onChange={(e) => setKmEnd(e.target.value)}
                className={`mt-1 text-lg ${kmInvalid ? "border-destructive focus-visible:ring-destructive" : ""}`}
                aria-invalid={kmInvalid || undefined}
                aria-describedby={kmInvalid ? "kmend-error" : undefined}
                autoFocus
              />
              {kmInvalid ? (
                <p id="kmend-error" className="flex items-center gap-1 text-xs text-destructive mt-1.5 animate-fade-in">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  KM deve ser maior que {kmStart}
                </p>
              ) : (
                kmDriven > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 animate-time-flash" key={kmDriven}>
                    {kmDriven} km percorridos
                  </p>
                )
              )}
            </div>

            {!hasDefaultPrice && (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-foreground">
                Defina o <span className="font-semibold">Preço Padrão da Gasolina</span> em Configurações para calcular o custo automaticamente.
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Preço da gasolina (R$/L)</Label>
              <Input
                type="number"
                step="0.01"
                inputMode="decimal"
                value={pricePerLiter}
                onChange={(e) => setPricePerLiter(e.target.value)}
                placeholder="Ex.: 5.99"
                className="mt-1"
              />
            </div>

            {kmDriven > 0 && Number(pricePerLiter) > 0 && (
              <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground animate-time-flash" key={`${kmDriven}-${pricePerLiter}`}>
                Combustível: {litersUsed.toFixed(1)} L · {fmt(fuelCost)}{" "}
                <span className="text-muted-foreground/70">(R$ {Number(pricePerLiter).toFixed(2)}/L)</span>
              </div>
            )}

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
