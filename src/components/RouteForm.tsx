import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Route } from "lucide-react";
import { calculateEntry, getSettings, saveRoute, type RouteEntry } from "@/lib/storage";
import { format } from "date-fns";
import { vibrate } from "@/lib/haptics";

interface RouteFormProps {
  onSave: (entry: RouteEntry) => void;
}

export function RouteForm({ onSave }: RouteFormProps) {
  const settings = getSettings();
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [kmStart, setKmStart] = useState("");
  const [kmEnd, setKmEnd] = useState("");
  const [dailyValue, setDailyValue] = useState(String(settings.defaultDailyValue));
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [timeStart, setTimeStart] = useState("07:00");
  const [timeEnd, setTimeEnd] = useState("17:00");
  const btnRef = useRef<HTMLButtonElement>(null);

  const kmDriven = Number(kmEnd) - Number(kmStart);
  const litersUsed = kmDriven > 0 ? kmDriven / settings.avgConsumption : 0;
  const fuelCost = litersUsed * Number(pricePerLiter);
  const reserve = kmDriven > 0 ? kmDriven * settings.reservePerKm : 0;

  const [sh, sm] = timeStart.split(":").map(Number);
  const [eh, em] = timeEnd.split(":").map(Number);
  let hoursPreview = (eh + em / 60) - (sh + sm / 60);
  if (hoursPreview < 0) hoursPreview += 24;

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entry = calculateEntry(
      date,
      Number(kmStart),
      Number(kmEnd),
      Number(dailyValue),
      Number(pricePerLiter),
      timeStart,
      timeEnd
    );
    saveRoute(entry);
    onSave(entry);
    vibrate(50);
    setKmStart("");
    setKmEnd("");
    setDailyValue(String(settings.defaultDailyValue));
    setPricePerLiter("");
    setTimeStart("07:00");
    setTimeEnd("17:00");
  };

  const isValid = date && kmStart && kmEnd && dailyValue && pricePerLiter && kmDriven > 0 && timeStart && timeEnd;

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Route className="h-5 w-5 text-primary" />
          Nova Rota
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hora Início (24h)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="07:00"
              maxLength={5}
              value={timeStart}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d]/g, "");
                if (v.length > 4) v = v.slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + ":" + v.slice(2);
                setTimeStart(v);
              }}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hora Fim (24h)</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="17:00"
              maxLength={5}
              value={timeEnd}
              onChange={(e) => {
                let v = e.target.value.replace(/[^\d]/g, "");
                if (v.length > 4) v = v.slice(0, 4);
                if (v.length >= 3) v = v.slice(0, 2) + ":" + v.slice(2);
                setTimeEnd(v);
              }}
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">KM Inicial</Label>
            <Input type="number" placeholder="0" value={kmStart} onChange={(e) => setKmStart(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">KM Final</Label>
            <Input type="number" placeholder="0" value={kmEnd} onChange={(e) => setKmEnd(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Diária (R$)</Label>
            <Input type="number" step="0.01" placeholder="350" value={dailyValue} onChange={(e) => setDailyValue(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Preço/Litro (R$)</Label>
            <Input type="number" step="0.01" placeholder="0,00" value={pricePerLiter} onChange={(e) => setPricePerLiter(e.target.value)} className="mt-1" />
          </div>

          {kmDriven > 0 && Number(pricePerLiter) > 0 && (() => {
            const dv = Number(dailyValue);
            const fixedFeeCfg = settings.fixedFee ?? 50;
            const fixedFeeApplied = dv < 350 ? 0 : fixedFeeCfg;
            const helperApplied = settings.helperCost;
            const totalCosts = fuelCost + helperApplied + fixedFeeApplied;
            const profit = dv - totalCosts;
            return (
              <div className="col-span-2 rounded-lg bg-secondary/50 p-3 space-y-1.5 text-sm animate-fade-in">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Resumo de Gastos da Rota</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KM Rodados</span>
                  <span className="font-medium tabular-nums">{kmDriven} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Horas Trabalhadas</span>
                  <span className="font-medium tabular-nums">{hoursPreview.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Combustível ({settings.avgConsumption} km/l • {litersUsed.toFixed(2)} L)</span>
                  <span className="font-medium text-warning tabular-nums">R$ {fuelCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ajudante</span>
                  <span className="font-medium text-info tabular-nums">R$ {helperApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa Fixa</span>
                  <span className="font-medium text-muted-foreground tabular-nums">R$ {fixedFeeApplied.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-1.5">
                  <span className="text-muted-foreground">Reserva (R$ {settings.reservePerKm.toFixed(2)}/km)</span>
                  <span className="font-medium text-primary tabular-nums">R$ {reserve.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border/50 pt-1.5 font-bold">
                  <span>Gastos Totais</span>
                  <span className="text-destructive tabular-nums">R$ {totalCosts.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Lucro Estimado</span>
                  <span className={`tabular-nums transition-colors ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                    R$ {profit.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })()}

          <Button
            ref={btnRef}
            type="submit"
            disabled={!isValid}
            onMouseDown={createRipple}
            className="col-span-2 mt-2 gap-2 ripple-container hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Registrar Rota
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
