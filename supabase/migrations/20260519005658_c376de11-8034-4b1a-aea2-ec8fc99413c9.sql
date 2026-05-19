
-- 1. Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone"
  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. User roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 3. Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Add user_id to deliveries
ALTER TABLE public.deliveries ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX idx_deliveries_user_id ON public.deliveries(user_id);

-- 5. Replace public RLS with user-scoped policies on deliveries
DROP POLICY IF EXISTS "Public insert deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Public read deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Public update deliveries" ON public.deliveries;

CREATE POLICY "Users view own deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own deliveries"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 6. delivery_tokens policies — scoped via parent delivery
DROP POLICY IF EXISTS "Public insert tokens" ON public.delivery_tokens;
DROP POLICY IF EXISTS "Public read tokens" ON public.delivery_tokens;
DROP POLICY IF EXISTS "Public update tokens" ON public.delivery_tokens;

CREATE POLICY "Users view tokens for own deliveries"
  ON public.delivery_tokens FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.id = delivery_tokens.delivery_id
      AND (d.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));
CREATE POLICY "Users insert tokens for own deliveries"
  ON public.delivery_tokens FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.id = delivery_tokens.delivery_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "Users update tokens for own deliveries"
  ON public.delivery_tokens FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.deliveries d
    WHERE d.id = delivery_tokens.delivery_id
      AND (d.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

-- 7. access_logs — user reads own; ESP32 writes via edge function (service role bypasses RLS)
DROP POLICY IF EXISTS "Public insert logs" ON public.access_logs;
DROP POLICY IF EXISTS "Public read logs" ON public.access_logs;

CREATE POLICY "Users view logs for own deliveries"
  ON public.access_logs FOR SELECT
  USING (
    delivery_id IS NULL AND public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.deliveries d
      WHERE d.id = access_logs.delivery_id
        AND (d.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- 8. Realtime
ALTER TABLE public.deliveries REPLICA IDENTITY FULL;
ALTER TABLE public.delivery_tokens REPLICA IDENTITY FULL;
ALTER TABLE public.access_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;
