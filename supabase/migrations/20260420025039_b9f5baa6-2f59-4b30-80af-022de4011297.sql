
-- ROUTES TABLE
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'route',
  date DATE NOT NULL,
  km_start NUMERIC NOT NULL DEFAULT 0,
  km_end NUMERIC NOT NULL DEFAULT 0,
  km_driven NUMERIC NOT NULL DEFAULT 0,
  daily_value NUMERIC NOT NULL DEFAULT 0,
  price_per_liter NUMERIC NOT NULL DEFAULT 0,
  avg_consumption NUMERIC NOT NULL DEFAULT 0,
  liters_used NUMERIC NOT NULL DEFAULT 0,
  fuel_cost NUMERIC NOT NULL DEFAULT 0,
  helper_cost NUMERIC NOT NULL DEFAULT 0,
  fixed_fee NUMERIC NOT NULL DEFAULT 0,
  reserve_per_km NUMERIC NOT NULL DEFAULT 0,
  recommended_reserve NUMERIC NOT NULL DEFAULT 0,
  net_profit NUMERIC NOT NULL DEFAULT 0,
  time_start TEXT DEFAULT '',
  time_end TEXT DEFAULT '',
  hours_worked NUMERIC NOT NULL DEFAULT 0,
  earnings_per_hour NUMERIC NOT NULL DEFAULT 0,
  auto_generated BOOLEAN DEFAULT false,
  platform TEXT DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own routes" ON public.routes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own routes" ON public.routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routes" ON public.routes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routes" ON public.routes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_routes_user_date ON public.routes(user_id, date DESC);

CREATE TRIGGER update_routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SETTINGS TABLE
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  avg_consumption NUMERIC NOT NULL DEFAULT 0,
  reserve_per_km NUMERIC NOT NULL DEFAULT 0,
  helper_cost NUMERIC NOT NULL DEFAULT 0,
  default_daily_value NUMERIC NOT NULL DEFAULT 0,
  default_price_per_liter NUMERIC NOT NULL DEFAULT 0,
  fixed_fee NUMERIC NOT NULL DEFAULT 0,
  monthly_goal NUMERIC NOT NULL DEFAULT 0,
  fortnight_goal NUMERIC NOT NULL DEFAULT 0,
  hourly_goal NUMERIC NOT NULL DEFAULT 0,
  route_mode TEXT NOT NULL DEFAULT 'dynamic',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings" ON public.settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own settings" ON public.settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EXTRA EXPENSES TABLE
CREATE TABLE public.extra_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Outros',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses" ON public.extra_expenses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own expenses" ON public.extra_expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own expenses" ON public.extra_expenses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own expenses" ON public.extra_expenses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_expenses_user_date ON public.extra_expenses(user_id, date DESC);

CREATE TRIGGER update_extra_expenses_updated_at
  BEFORE UPDATE ON public.extra_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ACTIVE ROUTE TABLE (rota em andamento)
CREATE TABLE public.active_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  km_start NUMERIC NOT NULL,
  helper_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.active_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own active route" ON public.active_routes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own active route" ON public.active_routes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own active route" ON public.active_routes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own active route" ON public.active_routes
  FOR DELETE USING (auth.uid() = user_id);
