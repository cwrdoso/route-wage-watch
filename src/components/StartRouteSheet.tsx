import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Play } from "lucide-react";
import { getSettings, setActiveRoute } from "@/lib/storage";
import { vibrate } from "@/lib/haptics";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onStarted: () => void;
}

export function StartRouteSheet({ open, onOpenChange, onStarted }: Props) {
  const [kmStart, setKmStart] = useState("");
  const [hasHelper, setHasHelper] = useState(true);
  const [helperCost, setHelperCost] = useState("");

  // Re-read settings every time the sheet opens so changes in Configurações reflect here
  useEffect(() => {
    if (open) {
      const s = getSettings();
      setHelperCost(String(s.helperCost ?? 0));
    }
  }, [open]);

  const valid = kmStart && Number(kmStart) > 0;

  const handleStart = () => {
    if (!valid) return;
    setActiveRoute({
      startedAt: new Date().toISOString(),
      kmStart: Number(kmStart),
      helperCost: hasHelper ? Number(helperCost) || 0 : 0,
    });
    vibrate(40);
    toast.success("Rota iniciada!");
    setKmStart("");
    onStarted();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-t-2 border-primary/30 max-h-[85vh]">
        <SheetHeader>
          <SheetTitle className="text-xl">Iniciando rota</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4 pb-6">
          <div>
            <Label className="text-xs text-muted-foreground">KM Inicial</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Odômetro atual do veículo"
              value={kmStart}
              onChange={(e) => setKmStart(e.target.value)}
              className="mt-1 text-lg"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
            <div>
              <p className="text-sm font-medium">Ajudante hoje?</p>
              <p className="text-xs text-muted-foreground">Inclui custo do ajudante na rota</p>
            </div>
            <Switch checked={hasHelper} onCheckedChange={setHasHelper} />
          </div>

          {hasHelper && (
            <div className="animate-fade-in">
              <Label className="text-xs text-muted-foreground">Custo do ajudante (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={helperCost}
                onChange={(e) => setHelperCost(e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={!valid}
            className="w-full h-12 gap-2 text-base font-semibold"
          >
            <Play className="h-4 w-4 fill-current" />
            Iniciar agora
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
