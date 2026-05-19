CREATE TYPE public.delivery_status AS ENUM ('pending', 'in_transit', 'ready_for_pickup', 'delivered', 'failed');
CREATE TYPE public.token_status AS ENUM ('active', 'used', 'expired');

CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  recipient_name TEXT NOT NULL,
  recipient_address TEXT,
  notes TEXT,
  status delivery_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.delivery_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  status token_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
  token TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read deliveries" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public insert deliveries" ON public.deliveries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update deliveries" ON public.deliveries FOR UPDATE USING (true);

CREATE POLICY "Public read tokens" ON public.delivery_tokens FOR SELECT USING (true);
CREATE POLICY "Public insert tokens" ON public.delivery_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update tokens" ON public.delivery_tokens FOR UPDATE USING (true);

CREATE POLICY "Public read logs" ON public.access_logs FOR SELECT USING (true);
CREATE POLICY "Public insert logs" ON public.access_logs FOR INSERT WITH CHECK (true);

CREATE INDEX idx_delivery_tokens_token ON public.delivery_tokens(token);
CREATE INDEX idx_delivery_tokens_delivery ON public.delivery_tokens(delivery_id);
CREATE INDEX idx_delivery_tokens_status ON public.delivery_tokens(status);
CREATE INDEX idx_access_logs_delivery ON public.access_logs(delivery_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();