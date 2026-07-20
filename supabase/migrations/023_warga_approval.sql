-- 023_warga_approval.sql
-- Persetujuan warga baru oleh Ketua RT (Model A: gerbang).
-- Warga daftar via kode undangan -> status 'pending' (belum bisa pakai app penuh).
-- Ketua approve -> 'approved' (aktif). Ketua tolak -> keluar RT ('rejected').

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';
-- Nilai: 'pending' | 'approved' | 'rejected'. Baris lama = 'approved' (grandfathered).

-- join_rt_by_code: warga baru masuk sebagai 'pending', member_count TIDAK bertambah
-- sampai di-approve.
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
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;
  IF v_profile.rt_id IS NOT NULL THEN
    RAISE EXCEPTION 'Anda sudah tergabung dalam RT';
  END IF;

  SELECT * INTO v_rt FROM public.rt_units
  WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code));
  IF v_rt IS NULL THEN RAISE EXCEPTION 'Kode undangan tidak valid'; END IF;

  -- Bypass trigger protect_profile_role (warga ubah role/rt_id sendiri).
  PERFORM set_config('ronda.allow_role_change', 'true', true);
  UPDATE public.profiles
  SET role = 'warga', rt_id = v_rt.id, approval_status = 'pending'
  WHERE id = v_user_id;
  PERFORM set_config('ronda.allow_role_change', 'false', true);

  RETURN json_build_object(
    'rt_id', v_rt.id,
    'rt_name', v_rt.name,
    'role', 'warga',
    'approval_status', 'pending'
  );
END;
$$;

-- Ketua approve warga pending -> aktif + member_count++.
CREATE OR REPLACE FUNCTION public.ketua_approve_warga(p_warga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua public.profiles%ROWTYPE;
  v_rows INT;
BEGIN
  SELECT * INTO v_ketua FROM public.profiles WHERE id = auth.uid();
  IF v_ketua.role NOT IN ('ketua_rt', 'bendahara') THEN
    RAISE EXCEPTION 'Hanya Ketua/Bendahara RT';
  END IF;

  UPDATE public.profiles
  SET approval_status = 'approved'
  WHERE id = p_warga_id AND rt_id = v_ketua.rt_id AND approval_status = 'pending';

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows > 0 THEN
    UPDATE public.rt_units SET member_count = member_count + 1, updated_at = NOW()
    WHERE id = v_ketua.rt_id;
  END IF;
END;
$$;

-- Ketua tolak warga pending -> keluarkan dari RT.
CREATE OR REPLACE FUNCTION public.ketua_reject_warga(p_warga_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ketua public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_ketua FROM public.profiles WHERE id = auth.uid();
  IF v_ketua.role NOT IN ('ketua_rt', 'bendahara') THEN
    RAISE EXCEPTION 'Hanya Ketua/Bendahara RT';
  END IF;

  UPDATE public.profiles
  SET rt_id = NULL, approval_status = 'rejected', role = 'warga'
  WHERE id = p_warga_id AND rt_id = v_ketua.rt_id AND approval_status = 'pending';
END;
$$;

GRANT EXECUTE ON FUNCTION public.ketua_approve_warga TO authenticated;
GRANT EXECUTE ON FUNCTION public.ketua_reject_warga TO authenticated;
