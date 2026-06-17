
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('owner', 'staff');
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE public.floor_state AS ENUM ('with_client', 'available', 'offline');
CREATE TYPE public.waitlist_status AS ENUM ('active', 'fulfilled', 'cancelled');

-- PROFILES (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- SALONS
CREATE TABLE public.salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  business_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  commission_split NUMERIC NOT NULL DEFAULT 60, -- % to tech
  tip_split_default NUMERIC NOT NULL DEFAULT 100, -- % of tip to tech
  holiday_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salons TO authenticated;
GRANT ALL ON public.salons TO service_role;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read salons" ON public.salons FOR SELECT TO anon, authenticated USING (true);

-- STAFF
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'staff',
  pin TEXT,
  working_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  avatar_color TEXT DEFAULT '#0a0a0a',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_staff_salon ON public.staff(salon_id);
CREATE INDEX idx_staff_auth ON public.staff(auth_user_id);
GRANT SELECT ON public.staff TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active staff" ON public.staff FOR SELECT TO anon, authenticated USING (is_active = true);

-- SECURITY DEFINER: current user's salon ids
CREATE OR REPLACE FUNCTION public.current_user_salon_ids()
RETURNS SETOF UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT salon_id FROM public.staff WHERE auth_user_id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_salon_member(_salon_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff WHERE auth_user_id = auth.uid() AND salon_id = _salon_id AND is_active = true);
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _salon_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff WHERE auth_user_id = _user_id AND salon_id = _salon_id AND role = _role AND is_active = true);
$$;

-- Now add staff management policies (after helper exists)
CREATE POLICY "Members manage staff in salon" ON public.staff FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

CREATE POLICY "Owners update salons" ON public.salons FOR UPDATE TO authenticated
  USING (public.is_salon_member(id));

-- SERVICES
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  price NUMERIC NOT NULL DEFAULT 0,
  deposit_amount NUMERIC NOT NULL DEFAULT 0,
  buffer_after_minutes INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_services_salon ON public.services(salon_id);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active services" ON public.services FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "Members manage services" ON public.services FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (salon_id, phone)
);
CREATE INDEX idx_clients_salon ON public.clients(salon_id);
CREATE INDEX idx_clients_phone ON public.clients(salon_id, phone);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage clients" ON public.clients FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- BOOKINGS
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  deposit_paid NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bookings_salon_time ON public.bookings(salon_id, start_time);
CREATE INDEX idx_bookings_staff_time ON public.bookings(staff_id, start_time);
GRANT SELECT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- Public can read minimal booking info (for slot calculation). RLS restricts columns via app code; the staff_id/start/end need to be readable to compute availability.
CREATE POLICY "Public read bookings for availability" ON public.bookings FOR SELECT TO anon, authenticated
  USING (status IN ('confirmed','completed'));
CREATE POLICY "Members manage bookings" ON public.bookings FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- COMMISSION RECORDS
CREATE TABLE public.commission_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  gross_amount NUMERIC NOT NULL,
  net_amount NUMERIC NOT NULL,
  tech_share NUMERIC NOT NULL,
  salon_share NUMERIC NOT NULL,
  tip_amount NUMERIC NOT NULL DEFAULT 0,
  tip_to_tech NUMERIC NOT NULL DEFAULT 0,
  tip_to_salon NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cr_salon ON public.commission_records(salon_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_records TO authenticated;
GRANT ALL ON public.commission_records TO service_role;
ALTER TABLE public.commission_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage commissions" ON public.commission_records FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- WAITLIST
CREATE TABLE public.waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  preferred_time_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  status public.waitlist_status NOT NULL DEFAULT 'active',
  flagged_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_waitlist_salon ON public.waitlist_entries(salon_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.waitlist_entries TO authenticated;
GRANT ALL ON public.waitlist_entries TO service_role;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage waitlist" ON public.waitlist_entries FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- FLOOR STATUS
CREATE TABLE public.floor_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE UNIQUE,
  status public.floor_state NOT NULL DEFAULT 'offline',
  current_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_floor_salon ON public.floor_status(salon_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.floor_status TO authenticated;
GRANT ALL ON public.floor_status TO service_role;
ALTER TABLE public.floor_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage floor" ON public.floor_status FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- AI CALLS (receptionist transcripts)
CREATE TABLE public.ai_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  caller_phone TEXT,
  caller_name TEXT,
  transcript TEXT,
  intent TEXT,
  intent_data JSONB DEFAULT '{}'::jsonb,
  converted_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  call_duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_calls_salon ON public.ai_calls(salon_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_calls TO authenticated;
GRANT ALL ON public.ai_calls TO service_role;
ALTER TABLE public.ai_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage ai_calls" ON public.ai_calls FOR ALL TO authenticated
  USING (public.is_salon_member(salon_id)) WITH CHECK (public.is_salon_member(salon_id));

-- Trigger: when booking is cancelled, flag matching waitlist entries
CREATE OR REPLACE FUNCTION public.flag_waitlist_on_cancel()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE public.waitlist_entries
    SET flagged_booking_id = NEW.id
    WHERE salon_id = NEW.salon_id
      AND status = 'active'
      AND (preferred_staff_id IS NULL OR preferred_staff_id = NEW.staff_id);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_flag_waitlist_on_cancel
  AFTER UPDATE OF status ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.flag_waitlist_on_cancel();

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime for floor_status and bookings
ALTER PUBLICATION supabase_realtime ADD TABLE public.floor_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
