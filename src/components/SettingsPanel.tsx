import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings, Save, Target, Car, Wallet } from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage";
import { toast } from "sonner";

function SectionTitle({ icon: Icon, label }: { icon: typeof Car; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/40 bg-secondary/20 p-4 space-y-4">
      {children}
    </div>
  );
}

export function SettingsPanel() {
  const settings = getSettings();
  const [avgConsumption, setAvgConsumption] = useState(String(settings.avgConsumption));
  const [reservePerKm, setReservePerKm] = useState(String(settings.reservePerKm));
  const [defaultDailyValue, setDefaultDailyValue] = useState(String(settings.defaultDailyValue));
  const [defaultPricePerLiter, setDefaultPricePerLiter] = useState(String(settings.defaultPricePerLiter ?? 6));
  const [helperCost, setHelperCost] = useState(String(settings.helperCost ?? 50));
  const [fixedFee, setFixedFee] = useState(String(settings.fixedFee ?? ""));
  const [monthlyGoal, setMonthlyGoal] = useState(String(settings.monthlyGoal || ""));
  const [fortnightGoal, setFortnightGoal] = useState(String(settings.fortnightGoal || ""));
  const [fortnightTouched, setFortnightTouched] = useState(false);

  const handleMonthlyChange = (v: string) => {
    setMonthlyGoal(v);
    if (!fortnightTouched && v) {
      const half = Number(v) / 2;
      setFortnightGoal(half ? String(half) : "");
    }
  };

  const handleSave = () => {
    const monthly = Number(monthlyGoal) || 0;
    let fort = Number(fortnightGoal) || 0;
    if (monthly > 0 && !fort) fort = monthly / 2;
    saveSettings({
      avgConsumption: Number(avgConsumption),
      reservePerKm: Number(reservePerKm),
      defaultDailyValue: Number(defaultDailyValue),
      defaultPricePerLiter: Number(defaultPricePerLiter) || 0,
      helperCost: Number(helperCost),
      fixedFee: fixedFee.trim() === "" ? 0 : Number(fixedFee),
      monthlyGoal: monthly,
      fortnightGoal: fort,
      hourlyGoal: 0,
      routeMode: settings.routeMode,
    });
    toast.success("Configurações salvas!");
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          Configurações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Veículo */}
        <div>
          <SectionTitle icon={Car} label="Veículo" />
          <SectionCard>
            <div>
              <Label className="text-xs text-muted-foreground">Consumo Médio (km/l)</Label>
              <Input type="number" step="0.1" value={avgConsumption} onChange={(e) => setAvgConsumption(e.target.value)} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Usado para calcular litros consumidos a partir dos KM rodados.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preço Padrão da Gasolina (R$/litro)</Label>
              <Input type="number" step="0.01" value={defaultPricePerLiter} onChange={(e) => setDefaultPricePerLiter(e.target.value)} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Valor sugerido ao finalizar uma rota dinâmica.</p>
            </div>
          </SectionCard>
        </div>

        {/* Financeiro */}
        <div>
          <SectionTitle icon={Wallet} label="Financeiro" />
          <SectionCard>
            <div>
              <Label className="text-xs text-muted-foreground">Reserva por KM (R$)</Label>
              <Input type="number" step="0.01" value={reservePerKm} onChange={(e) => setReservePerKm(e.target.value)} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Valor recomendado por km para manutenção/reserva.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Diária Padrão (R$)</Label>
              <Input type="number" step="0.01" value={defaultDailyValue} onChange={(e) => setDefaultDailyValue(e.target.value)} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Valor preenchido automaticamente no formulário de rota.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Custo do Ajudante (R$)</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant={helperCost === "50" ? "default" : "outline"} className="flex-1" onClick={() => setHelperCost("50")}>R$ 50</Button>
                <Button type="button" variant={helperCost === "40" ? "default" : "outline"} className="flex-1" onClick={() => setHelperCost("40")}>R$ 40</Button>
                <Button type="button" variant={helperCost === "0" ? "default" : "outline"} className="flex-1" onClick={() => setHelperCost("0")}>R$ 0</Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Valor fixo do ajudante por rota.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Taxa Fixa por Rota (R$) <span className="text-muted-foreground/60">— opcional</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Deixe em branco se não houver"
                value={fixedFee}
                onChange={(e) => setFixedFee(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Taxa cobrada por rota (ex: aluguel, plataforma). Deixe vazio ou 0 se não se aplica.</p>
            </div>
          </SectionCard>
        </div>

        {/* Metas de Ganho */}
        <div>
          <SectionTitle icon={Target} label="Metas de Ganho" />
          <SectionCard>
            <div>
              <Label className="text-xs text-muted-foreground">Meta Mensal (R$)</Label>
              <Input
                type="number"
                step="1"
                placeholder="Ex: 6000"
                value={monthlyGoal}
                onChange={(e) => handleMonthlyChange(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Quanto você quer ganhar de lucro líquido por mês.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Meta Quinzenal (R$)</Label>
              <Input
                type="number"
                step="1"
                placeholder="Calculado automaticamente (Meta Mensal ÷ 2)"
                value={fortnightGoal}
                onChange={(e) => { setFortnightGoal(e.target.value); setFortnightTouched(true); }}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Meta para a primeira e segunda quinzena do mês.</p>
            </div>
          </SectionCard>
        </div>

        <Button onClick={handleSave} className="w-full gap-2">
          <Save className="h-4 w-4" />
          Salvar Configurações
        </Button>
      </CardContent>
    </Card>
  );
}
