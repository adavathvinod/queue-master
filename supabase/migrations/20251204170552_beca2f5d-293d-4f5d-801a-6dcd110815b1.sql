-- Create profiles table for queue owners
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create queue_instances table
CREATE TABLE public.queue_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  queue_code TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  system_status BOOLEAN NOT NULL DEFAULT false,
  current_serving INTEGER NOT NULL DEFAULT 0,
  next_token INTEGER NOT NULL DEFAULT 1,
  strict_missed_policy BOOLEAN NOT NULL DEFAULT false,
  multi_counter_enabled BOOLEAN NOT NULL DEFAULT false,
  ewt_enabled BOOLEAN NOT NULL DEFAULT false,
  capacity_enabled BOOLEAN NOT NULL DEFAULT false,
  daily_capacity INTEGER DEFAULT 100,
  average_service_time_seconds INTEGER DEFAULT 180,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.queue_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage own queues" ON public.queue_instances
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Public can view queue status" ON public.queue_instances
  FOR SELECT USING (true);

-- Create tokens table
CREATE TABLE public.tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.queue_instances ON DELETE CASCADE,
  token_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'served', 'expired', 'missed')),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tokens" ON public.tokens
  FOR SELECT USING (true);

CREATE POLICY "Public can create tokens" ON public.tokens
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can update tokens" ON public.tokens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.queue_instances 
      WHERE id = queue_id AND owner_id = auth.uid()
    )
  );

-- Create counters table for multi-counter support
CREATE TABLE public.counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  queue_id UUID NOT NULL REFERENCES public.queue_instances ON DELETE CASCADE,
  counter_name TEXT NOT NULL,
  current_token INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage counters" ON public.counters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.queue_instances 
      WHERE id = queue_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view counters" ON public.counters
  FOR SELECT USING (true);

-- Enable realtime for queue_instances and tokens
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tokens;

-- Create index for faster lookups
CREATE INDEX idx_queue_code ON public.queue_instances(queue_code);
CREATE INDEX idx_tokens_queue ON public.tokens(queue_id, token_number);