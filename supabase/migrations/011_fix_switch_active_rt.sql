-- Fix: ganti RT aktif gagal — "Role dan RT hanya bisa diubah melalui fungsi resmi"
-- Penyebab: switch_active_rt UPDATE profiles tanpa set_config ronda.allow_role_change

CREATE OR REPLACE FUNCTION public.switch_active_rt(p_rt_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_rt RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.rt_memberships
    WHERE user_id = v_user_id AND rt_id = p_rt_id
  ) THEN
    RAISE EXCEPTION 'Anda bukan anggota RT ini';
  END IF;

  SELECT * INTO v_rt FROM public.rt_units WHERE id = p_rt_id;

  PERFORM set_config('ronda.allow_role_change', 'true', true);
  UPDATE public.profiles SET rt_id = p_rt_id WHERE id = v_user_id;
  PERFORM set_config('ronda.allow_role_change', 'false', true);

  RETURN json_build_object('rt_id', v_rt.id, 'rt_name', v_rt.name);
END;
$$;

-- Auto-join: beberapa UPDATE rt_id juga perlu bypass
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

  IF EXISTS (
    SELECT 1 FROM public.rt_memberships
    WHERE user_id = v_user_id AND rt_id = v_reg.rt_id
  ) THEN
    PERFORM set_config('ronda.allow_role_change', 'true', true);
    UPDATE public.profiles SET rt_id = v_reg.rt_id, role = 'warga' WHERE id = v_user_id;
    PERFORM set_config('ronda.allow_role_change', 'false', true);
    RETURN json_build_object('joined', false, 'reason', 'already_member', 'rt_id', v_reg.rt_id);
  END IF;

  PERFORM set_config('ronda.allow_role_change', 'true', true);
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
  PERFORM set_config('ronda.allow_role_change', 'false', true);

  INSERT INTO public.rt_memberships (user_id, rt_id, role)
  VALUES (v_user_id, v_reg.rt_id, 'warga')
  ON CONFLICT (user_id, rt_id) DO NOTHING;

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
