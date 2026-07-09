-- ============================================================
-- Fix RLS profiles (sering bikin SELECT profil selalu kosong)
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Hapus policy yang bisa rekursif / bentrok
DROP POLICY IF EXISTS "profiles_select_same_rt" ON public.profiles;

-- Helper baca rt_id tanpa kena RLS rekursif
CREATE OR REPLACE FUNCTION public.current_user_rt_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rt_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Policy SELECT: selalu boleh baca profil sendiri + anggota RT yang sama
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_select_rt_members" ON public.profiles;
CREATE POLICY "profiles_select_rt_members" ON public.profiles
  FOR SELECT USING (
    rt_id IS NOT NULL
    AND rt_id = public.current_user_rt_id()
  );

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- Backfill ulang (aman di-run berkali-kali)
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

-- Perkuat RPC ensure (bypass RLS)
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
  IF FOUND THEN
    RETURN row_to_json(v_profile)::json;
  END IF;

  SELECT * INTO v_user FROM auth.users WHERE id = v_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User auth tidak ditemukan';
  END IF;

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

-- CEK: harus tampil baris user + profil (bukan kosong semua)
SELECT
  u.email,
  u.id AS auth_id,
  p.id AS profile_id,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
