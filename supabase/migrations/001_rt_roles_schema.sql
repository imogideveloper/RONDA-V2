-- ============================================================
-- RONDA App — Schema RT, Roles & Keamanan
-- Jalankan di Supabase SQL Editor atau via supabase db push
-- ============================================================

-- ── Enum role ────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('ketua_rt', 'bendahara', 'warga');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Tabel RT ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rt_units (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  rt_number     TEXT NOT NULL,
  rw_number     TEXT,
  address       TEXT,
  invite_code   TEXT NOT NULL UNIQUE,
  ketua_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  member_count  INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_units_invite_code ON public.rt_units(invite_code);
CREATE INDEX IF NOT EXISTS idx_rt_units_ketua_id ON public.rt_units(ketua_id);

-- ── Perluas profiles ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rt_id UUID REFERENCES public.rt_units(id) ON DELETE SET NULL;

-- Pastikan kolom role ada; default warga untuk user baru
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'warga';

-- ── Pengumuman ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_id       UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_rt_id ON public.announcements(rt_id);

-- ── Kas RT (transaksi) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kas_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_id         UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  recorded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('masuk', 'keluar')),
  amount        NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description   TEXT NOT NULL,
  category      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kas_transactions_rt_id ON public.kas_transactions(rt_id);

-- ── Helper: generate kode undangan ────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ── Trigger: auto-create profile saat signup ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Pengguna'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'warga',
    TRUE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RPC: Buat RT Baru (auto jadi Ketua RT) ───────────────────
CREATE OR REPLACE FUNCTION public.create_rt_unit(
  p_name TEXT,
  p_rt_number TEXT,
  p_rw_number TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_code TEXT;
  v_rt_id UUID;
  v_attempts INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_profile.rt_id IS NOT NULL THEN
    RAISE EXCEPTION 'Anda sudah tergabung dalam RT';
  END IF;

  IF v_profile.role NOT IN ('warga') THEN
    RAISE EXCEPTION 'Hanya warga tanpa RT yang bisa membuat RT baru';
  END IF;

  -- Generate kode unik
  LOOP
    v_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rt_units WHERE invite_code = v_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Gagal generate kode undangan';
    END IF;
  END LOOP;

  INSERT INTO public.rt_units (name, rt_number, rw_number, address, invite_code, ketua_id)
  VALUES (p_name, p_rt_number, p_rw_number, p_address, v_code, v_user_id)
  RETURNING id INTO v_rt_id;

  UPDATE public.profiles
  SET role = 'ketua_rt', rt_id = v_rt_id
  WHERE id = v_user_id;

  RETURN json_build_object(
    'rt_id', v_rt_id,
    'invite_code', v_code,
    'role', 'ketua_rt'
  );
END;
$$;

-- ── RPC: Gabung RT via kode undangan ─────────────────────────
CREATE OR REPLACE FUNCTION public.join_rt_by_code(p_invite_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile RECORD;
  v_rt RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_profile.rt_id IS NOT NULL THEN
    RAISE EXCEPTION 'Anda sudah tergabung dalam RT';
  END IF;

  SELECT * INTO v_rt
  FROM public.rt_units
  WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code));

  IF v_rt IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak valid';
  END IF;

  UPDATE public.profiles
  SET role = 'warga', rt_id = v_rt.id
  WHERE id = v_user_id;

  UPDATE public.rt_units
  SET member_count = member_count + 1, updated_at = NOW()
  WHERE id = v_rt.id;

  RETURN json_build_object(
    'rt_id', v_rt.id,
    'rt_name', v_rt.name,
    'role', 'warga'
  );
END;
$$;

-- ── RPC: Ketua RT tunjuk Bendahara ───────────────────────────
CREATE OR REPLACE FUNCTION public.appoint_bendahara(p_warga_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua_id UUID := auth.uid();
  v_ketua RECORD;
  v_warga RECORD;
  v_existing_bendahara UUID;
BEGIN
  IF v_ketua_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_ketua FROM public.profiles WHERE id = v_ketua_id;

  IF v_ketua.role != 'ketua_rt' THEN
    RAISE EXCEPTION 'Hanya Ketua RT yang bisa menunjuk Bendahara';
  END IF;

  IF v_ketua.rt_id IS NULL THEN
    RAISE EXCEPTION 'Ketua RT belum memiliki RT';
  END IF;

  SELECT * INTO v_warga FROM public.profiles WHERE id = p_warga_id;

  IF v_warga IS NULL OR v_warga.rt_id != v_ketua.rt_id THEN
    RAISE EXCEPTION 'Warga tidak ditemukan di RT Anda';
  END IF;

  IF v_warga.role != 'warga' THEN
    RAISE EXCEPTION 'Hanya warga yang bisa ditunjuk jadi Bendahara';
  END IF;

  -- Turunkan bendahara lama ke warga (maks 1 bendahara per RT)
  SELECT id INTO v_existing_bendahara
  FROM public.profiles
  WHERE rt_id = v_ketua.rt_id AND role = 'bendahara' AND id != p_warga_id
  LIMIT 1;

  IF v_existing_bendahara IS NOT NULL THEN
    UPDATE public.profiles SET role = 'warga' WHERE id = v_existing_bendahara;
  END IF;

  UPDATE public.profiles SET role = 'bendahara' WHERE id = p_warga_id;

  RETURN json_build_object('bendahara_id', p_warga_id, 'role', 'bendahara');
END;
$$;

-- ── RPC: Ketua RT cabut Bendahara ────────────────────────────
CREATE OR REPLACE FUNCTION public.revoke_bendahara(p_bendahara_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua_id UUID := auth.uid();
  v_ketua RECORD;
  v_bendahara RECORD;
BEGIN
  IF v_ketua_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_ketua FROM public.profiles WHERE id = v_ketua_id;

  IF v_ketua.role != 'ketua_rt' THEN
    RAISE EXCEPTION 'Hanya Ketua RT yang bisa mencabut Bendahara';
  END IF;

  SELECT * INTO v_bendahara FROM public.profiles WHERE id = p_bendahara_id;

  IF v_bendahara IS NULL OR v_bendahara.rt_id != v_ketua.rt_id OR v_bendahara.role != 'bendahara' THEN
    RAISE EXCEPTION 'Bendahara tidak ditemukan di RT Anda';
  END IF;

  UPDATE public.profiles SET role = 'warga' WHERE id = p_bendahara_id;

  RETURN json_build_object('bendahara_id', p_bendahara_id, 'role', 'warga');
END;
$$;

-- ── View: saldo kas per RT ─────────────────────────────────────
CREATE OR REPLACE VIEW public.rt_kas_summary AS
SELECT
  rt_id,
  COALESCE(SUM(CASE WHEN type = 'masuk' THEN amount ELSE 0 END), 0) AS total_masuk,
  COALESCE(SUM(CASE WHEN type = 'keluar' THEN amount ELSE 0 END), 0) AS total_keluar,
  COALESCE(SUM(CASE WHEN type = 'masuk' THEN amount ELSE -amount END), 0) AS saldo
FROM public.kas_transactions
GROUP BY rt_id;

-- ── RLS ────────────────────────────────────────────────────────
ALTER TABLE public.rt_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_transactions ENABLE ROW LEVEL SECURITY;

-- RT: anggota RT bisa lihat RT mereka
CREATE POLICY "rt_select_members" ON public.rt_units
  FOR SELECT USING (
    id IN (SELECT rt_id FROM public.profiles WHERE id = auth.uid())
    OR ketua_id = auth.uid()
  );

CREATE POLICY "rt_update_ketua" ON public.rt_units
  FOR UPDATE USING (ketua_id = auth.uid());

-- Pengumuman: anggota RT bisa baca, ketua/bendahara bisa tulis
CREATE POLICY "announcements_select" ON public.announcements
  FOR SELECT USING (
    rt_id IN (SELECT rt_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "announcements_insert" ON public.announcements
  FOR INSERT WITH CHECK (
    rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ketua_rt', 'bendahara')
    )
    AND author_id = auth.uid()
  );

CREATE POLICY "announcements_delete_ketua" ON public.announcements
  FOR DELETE USING (
    rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'ketua_rt'
    )
  );

-- Kas: ketua & bendahara kelola, warga baca
CREATE POLICY "kas_select_members" ON public.kas_transactions
  FOR SELECT USING (
    rt_id IN (SELECT rt_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "kas_insert_officers" ON public.kas_transactions
  FOR INSERT WITH CHECK (
    rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ketua_rt', 'bendahara')
    )
    AND recorded_by = auth.uid()
  );

-- Profiles: anggota RT sama bisa lihat profil satu sama lain
CREATE POLICY "profiles_select_same_rt" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR rt_id IN (SELECT p.rt_id FROM public.profiles p WHERE p.id = auth.uid() AND p.rt_id IS NOT NULL)
  );

-- Lindungi kolom role & rt_id dari update langsung client
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.rt_id IS DISTINCT FROM OLD.rt_id THEN
      RAISE EXCEPTION 'Role dan RT hanya bisa diubah melalui fungsi resmi';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON public.profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- Grant execute RPC ke authenticated users
GRANT EXECUTE ON FUNCTION public.create_rt_unit TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_rt_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.appoint_bendahara TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_bendahara TO authenticated;
