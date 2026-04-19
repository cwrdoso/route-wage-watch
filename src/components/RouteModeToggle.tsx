import { Zap, FileText } from "lucide-react";
import { vibrate } from "@/lib/haptics";

export type RouteMode = "dynamic" | "manual";

interface Props {
  mode: RouteMode;
  onChange: (m: RouteMode) => void;
}

export function RouteModeToggle({ mode, onChange }: Props) {
  const handle = (m: RouteMode) => {
    if (m === mode) return;
    vibrate(15);
    onChange(m);
  };

  return (
    <div className="mode-toggle w-full">
      <span
        className="pill"
        style={{ transform: mode === "dynamic" ? "translateX(0)" : "translateX(100%)" }}
      />
      <button
        type="button"
        onClick={() => handle("dynamic")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          mode === "dynamic" ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <Zap className="h-3.5 w-3.5" />
        Dinâmica
      </button>
      <button
        type="button"
        onClick={() => handle("manual")}
        className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          mode === "manual" ? "text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        <FileText className="h-3.5 w-3.5" />
        Manual
      </button>
    </div>
  );
}
