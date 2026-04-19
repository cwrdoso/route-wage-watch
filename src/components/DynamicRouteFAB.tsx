import { Play, Square } from "lucide-react";
import { vibrate } from "@/lib/haptics";

interface Props {
  active: boolean;
  onClick: () => void;
}

export function DynamicRouteFAB({ active, onClick }: Props) {
  const handle = () => {
    vibrate(30);
    onClick();
  };

  return (
    <button
      onClick={handle}
      aria-label={active ? "Finalizar rota" : "Iniciar rota"}
      className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-30 h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
        active
          ? "bg-success shadow-lg shadow-success/40"
          : "bg-primary shadow-lg shadow-primary/40 animate-fab-pulse"
      }`}
    >
      <span key={active ? "stop" : "play"} className="animate-fab-icon-swap">
        {active ? (
          <Square className="h-6 w-6 text-white fill-current" strokeWidth={2} />
        ) : (
          <Play className="h-6 w-6 text-white fill-current ml-0.5" strokeWidth={2} />
        )}
      </span>
    </button>
  );
}
