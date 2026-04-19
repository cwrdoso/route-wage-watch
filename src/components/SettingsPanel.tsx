import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Save,
  Target,
  Car,
  Wallet,
  Sparkles,
  ChevronDown,
  Lock,
  Info,
  HelpCircle,
} from "lucide-react";
import { getSettings, saveSettings } from "@/lib/storage";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type SectionKey = "essencial" | "veiculo" | "financeiro" | "metas";

interface Props {
  /** Optional: open this section on mount (used when navigating from elsewhere) */
  initialOpen?: SectionKey;
  /** Optional callback to restart the guided tour */
  onRestartTour?: () => void;
}

interface SectionProps {
  id: SectionKey;
  open: boolean;
  onToggle: (id: SectionKey) => void;
  icon: typeof Car;
  label: string;
  badge?: string;
  children: React.ReactNode;
}

function Section({ id, open, onToggle, icon: Icon, label, badge, children }: SectionProps) {
  return (
    <Collapsible open={open} onOpenChange={() => onToggle(id)}>
      <div className="rounded-xl border border-border/40 bg-secondary/20 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-medium uppercase tracking-wider text-foreground">
                {label}
              </span>
              {badge && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/15 text-warning">
                  {badge}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
          <div className="px-4 pb-4 pt-1 space-y-4">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function SettingsPanel({ initialOpen, onRestartTour }: Props = {}) {
  const settings = getSettings();
  const [avgConsumption, setAvgConsumption] = useState(String(settings.avgConsumption));
  const [reservePerKm, setReservePerKm] = useState(String(settings.reservePerKm));
  const [defaultDailyValue, setDefaultDailyValue] = useState(String(settings.defaultDailyValue || ""));
  const [defaultPricePerLiter, setDefaultPricePerLiter] = useState(String(settings.defaultPricePerLiter || ""));
  const [helperCost, setHelperCost] = useState(String(settings.helperCost ?? 50));
  const [fixedFee, setFixedFee] = useState(String(settings.fixedFee ?? ""));
  const [monthlyGoal, setMonthlyGoal] = useState(String(settings.monthlyGoal || ""));
  const [fortnightGoal, setFortnightGoal] = useState(String(settings.fortnightGoal || ""));

  // Track whether the essentials onboarding has been completed (persisted in localStorage)
  const [essentialsDone, setEssentialsDone] = useState<boolean>(() => {
    return Number(settings.defaultDailyValue) > 0 && Number(settings.defaultPricePerLiter) > 0;
  });

  // Section open state — only Essencial open by default
  const [openSection, setOpenSection] = useState<SectionKey | null>(initialOpen ?? "essencial");

  const dailyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialOpen) {
      setOpenSection(initialOpen);
      // Focus first essential field shortly after section expands
      if (initialOpen === "essencial") {
        const t = window.setTimeout(() => dailyRef.current?.focus(), 250);
        return () => window.clearTimeout(t);
      }
    }
  }, [initialOpen]);

  // Refs to read latest values inside the global event listener
  const dailyValRef = useRef(defaultDailyValue);
  const fuelValRef = useRef(defaultPricePerLiter);
  const consumptionValRef = useRef(avgConsumption);
  const reserveValRef = useRef(reservePerKm);
  const helperValRef = useRef(helperCost);
  const fixedFeeValRef = useRef(fixedFee);
  useEffect(() => { dailyValRef.current = defaultDailyValue; }, [defaultDailyValue]);
  useEffect(() => { fuelValRef.current = defaultPricePerLiter; }, [defaultPricePerLiter]);
  useEffect(() => { consumptionValRef.current = avgConsumption; }, [avgConsumption]);
  useEffect(() => { reserveValRef.current = reservePerKm; }, [reservePerKm]);
  useEffect(() => { helperValRef.current = helperCost; }, [helperCost]);
  useEffect(() => { fixedFeeValRef.current = fixedFee; }, [fixedFee]);

  // Listen for the guided tour asking us to silently persist all editable fields
  useEffect(() => {
    const saveHandler = () => {
      const cur = getSettings();
      saveSettings({
        ...cur,
        avgConsumption: Number(consumptionValRef.current) || cur.avgConsumption || 10,
        reservePerKm: Number(reserveValRef.current) || cur.reservePerKm || 0,
        defaultDailyValue: Number(dailyValRef.current) || cur.defaultDailyValue || 0,
        defaultPricePerLiter: Number(fuelValRef.current) || cur.defaultPricePerLiter || 0,
        helperCost: Number(helperValRef.current) || 0,
        fixedFee: fixedFeeValRef.current.trim() === "" ? 0 : Number(fixedFeeValRef.current),
      });
      const done =
        Number(dailyValRef.current) > 0 && Number(fuelValRef.current) > 0;
      setEssentialsDone((prev) => prev || done);
    };
    const openHandler = (e: Event) => {
      const detail = (e as CustomEvent<{ section?: SectionKey }>).detail;
      if (detail?.section) setOpenSection(detail.section);
    };
    window.addEventListener("tour:save-essentials", saveHandler);
    window.addEventListener("tour:open-section", openHandler as EventListener);
    return () => {
      window.removeEventListener("tour:save-essentials", saveHandler);
      window.removeEventListener("tour:open-section", openHandler as EventListener);
    };
  }, []);

  const toggleSection = (id: SectionKey) => {
    setOpenSection((cur) => (cur === id ? null : id));
  };

  const handleMonthlyChange = (v: string) => {
    setMonthlyGoal(v);
    // Always auto-derive (fortnight is now read-only)
    const n = Number(v);
    setFortnightGoal(n > 0 ? String(n / 2) : "");
  };

  const handleSave = () => {
    const monthly = Number(monthlyGoal) || 0;
    const fort = monthly > 0 ? monthly / 2 : 0;
    saveSettings({
      avgConsumption: Number(avgConsumption),
      reservePerKm: Number(reservePerKm),
      defaultDailyValue: Number(defaultDailyValue) || 0,
      defaultPricePerLiter: Number(defaultPricePerLiter) || 0,
      helperCost: Number(helperCost),
      fixedFee: fixedFee.trim() === "" ? 0 : Number(fixedFee),
      monthlyGoal: monthly,
      fortnightGoal: fort,
      hourlyGoal: 0,
      routeMode: settings.routeMode,
    });
    setFortnightGoal(fort > 0 ? String(fort) : "");
    const newEssentialsDone = Number(defaultDailyValue) > 0 && Number(defaultPricePerLiter) > 0;
    setEssentialsDone(newEssentialsDone);
    toast.success("Configurações salvas!");
  };

  const showOnboardingBanner = !essentialsDone;

  const handleOnboardingClick = () => {
    setOpenSection("essencial");
    setTimeout(() => dailyRef.current?.focus(), 250);
  };

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-primary" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showOnboardingBanner && (
            <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 p-4 space-y-3 animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">Comece por aqui</p>
                  <p className="text-[13px] text-muted-foreground leading-snug">
                    Configure sua diária e o preço da gasolina para cálculos precisos do seu lucro real.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full h-9 font-medium"
                onClick={handleOnboardingClick}
              >
                Configurar agora
              </Button>
            </div>
          )}

          <Section
            id="essencial"
            open={openSection === "essencial"}
            onToggle={toggleSection}
            icon={Sparkles}
            label="Essencial"
          >
            <div>
              <Label className="text-xs text-muted-foreground">Diária Padrão (R$)</Label>
              <Input
                ref={dailyRef}
                data-tour="settings-daily"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex: 350"
                value={defaultDailyValue}
                onChange={(e) => setDefaultDailyValue(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Valor da sua diária. Usado automaticamente ao finalizar uma rota.</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Preço da Gasolina (R$/litro)</Label>
              <Input
                data-tour="settings-fuel"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="Ex: 6,00"
                value={defaultPricePerLiter}
                onChange={(e) => setDefaultPricePerLiter(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-muted-foreground mt-1">Valor sugerido ao finalizar uma rota.</p>
            </div>
          </Section>

          <Section
            id="veiculo"
            open={openSection === "veiculo"}
            onToggle={toggleSection}
            icon={Car}
            label="Veículo"
          >
            <div data-tour="settings-consumption-wrap">
              <Label className="text-xs text-muted-foreground">Consumo Médio (km/l)</Label>
              <Input data-tour="settings-consumption" type="number" step="0.1" value={avgConsumption} onChange={(e) => setAvgConsumption(e.target.value)} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Usado para calcular litros consumidos a partir dos KM rodados.</p>
            </div>
          </Section>

          <Section
            id="financeiro"
            open={openSection === "financeiro"}
            onToggle={toggleSection}
            icon={Wallet}
            label="Financeiro"
          >
            <div data-tour="settings-reserve-wrap">
              <Label className="text-xs text-muted-foreground">Reserva por KM (R$)</Label>
              <Input data-tour="settings-reserve" type="number" step="0.01" value={reservePerKm} onChange={(e) => setReservePerKm(e.target.value)} className="mt-1" />
              <p className="text-[11px] text-muted-foreground mt-1">Valor recomendado por km para manutenção/reserva.</p>
            </div>
            <div data-tour="settings-helper-wrap">
              <Label className="text-xs text-muted-foreground">Custo do Ajudante (R$)</Label>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant={helperCost === "50" ? "default" : "outline"} className="flex-1" onClick={() => setHelperCost("50")}>R$ 50</Button>
                <Button type="button" variant={helperCost === "40" ? "default" : "outline"} className="flex-1" onClick={() => setHelperCost("40")}>R$ 40</Button>
                <Button type="button" variant={helperCost === "0" ? "default" : "outline"} className="flex-1" onClick={() => setHelperCost("0")}>R$ 0</Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Valor fixo do ajudante por rota.</p>
            </div>
            <div data-tour="settings-fixedfee-wrap">
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
          </Section>

          <Section
            id="metas"
            open={openSection === "metas"}
            onToggle={toggleSection}
            icon={Target}
            label="Metas"
          >
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
              <div className="flex items-center gap-1.5">
                <Label className="text-xs text-muted-foreground">Meta Quinzenal (R$)</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Por que está bloqueado?"
                      className="inline-flex items-center justify-center h-4 w-4 rounded text-muted-foreground hover:text-foreground"
                    >
                      <Lock className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-center">
                    <p className="text-xs flex items-start gap-1.5">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      Calculado automaticamente a partir da Meta Mensal
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                type="number"
                step="1"
                placeholder="Calculado automaticamente (Meta Mensal ÷ 2)"
                value={fortnightGoal}
                readOnly
                disabled
                aria-readonly="true"
                className="mt-1 opacity-50 cursor-not-allowed bg-muted/40"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Definido automaticamente como metade da Meta Mensal.
              </p>
            </div>
          </Section>

          <Button onClick={handleSave} className="w-full gap-2">
            <Save className="h-4 w-4" />
            Salvar Configurações
          </Button>

          {onRestartTour && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onRestartTour}
                className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded-md"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Refazer tutorial
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
