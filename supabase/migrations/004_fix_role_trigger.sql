-- ============================================================
-- Fix: "Role dan RT hanya bisa diubah melalui fungsi resmi"
-- Trigger lama memblokir RPC create_rt_unit / join_rt juga.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Izinkan perubahan role/rt_id dari RPC resmi (SECURITY DEFINER)
  IF current_setting('ronda.allow_role_change', true) = 'true' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() = OLD.id THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.rt_id IS DISTINCT FROM OLD.rt_id THEN
      RAISE EXCEPTION 'Role dan RT hanya bisa diubah melalui fungsi resmi';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ── create_rt_unit (dengan bypass trigger) ───────────────────
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

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil tidak ditemukan';
  END IF;

  IF v_profile.rt_id IS NOT NULL THEN
    RAISE EXCEPTION 'Anda sudah tergabung dalam RT';
  END IF;

  IF v_profile.role NOT IN ('warga', 'petugas') THEN
    RAISE EXCEPTION 'Hanya warga tanpa RT yang bisa membuat RT baru';
  END IF;

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

  PERFORM set_config('ronda.allow_role_change', 'true', true);
  UPDATE public.profiles
  SET role = 'ketua_rt', rt_id = v_rt_id
  WHERE id = v_user_id;
  PERFORM set_config('ronda.allow_role_change', 'false', true);

  RETURN json_build_object(
    'rt_id', v_rt_id,
    'invite_code', v_code,
    'role', 'ketua_rt'
  );
END;
$$;

-- ── join_rt_by_code ──────────────────────────────────────────
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

  PERFORM set_config('ronda.allow_role_change', 'true', true);
  UPDATE public.profiles
  SET role = 'warga', rt_id = v_rt.id
  WHERE id = v_user_id;
  PERFORM set_config('ronda.allow_role_change', 'false', true);

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

-- ── appoint_bendahara ────────────────────────────────────────
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

  SELECT * INTO v_warga FROM public.profiles WHERE id = p_warga_id;

  IF v_warga IS NULL OR v_warga.rt_id != v_ketua.rt_id OR v_warga.role != 'warga' THEN
    RAISE EXCEPTION 'Warga tidak ditemukan di RT Anda';
  END IF;

  SELECT id INTO v_existing_bendahara
  FROM public.profiles
  WHERE rt_id = v_ketua.rt_id AND role = 'bendahara' AND id != p_warga_id
  LIMIT 1;

  PERFORM set_config('ronda.allow_role_change', 'true', true);

  IF v_existing_bendahara IS NOT NULL THEN
    UPDATE public.profiles SET role = 'warga' WHERE id = v_existing_bendahara;
  END IF;

  UPDATE public.profiles SET role = 'bendahara' WHERE id = p_warga_id;

  PERFORM set_config('ronda.allow_role_change', 'false', true);

  RETURN json_build_object('bendahara_id', p_warga_id, 'role', 'bendahara');
END;
$$;

-- ── revoke_bendahara ─────────────────────────────────────────
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
  SELECT * INTO v_bendahara FROM public.profiles WHERE id = p_bendahara_id;

  IF v_bendahara IS NULL OR v_bendahara.rt_id != v_ketua.rt_id OR v_bendahara.role != 'bendahara' THEN
    RAISE EXCEPTION 'Bendahara tidak ditemukan di RT Anda';
  END IF;

  PERFORM set_config('ronda.allow_role_change', 'true', true);
  UPDATE public.profiles SET role = 'warga' WHERE id = p_bendahara_id;
  PERFORM set_config('ronda.allow_role_change', 'false', true);

  RETURN json_build_object('bendahara_id', p_bendahara_id, 'role', 'warga');
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_rt_unit TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_rt_by_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.appoint_bendahara TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_bendahara TO authenticated;
