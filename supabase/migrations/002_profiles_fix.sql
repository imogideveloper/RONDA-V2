-- ============================================================
-- Fix: Profil tidak ditemukan setelah login
-- Jalankan SETELAH 001_rt_roles_schema.sql
-- ============================================================

-- 1. Backfill profil untuk user auth yang belum punya baris profiles
INSERT INTO public.profiles (id, full_name, phone, role, is_active)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Pengguna'),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  'warga',
  TRUE
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: user boleh baca & buat profil sendiri
DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. RPC: pastikan profil ada (dipanggil dari app jika perlu)
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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  IF v_profile IS NOT NULL THEN
    RETURN row_to_json(v_profile)::json;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = v_user_id;

  INSERT INTO public.profiles (id, full_name, phone, role, is_active)
  VALUES (
    v_user_id,
    COALESCE(v_user.raw_user_meta_data->>'full_name', 'Pengguna'),
    COALESCE(v_user.raw_user_meta_data->>'phone', ''),
    'warga',
    TRUE
  );

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id;
  RETURN row_to_json(v_profile)::json;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_my_profile TO authenticated;
