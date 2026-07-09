-- ============================================================
-- Import data warga + auto-mapping saat login (tanpa kode)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Normalisasi nomor (sama seperti app: +62...)
CREATE OR REPLACE FUNCTION public.normalize_phone_id(p_raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  p TEXT;
BEGIN
  p := regexp_replace(COALESCE(p_raw, ''), '\D', '', 'g');
  IF p LIKE '62%' THEN p := substring(p FROM 3); END IF;
  IF p LIKE '0%' THEN p := substring(p FROM 2); END IF;
  IF p = '' THEN RETURN ''; END IF;
  RETURN '+62' || p;
END;
$$;

-- Daftar warga yang di-import Ketua (belum punya akun / belum login)
CREATE TABLE IF NOT EXISTS public.rt_warga_registry (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_id         UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  blok_rumah    TEXT,
  claimed_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  claimed_at    TIMESTAMPTZ,
  imported_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rt_id, phone)
);

CREATE INDEX IF NOT EXISTS idx_registry_rt ON public.rt_warga_registry(rt_id);
CREATE INDEX IF NOT EXISTS idx_registry_phone ON public.rt_warga_registry(phone);

ALTER TABLE public.rt_warga_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "registry_select_rt" ON public.rt_warga_registry;
CREATE POLICY "registry_select_rt" ON public.rt_warga_registry
  FOR SELECT USING (
    rt_id IN (SELECT rt_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "registry_manage_ketua" ON public.rt_warga_registry;
CREATE POLICY "registry_manage_ketua" ON public.rt_warga_registry
  FOR ALL USING (
    rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'ketua_rt'
    )
  );

-- ── Auto gabung RT jika nomor HP ada di registry ────────────────
CREATE OR REPLACE FUNCTION public.try_auto_join_rt()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_profile public.profiles%ROWTYPE;
  v_reg public.rt_warga_registry%ROWTYPE;
  v_phone TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_profile.rt_id IS NOT NULL THEN
    RETURN json_build_object('joined', false, 'reason', 'already_in_rt');
  END IF;

  v_phone := public.normalize_phone_id(COALESCE(v_profile.phone, ''));
  IF v_phone = '' OR v_phone = '+62' THEN
    RETURN json_build_object('joined', false, 'reason', 'no_phone');
  END IF;

  SELECT * INTO v_reg
  FROM public.rt_warga_registry
  WHERE phone = v_phone AND claimed_at IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_reg IS NULL THEN
    RETURN json_build_object('joined', false, 'reason', 'not_in_registry');
  END IF;

  UPDATE public.profiles
  SET
    rt_id = v_reg.rt_id,
    role = 'warga',
    full_name = CASE
      WHEN v_profile.full_name IN ('', 'Pengguna', 'Warga RT') THEN v_reg.full_name
      ELSE v_profile.full_name
    END,
    phone = v_phone
  WHERE id = v_user_id;

  UPDATE public.rt_warga_registry
  SET claimed_by = v_user_id, claimed_at = NOW()
  WHERE id = v_reg.id;

  UPDATE public.rt_units
  SET member_count = member_count + 1, updated_at = NOW()
  WHERE id = v_reg.rt_id;

  RETURN json_build_object(
    'joined', true,
    'rt_id', v_reg.rt_id,
    'role', 'warga'
  );
END;
$$;

-- ── Import batch (JSON array) ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.import_warga_batch(p_rows JSONB)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua public.profiles%ROWTYPE;
  v_row JSONB;
  v_phone TEXT;
  v_name TEXT;
  v_ins INT := 0;
  v_upd INT := 0;
  v_skip INT := 0;
  v_exists BOOLEAN;
BEGIN
  SELECT * INTO v_ketua FROM public.profiles WHERE id = auth.uid();
  IF v_ketua.role != 'ketua_rt' OR v_ketua.rt_id IS NULL THEN
    RAISE EXCEPTION 'Hanya Ketua RT yang bisa import data warga';
  END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    v_name := trim(COALESCE(v_row->>'full_name', ''));
    v_phone := public.normalize_phone_id(COALESCE(v_row->>'phone', ''));
    IF v_name = '' OR v_phone IN ('', '+62') THEN
      v_skip := v_skip + 1;
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.profiles
      WHERE rt_id = v_ketua.rt_id AND public.normalize_phone_id(phone) = v_phone
    ) THEN
      v_skip := v_skip + 1;
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM public.rt_warga_registry
      WHERE rt_id = v_ketua.rt_id AND phone = v_phone
    ) INTO v_exists;

    INSERT INTO public.rt_warga_registry (rt_id, full_name, phone, email, blok_rumah, imported_by)
    VALUES (
      v_ketua.rt_id, v_name, v_phone,
      nullif(trim(COALESCE(v_row->>'email', '')), ''),
      nullif(trim(COALESCE(v_row->>'blok_rumah', '')), ''),
      v_ketua.id
    )
    ON CONFLICT (rt_id, phone) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      blok_rumah = EXCLUDED.blok_rumah,
      imported_by = EXCLUDED.imported_by;

    IF v_exists THEN v_upd := v_upd + 1; ELSE v_ins := v_ins + 1; END IF;
  END LOOP;

  RETURN json_build_object('inserted', v_ins, 'updated', v_upd, 'skipped', v_skip);
END;
$$;

-- Update entri registry / profil warga oleh Ketua
CREATE OR REPLACE FUNCTION public.ketua_update_registry_entry(
  p_id UUID,
  p_full_name TEXT,
  p_phone TEXT,
  p_email TEXT DEFAULT NULL,
  p_blok_rumah TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua public.profiles%ROWTYPE;
  v_phone TEXT;
BEGIN
  SELECT * INTO v_ketua FROM public.profiles WHERE id = auth.uid();
  IF v_ketua.role != 'ketua_rt' THEN RAISE EXCEPTION 'Hanya Ketua RT'; END IF;

  v_phone := public.normalize_phone_id(p_phone);
  IF v_phone IN ('', '+62') THEN RAISE EXCEPTION 'Nomor HP tidak valid'; END IF;

  UPDATE public.rt_warga_registry
  SET full_name = trim(p_full_name), phone = v_phone,
      email = nullif(trim(p_email), ''), blok_rumah = nullif(trim(p_blok_rumah), '')
  WHERE id = p_id AND rt_id = v_ketua.rt_id AND claimed_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.ketua_update_member_name(p_member_id UUID, p_full_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_ketua FROM public.profiles WHERE id = auth.uid();
  IF v_ketua.role != 'ketua_rt' THEN RAISE EXCEPTION 'Hanya Ketua RT'; END IF;

  UPDATE public.profiles
  SET full_name = trim(p_full_name)
  WHERE id = p_member_id AND rt_id = v_ketua.rt_id AND id != v_ketua.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.ketua_delete_registry_entry(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_ketua FROM public.profiles WHERE id = auth.uid();
  IF v_ketua.role != 'ketua_rt' THEN RAISE EXCEPTION 'Hanya Ketua RT'; END IF;

  DELETE FROM public.rt_warga_registry
  WHERE id = p_id AND rt_id = v_ketua.rt_id AND claimed_at IS NULL;
END;
$$;

-- Perkuat ensure_my_profile: coba auto-join
CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user RECORD;
  v_profile RECORD;
  v_join JSON;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF NOT FOUND THEN
    SELECT * INTO v_user FROM auth.users WHERE id = v_user_id;
    INSERT INTO public.profiles (id, full_name, phone, role, is_active)
    VALUES (
      v_user_id,
      COALESCE(v_user.raw_user_meta_data->>'full_name', 'Pengguna'),
      public.normalize_phone_id(COALESCE(v_user.raw_user_meta_data->>'phone', '')),
      'warga', TRUE
    );
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  END IF;

  IF v_profile.rt_id IS NULL AND COALESCE(v_profile.phone, '') NOT IN ('', '+62') THEN
    PERFORM public.try_auto_join_rt();
    SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  END IF;

  RETURN row_to_json(v_profile)::json;
END;
$$;

GRANT EXECUTE ON FUNCTION public.try_auto_join_rt TO authenticated;
GRANT EXECUTE ON FUNCTION public.import_warga_batch TO authenticated;
GRANT EXECUTE ON FUNCTION public.ketua_update_registry_entry TO authenticated;
GRANT EXECUTE ON FUNCTION public.ketua_update_member_name TO authenticated;
GRANT EXECUTE ON FUNCTION public.ketua_delete_registry_entry TO authenticated;
