import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Route } from "lucide-react";
import { getActiveRoute } from "@/lib/storage";

interface Props {
  onFinish: () => void;
  /** Bumped externally to force re-read of active route (after start/finish) */
  refreshKey?: number;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function fmtElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${pad(m)}m`;
  return `${pad(m)}:${pad(s)}`;
}

export function ActiveRouteBanner({ onFinish, refreshKey }: Props) {
  const [active, setActive] = useState(() => getActiveRoute());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setActive(getActiveRoute());
  }, [refreshKey]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  if (!active) return null;

  const elapsed = now - new Date(active.startedAt).getTime();

  return (
    <div className="sticky top-0 z-30 animate-slide-down-banner">
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-primary/40"
        style={{ background: "hsl(270 60% 12%)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-success animate-status-dot" />
            <span className="relative rounded-full bg-success h-2.5 w-2.5" />
          </span>
          <Route className="h-4 w-4 text-primary-foreground/80 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-primary-foreground/70 leading-none">Rota em andamento</p>
            <p className="text-sm font-semibold text-primary-foreground tabular-nums">
              {fmtElapsed(elapsed)}
            </p>
          </div>
        </div>
        <Button
          onClick={onFinish}
          size="sm"
          className="bg-success hover:bg-success/90 text-white h-8 px-3 text-xs font-semibold"
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
}
