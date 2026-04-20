CREATE TABLE public.fixed_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'monthly',
  per_route_amount NUMERIC NOT NULL DEFAULT 0,
  accumulated NUMERIC NOT NULL DEFAULT 0,
  cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fixed_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fixed costs" ON public.fixed_costs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own fixed costs" ON public.fixed_costs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fixed costs" ON public.fixed_costs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fixed costs" ON public.fixed_costs FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_fixed_costs_updated_at
BEFORE UPDATE ON public.fixed_costs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_fixed_costs_user_id ON public.fixed_costs(user_id);