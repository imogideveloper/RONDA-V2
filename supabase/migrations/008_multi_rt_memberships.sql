-- Multi-RT membership untuk warga (rumah di beberapa RT)
-- profiles.rt_id = RT yang sedang aktif di aplikasi

CREATE TABLE IF NOT EXISTS public.rt_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rt_id      UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  role       public.user_role NOT NULL DEFAULT 'warga',
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, rt_id)
);

CREATE INDEX IF NOT EXISTS idx_rt_memberships_user ON public.rt_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_rt_memberships_rt ON public.rt_memberships(rt_id);

ALTER TABLE public.rt_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memberships_select_own" ON public.rt_memberships;
CREATE POLICY "memberships_select_own" ON public.rt_memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Backfill dari profiles yang sudah punya RT
INSERT INTO public.rt_memberships (user_id, rt_id, role)
SELECT p.id, p.rt_id, p.role::public.user_role
FROM public.profiles p
WHERE p.rt_id IS NOT NULL
ON CONFLICT (user_id, rt_id) DO NOTHING;

-- ── Gabung RT (pertama atau RT tambahan untuk warga) ───────────
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
  v_is_new BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_user_id FOR UPDATE;

  IF v_profile.role IN ('ketua_rt', 'bendahara') AND v_profile.rt_id IS NOT NULL THEN
    RAISE EXCEPTION 'Ketua/Bendahara tidak bisa gabung ke RT lain. Gunakan akun warga terpisah.';
  END IF;

  SELECT * INTO v_rt
  FROM public.rt_units
  WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code));

  IF v_rt IS NULL THEN
    RAISE EXCEPTION 'Kode undangan tidak valid';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.rt_memberships
    WHERE user_id = v_user_id AND rt_id = v_rt.id
  ) THEN
    PERFORM public.switch_active_rt(v_rt.id);
    RETURN json_build_object(
      'rt_id', v_rt.id,
      'rt_name', v_rt.name,
      'role', 'warga',
      'switched', true
    );
  END IF;

  v_is_new := TRUE;

  INSERT INTO public.rt_memberships (user_id, rt_id, role)
  VALUES (v_user_id, v_rt.id, 'warga');

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
    'role', 'warga',
    'switched', false,
    'additional', v_profile.rt_id IS NOT NULL
  );
END;
$$;

-- ── Ganti RT aktif ───────────────────────────────────────────
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

-- ── Daftar keanggotaan RT saya ───────────────────────────────
CREATE OR REPLACE FUNCTION public.list_my_rt_memberships()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_active UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT rt_id INTO v_active FROM public.profiles WHERE id = v_user_id;

  RETURN COALESCE((
    SELECT json_agg(row_to_json(t) ORDER BY t.is_active DESC, t.joined_at)
    FROM (
      SELECT
        m.rt_id,
        u.name AS rt_name,
        u.rt_number,
        u.rw_number,
        u.address,
        m.role::TEXT AS role,
        m.joined_at,
        (m.rt_id = v_active) AS is_active
      FROM public.rt_memberships m
      JOIN public.rt_units u ON u.id = m.rt_id
      WHERE m.user_id = v_user_id
    ) t
  ), '[]'::JSON);
END;
$$;

-- ── Ringkasan iuran RT (untuk kartu warga) ───────────────────
CREATE OR REPLACE FUNCTION public.get_iuran_rt_summary(p_rt_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period TEXT := to_char(NOW(), 'YYYY-MM');
  v_total INT;
  v_paid INT;
BEGIN
  SELECT COUNT(*)::INT INTO v_total
  FROM public.profiles
  WHERE rt_id = p_rt_id AND role = 'warga';

  SELECT COUNT(*)::INT INTO v_paid
  FROM public.iuran_records
  WHERE rt_id = p_rt_id
    AND period_key = v_period
    AND status = 'paid';

  RETURN json_build_object(
    'period_key', v_period,
    'total_warga', v_total,
    'paid_count', v_paid,
    'unpaid_count', GREATEST(v_total - v_paid, 0)
  );
END;
$$;

-- Perbarui auto-join agar isi memberships
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
    UPDATE public.profiles SET rt_id = v_reg.rt_id, role = 'warga' WHERE id = v_user_id;
    RETURN json_build_object('joined', false, 'reason', 'already_member', 'rt_id', v_reg.rt_id);
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

GRANT EXECUTE ON FUNCTION public.switch_active_rt TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_my_rt_memberships TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_iuran_rt_summary TO authenticated;
