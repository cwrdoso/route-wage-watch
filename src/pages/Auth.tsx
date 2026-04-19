import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import logoRotta from "@/assets/logo-rotta.png";

type Mode = "login" | "signup" | "forgot";

const REMEMBER_KEY = "rotta_remember_email";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY));
  const [loading, setLoading] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && !exiting) {
        setExiting(true);
        setTimeout(() => navigate("/", { replace: true }), 700);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
    return () => subscription.unsubscribe();
  }, [navigate, exiting]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Email de recuperação enviado!");
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (remember) localStorage.setItem(REMEMBER_KEY, email);
        else localStorage.removeItem(REMEMBER_KEY);
        // Animation will be triggered by onAuthStateChange
      }
    } catch (err: any) {
      triggerShake();
      toast.error(err.message || "Erro ao processar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden transition-all duration-700 ${exiting ? "scale-105 opacity-0 blur-sm" : ""}`}>
      {/* Animated gradient background */}
      <div className="auth-bg-gradient absolute inset-0 -z-10" aria-hidden="true" />
      {/* Floating orbs */}
      <div className="auth-orb auth-orb-1 -z-10" aria-hidden="true" />
      <div className="auth-orb auth-orb-2 -z-10" aria-hidden="true" />
      <div className="auth-orb auth-orb-3 -z-10" aria-hidden="true" />
      {/* Subtle grid overlay */}
      <div className="auth-grid absolute inset-0 -z-10 opacity-[0.07]" aria-hidden="true" />
      {/* Vignette */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_85%)]" aria-hidden="true" />

      <div className={`w-full max-w-sm space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 transition-all duration-700 ${exiting ? "translate-y-[-30px]" : ""} ${shake ? "animate-shake" : ""}`}>
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-2">
          <img
            src={logoRotta}
            alt="Rotta"
            className="h-48 w-auto drop-shadow-[0_0_50px_hsl(270,60%,55%,0.4)] animate-float-soft"
          />
          <p className="text-sm text-muted-foreground animate-[fade-in_0.8s_ease-out_0.3s_both] tracking-wide">
            {mode === "login" && "Entre na sua conta"}
            {mode === "signup" && "Crie sua conta"}
            {mode === "forgot" && "Recupere sua senha"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass-card p-6 space-y-4 shadow-2xl shadow-primary/10">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs text-muted-foreground">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                  required
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-secondary/50 border-border/50 focus:border-primary/50 transition-all duration-300"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(v === true)}
                  />
                  <span className="text-xs text-muted-foreground">Lembrar de mim</span>
                </label>
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-semibold"
          >
            {loading ? (
              <span className="animate-spin h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : mode === "login" ? "Entrar" : mode === "signup" ? "Criar conta" : "Enviar email"}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>
              Não tem conta?{" "}
              <button onClick={() => setMode("signup")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button onClick={() => setMode("login")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
