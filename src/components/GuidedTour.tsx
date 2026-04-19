import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { vibrate } from "@/lib/haptics";

export type TourTab = "home" | "routes" | "costs" | "settings";

export interface TourStep {
  /** value of [data-tour="..."] attribute on the highlighted element */
  target: string;
  /** Optional tab to switch to BEFORE rendering this step */
  switchTab?: TourTab;
  title: string;
  description: string;
  /** Force tooltip placement; default = auto (below if room, else above) */
  placement?: "top" | "bottom";
  /** Extra padding around the spotlight rect, px */
  padding?: number;
  /** If set, user must fill the input matching this data-tour selector to advance.
   *  A "Pular esta etapa" link is also shown. */
  requireInput?: string;
  /** If set, dispatches tour:open-section to expand the named settings section */
  openSection?: "essencial" | "veiculo" | "financeiro" | "metas";
  /** If set, shows a "Pular esta etapa" link even without requireInput */
  skippable?: boolean;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Props {
  open: boolean;
  steps: TourStep[];
  onTabChange: (tab: TourTab) => void;
  onFinish: () => void;
  onSkip: () => void;
}

const SWITCH_DELAY = 400;
const FADE_MS = 200;

export function GuidedTour({ open, steps, onTabChange, onFinish, onSkip }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [inputValid, setInputValid] = useState(false);
  const lastTabRef = useRef<TourTab | undefined>(undefined);

  const step = steps[stepIndex];

  // When tour opens, reset state
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setCompleted(false);
      setVisible(false);
    }
  }, [open]);

  // Switch tab if needed when entering a step
  useEffect(() => {
    if (!open || completed || !step) return;
    if (step.switchTab && step.switchTab !== lastTabRef.current) {
      lastTabRef.current = step.switchTab;
      onTabChange(step.switchTab);
    } else if (!step.switchTab && lastTabRef.current === undefined) {
      // First step — record current implicit tab as "home"
      lastTabRef.current = "home";
    }
    // If step asks to expand a settings section, dispatch the event
    if (step.openSection) {
      window.dispatchEvent(
        new CustomEvent("tour:open-section", { detail: { section: step.openSection } })
      );
    }
    // Find target after a short delay so tab switch / animation can settle
    setVisible(false);
    const t = window.setTimeout(() => {
      measureTarget();
      setVisible(true);
    }, step.openSection ? 320 : 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, open, completed]);

  // Re-measure on resize / scroll
  useLayoutEffect(() => {
    if (!open || completed) return;
    const handler = () => measureTarget();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, completed, stepIndex]);

  // Watch required input value
  useEffect(() => {
    if (!open || completed || !step?.requireInput) {
      setInputValid(true);
      return;
    }
    setInputValid(false);
    let raf = 0;
    const find = () =>
      document.querySelector<HTMLInputElement>(`[data-tour="${step.requireInput}"]`);

    const check = () => {
      const el = find();
      if (el) {
        const v = Number(el.value);
        setInputValid(!Number.isNaN(v) && v > 0);
      }
    };

    // Wait until input is mounted, then attach listener
    const attach = () => {
      const el = find();
      if (!el) {
        raf = window.requestAnimationFrame(attach);
        return;
      }
      check();
      el.addEventListener("input", check);
      el.addEventListener("change", check);
    };
    attach();

    return () => {
      cancelAnimationFrame(raf);
      const el = find();
      if (el) {
        el.removeEventListener("input", check);
        el.removeEventListener("change", check);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, open, completed]);

  function measureTarget() {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    // Scroll into view smoothly if not visible
    const r = el.getBoundingClientRect();
    const padding = step.padding ?? 8;
    const inView =
      r.top >= 60 && r.bottom <= window.innerHeight - 60;
    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Re-measure after scroll
      window.setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        setRect({
          top: r2.top - padding,
          left: r2.left - padding,
          width: r2.width + padding * 2,
          height: r2.height + padding * 2,
        });
      }, 350);
      return;
    }
    setRect({
      top: r.top - padding,
      left: r.left - padding,
      width: r.width + padding * 2,
      height: r.height + padding * 2,
    });
  }

  function handleNext() {
    vibrate(20);
    const isLast = stepIndex === steps.length - 1;
    // If current step touched settings (input or section open), persist values
    if (step?.requireInput || step?.openSection || step?.switchTab === "settings") {
      window.dispatchEvent(
        new CustomEvent("tour:save-essentials", {
          detail: { field: step?.requireInput },
        })
      );
    }
    setVisible(false);
    const advance = () => {
      if (isLast) {
        setCompleted(true);
      } else {
        setStepIndex((i) => i + 1);
      }
    };
    // If next step requires tab switch, delay so animation feels intentional
    const nextStep = steps[stepIndex + 1];
    if (!isLast && nextStep?.switchTab && nextStep.switchTab !== lastTabRef.current) {
      window.setTimeout(advance, SWITCH_DELAY);
    } else {
      window.setTimeout(advance, FADE_MS);
    }
  }

  function handleSkip() {
    vibrate(15);
    onSkip();
  }

  function handleFinishCompletion() {
    vibrate(25);
    onTabChange("routes");
    onFinish();
  }

  function handleGoHome() {
    onTabChange("home");
    onFinish();
  }

  if (!open) return null;

  // Completion screen
  if (completed) {
    return createPortal(
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-6 animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
          {/* Animated check */}
          <div className="relative">
            <svg width="96" height="96" viewBox="0 0 96 96" className="text-success">
              <circle
                cx="48"
                cy="48"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="276.46"
                strokeDashoffset="276.46"
                style={{ animation: "tour-circle-draw 0.7s ease-out forwards" }}
              />
              <path
                d="M30 50 L43 63 L66 36"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                strokeDashoffset="60"
                style={{ animation: "tour-check-draw 0.4s ease-out 0.6s forwards" }}
              />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Tudo pronto!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O Rotta está configurado para você. Registre sua primeira rota e veja
              seus ganhos em tempo real.
            </p>
          </div>

          <div className="w-full space-y-3 pt-2">
            <Button
              onClick={handleFinishCompletion}
              className="w-full h-12 text-base font-semibold"
            >
              Registrar primeira rota
            </Button>
            <button
              onClick={handleGoHome}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Ir para o início
            </button>
          </div>
        </div>

        <style>{`
          @keyframes tour-circle-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes tour-check-draw {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>,
      document.body
    );
  }

  if (!step) return null;

  // Compute tooltip position
  const TOOLTIP_W = 320;
  const TOOLTIP_MARGIN = 14;
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  let tooltipTop = 0;
  let tooltipLeft = 0;
  let arrowOnTop = false; // arrow points up (tooltip below target)
  let arrowLeft = TOOLTIP_W / 2;

  if (rect) {
    const spaceBelow = screenH - (rect.top + rect.height);
    const spaceAbove = rect.top;
    const wantBelow =
      step.placement === "bottom" ||
      (step.placement !== "top" && spaceBelow >= 200) ||
      spaceAbove < 200;

    if (wantBelow) {
      tooltipTop = rect.top + rect.height + TOOLTIP_MARGIN;
      arrowOnTop = true;
    } else {
      tooltipTop = rect.top - TOOLTIP_MARGIN; // we'll translateY(-100%) via inline
    }

    // Center horizontally on target, clamp to screen
    const targetCenterX = rect.left + rect.width / 2;
    tooltipLeft = Math.max(
      12,
      Math.min(screenW - TOOLTIP_W - 12, targetCenterX - TOOLTIP_W / 2)
    );
    arrowLeft = Math.max(
      18,
      Math.min(TOOLTIP_W - 18, targetCenterX - tooltipLeft)
    );
  } else {
    // Fallback: center
    tooltipTop = screenH / 2 - 80;
    tooltipLeft = (screenW - TOOLTIP_W) / 2;
  }

  return createPortal(
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true">
      {/* Spotlight: 4 dark panels around the target. Click on dark area = no-op */}
      {rect ? (
        <>
          {/* top */}
          <div
            className="absolute bg-black/70 transition-all duration-200"
            style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }}
          />
          {/* bottom */}
          <div
            className="absolute bg-black/70 transition-all duration-200"
            style={{
              top: rect.top + rect.height,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          {/* left */}
          <div
            className="absolute bg-black/70 transition-all duration-200"
            style={{
              top: rect.top,
              left: 0,
              width: Math.max(0, rect.left),
              height: rect.height,
            }}
          />
          {/* right */}
          <div
            className="absolute bg-black/70 transition-all duration-200"
            style={{
              top: rect.top,
              left: rect.left + rect.width,
              right: 0,
              height: rect.height,
            }}
          />
          {/* Highlighted ring around the target */}
          <div
            className="absolute pointer-events-none rounded-xl transition-all duration-200"
            style={{
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height,
              boxShadow:
                "0 0 0 2px hsl(var(--primary)), 0 0 24px 4px hsl(var(--primary) / 0.45)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Skip button (top-right) */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 text-xs text-white/60 hover:text-white transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm"
      >
        <X className="h-3 w-3" />
        Pular tour
      </button>

      {/* Tooltip */}
      <div
        className="absolute"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_W,
          transform: arrowOnTop ? "none" : "translateY(-100%)",
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease-out, top 200ms ease-out, left 200ms ease-out`,
        }}
      >
        {/* Arrow */}
        <div
          className="absolute w-3 h-3 bg-card border border-border/60 rotate-45"
          style={{
            left: arrowLeft - 6,
            top: arrowOnTop ? -6 : "auto",
            bottom: arrowOnTop ? "auto" : -6,
            borderTop: arrowOnTop ? undefined : "none",
            borderLeft: arrowOnTop ? undefined : "none",
            borderRight: arrowOnTop ? "none" : undefined,
            borderBottom: arrowOnTop ? "none" : undefined,
          }}
        />
        <div className="relative bg-card border border-border/60 rounded-2xl shadow-2xl shadow-primary/20 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
              {stepIndex + 1} de {steps.length}
            </span>
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 rounded-full transition-all ${
                    i === stepIndex
                      ? "w-4 bg-primary"
                      : i < stepIndex
                      ? "w-1 bg-primary/60"
                      : "w-1 bg-border"
                  }`}
                />
              ))}
            </div>
          </div>
          <h3 className="text-base font-bold leading-tight">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
          <Button
            onClick={handleNext}
            disabled={!!step.requireInput && !inputValid}
            className="w-full h-10 mt-1 font-semibold"
            size="sm"
          >
            {stepIndex === steps.length - 1 ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Concluir
              </>
            ) : step.requireInput ? (
              <>Salvar e continuar →</>
            ) : (
              <>Entendi →</>
            )}
          </Button>
          {(step.requireInput || step.skippable) && stepIndex !== steps.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="w-full text-[12px] text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Pular esta etapa
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
