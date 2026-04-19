import { useState, useEffect } from "react";
import {
  getRoutes,
  getSettings,
  saveSettings,
  ensureAutoDayOffs,
  type RouteEntry,
} from "@/lib/storage";
import { RouteForm } from "@/components/RouteForm";
import { SummaryCards } from "@/components/SummaryCards";
import { RevenueChart } from "@/components/RevenueChart";
import { RouteHistory } from "@/components/RouteHistory";
import { OperationalCosts } from "@/components/OperationalCosts";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ExtraExpenseForm, getExtraExpenses, type AdditionalExpense } from "@/components/ExtraExpenseForm";
import { QuinzenaSummary } from "@/components/QuinzenaSummary";
import { ExtraExpenseList } from "@/components/ExtraExpenseList";
import { GoalProgress } from "@/components/GoalProgress";
import { RouteFeedback } from "@/components/RouteFeedback";
import { RouteModeToggle, type RouteMode } from "@/components/RouteModeToggle";
// FAB removido — botão inline dentro da aba Rotas
import { ActiveRouteBanner } from "@/components/ActiveRouteBanner";
import { StartRouteSheet } from "@/components/StartRouteSheet";
import { FinishRouteSheet } from "@/components/FinishRouteSheet";
import { GuidedTour, type TourStep } from "@/components/GuidedTour";
import { EmptyDashboard } from "@/components/EmptyDashboard";
import { Home, Route, DollarSign, Settings, LogOut, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { vibrate } from "@/lib/haptics";
import logoRotta from "@/assets/logo-rotta.png";

const TOUR_FLAG_KEY = "racta_tour_completed";

const TOUR_STEPS: TourStep[] = [
  {
    target: "summary-cards",
    title: "Seus números em tempo real",
    description:
      "Aqui você vê faturamento, lucro, horas trabalhadas e muito mais. Tudo atualiza automaticamente após cada rota.",
  },
  {
    target: "goal-progress",
    title: "Defina sua meta do mês",
    description:
      "Acompanhe seu lucro real e o quanto falta para bater sua meta. Vá em Configurações e cadastre uma Meta Mensal para liberar o gráfico de progresso.",
  },
  {
    target: "tab-routes",
    switchTab: "routes",
    title: "Registre suas rotas aqui",
    description:
      "Toque em Iniciar Rota para cronometrar automaticamente, ou use o modo Manual para registrar uma rota já feita.",
    placement: "top",
  },
  {
    target: "start-route-btn",
    switchTab: "routes",
    title: "Modo Dinâmico",
    description:
      "O app cronometra sua rota em tempo real. Ao finalizar, informe km rodados e gasolina — o lucro é calculado na hora.",
  },
  {
    target: "tab-costs",
    switchTab: "costs",
    title: "Entenda seu dinheiro de verdade",
    description:
      "Veja exatamente para onde foi cada real: combustível, ajudante, taxa fixa e o que ficou no seu bolso.",
    placement: "top",
  },
  {
    target: "cost-breakdown",
    switchTab: "costs",
    title: "Custos detalhados por categoria",
    description:
      "Cada custo mostra o percentual do seu faturamento. Ideal para saber onde você pode economizar.",
  },
  {
    target: "tab-settings",
    switchTab: "settings",
    title: "Mantenha seus dados atualizados",
    description:
      "Se o preço da gasolina mudar ou você contratar um ajudante, atualize aqui. Isso garante que seu lucro real seja sempre preciso.",
    placement: "top",
  },
];

type Tab = "home" | "routes" | "costs" | "settings";

const TAB_ORDER: Tab[] = ["home", "routes", "costs", "settings"];

const Index = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<RouteEntry[]>(getRoutes);
  const [extraExpenses, setExtraExpenses] = useState<AdditionalExpense[]>(getExtraExpenses);
  const [tab, setTab] = useState<Tab>("home");
  const [prevTabIndex, setPrevTabIndex] = useState(0);
  const [bouncingTab, setBouncingTab] = useState<Tab | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [lastSavedRoute, setLastSavedRoute] = useState<RouteEntry | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>(() => getSettings().routeMode ?? "dynamic");
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [finishSheetOpen, setFinishSheetOpen] = useState(false);
  const [activeRefreshKey, setActiveRefreshKey] = useState(0);
  const [settingsInitialOpen, setSettingsInitialOpen] = useState<"essencial" | undefined>(undefined);
  const [settingsKey, setSettingsKey] = useState(0);

  const [tourOpen, setTourOpen] = useState(false);

  // Auto-folga + perfil — once on mount
  useEffect(() => {
    ensureAutoDayOffs();
    setRoutes(getRoutes());
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
        if (data?.display_name) setDisplayName(data.display_name);
      }
    };
    fetchProfile();

    // Trigger guided tour on first ever load
    if (!localStorage.getItem(TOUR_FLAG_KEY)) {
      // Small delay so the home renders cleanly first
      const t = window.setTimeout(() => setTourOpen(true), 600);
      return () => window.clearTimeout(t);
    }
  }, []);

  const refresh = () => {
    setRoutes(getRoutes());
    setExtraExpenses(getExtraExpenses());
  };

  const handleRouteSaved = (entry: RouteEntry) => {
    refresh();
    setLastSavedRoute(entry);
    setActiveRefreshKey((k) => k + 1);
  };

  const handleModeChange = (m: RouteMode) => {
    setRouteMode(m);
    const s = getSettings();
    saveSettings({ ...s, routeMode: m });
  };

  const handleFabClick = () => {
    // If active route exists -> finish; else start
    setActiveRefreshKey((k) => k + 1);
    const hasActive = !!localStorage.getItem("driver_active_route");
    if (hasActive) setFinishSheetOpen(true);
    else setStartSheetOpen(true);
  };

  const handleTabChange = (next: Tab) => {
    setPrevTabIndex(TAB_ORDER.indexOf(tab));
    setTab(next);
    setBouncingTab(next);
    vibrate(20);
    setLastSavedRoute(null);
    setTimeout(() => setBouncingTab(null), 220);
  };

  const currentIndex = TAB_ORDER.indexOf(tab);
  const direction = currentIndex >= prevTabIndex ? "right" : "left";
  const tabAnimation = direction === "right" ? "animate-slide-in-right" : "animate-slide-in-left";

  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: "home", icon: Home, label: "Início" },
    { key: "routes", icon: Route, label: "Rotas" },
    { key: "costs", icon: DollarSign, label: "Extrato" },
    { key: "settings", icon: Settings, label: "Config" },
  ];

  const hasActiveRoute = !!localStorage.getItem("driver_active_route");
  const hasAnyRoute = routes.some((r) => (r.type ?? "route") === "route");

  const goToStartRoute = () => {
    handleTabChange("routes");
    // open the start sheet only when not in a manual flow + no active route
    setTimeout(() => {
      const active = !!localStorage.getItem("driver_active_route");
      if (!active && routeMode === "dynamic") setStartSheetOpen(true);
    }, 250);
  };

  return (
    <div className="min-h-screen pb-20">
      <ActiveRouteBanner
        refreshKey={activeRefreshKey}
        onFinish={() => setFinishSheetOpen(true)}
      />

      <header className="border-b border-border/50 px-4 py-3 sm:py-6">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logoRotta} alt="Rotta" className="h-14 sm:h-24 md:h-32 w-auto" />
          </div>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {displayName && (
              <span className="text-sm sm:text-lg font-semibold bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent truncate">
                Olá, {displayName.split(" ")[0]}
              </span>
            )}
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 shrink-0"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </header>

      <main key={tab} className={`max-w-lg mx-auto px-4 mt-6 space-y-6 md:space-y-8 ${tabAnimation}`}>
        {tab === "home" && (
          <>
            {hasAnyRoute ? (
              <>
                <SummaryCards routes={routes} />
                <GoalProgress routes={routes} />
                <QuinzenaSummary routes={routes} />
              </>
            ) : (
              <EmptyDashboard onStart={goToStartRoute} />
            )}
          </>
        )}
        {tab === "routes" && (
          <>
            <RouteModeToggle mode={routeMode} onChange={handleModeChange} />

            <div key={routeMode} className="animate-fade-in-soft">
              {routeMode === "manual" ? (
                <RouteForm onSave={handleRouteSaved} />
              ) : (
                <div className="rounded-xl border border-border/50 bg-card/60 p-5 sm:p-6 text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {hasActiveRoute
                      ? "Sua rota está em andamento. Toque abaixo para finalizar quando voltar."
                      : "Toque abaixo para iniciar sua rota e cronometrar automaticamente."}
                  </p>
                  <Button
                    data-tour="start-route-btn"
                    onClick={handleFabClick}
                    className={`w-full h-12 gap-2 text-base font-semibold ${
                      hasActiveRoute
                        ? "bg-success hover:bg-success/90 text-white"
                        : ""
                    }`}
                  >
                    {hasActiveRoute ? (
                      <>
                        <Square className="h-4 w-4 fill-current" />
                        Finalizar rota
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" />
                        Iniciar rota
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {lastSavedRoute && (
              <RouteFeedback
                route={lastSavedRoute}
                allRoutes={routes}
                onClose={() => setLastSavedRoute(null)}
              />
            )}
            <RouteHistory routes={routes} onDelete={refresh} />
          </>
        )}
        {tab === "costs" && (
          <>
            <OperationalCosts routes={routes} extraExpenses={extraExpenses} />
            <ExtraExpenseForm onSave={refresh} />
            <ExtraExpenseList expenses={extraExpenses} onDelete={refresh} />
          </>
        )}
        {tab === "settings" && (
          <SettingsPanel key={settingsKey} initialOpen={settingsInitialOpen} />
        )}
      </main>

      <StartRouteSheet
        open={startSheetOpen}
        onOpenChange={setStartSheetOpen}
        onStarted={() => setActiveRefreshKey((k) => k + 1)}
      />
      <FinishRouteSheet
        open={finishSheetOpen}
        onOpenChange={setFinishSheetOpen}
        onFinished={(entry) => handleRouteSaved(entry)}
        onOpenSettings={() => {
          setSettingsInitialOpen("essencial");
          setSettingsKey((k) => k + 1);
          handleTabChange("settings");
        }}
      />

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-end gap-1 bg-card/90 backdrop-blur-xl border border-border/30 rounded-3xl px-2 py-2 shadow-2xl shadow-primary/10">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                data-tour={`tab-${t.key}`}
                onClick={() => handleTabChange(t.key)}
                aria-label={t.label}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center min-w-[60px] px-2 py-1.5 rounded-2xl transition-all duration-300 ${
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40"
                    : "text-muted-foreground hover:text-foreground"
                } ${bouncingTab === t.key ? "animate-bounce-tap" : ""}`}
              >
                <t.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.75} />
                <span
                  className={`text-[10px] mt-0.5 leading-none whitespace-nowrap ${
                    active ? "font-semibold" : "font-medium"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <GuidedTour
        open={tourOpen}
        steps={TOUR_STEPS}
        onTabChange={(t) => setTab(t as Tab)}
        onFinish={() => {
          localStorage.setItem(TOUR_FLAG_KEY, "true");
          setTourOpen(false);
        }}
        onSkip={() => {
          localStorage.setItem(TOUR_FLAG_KEY, "true");
          setTourOpen(false);
        }}
      />
    </div>
  );
};

export default Index;
