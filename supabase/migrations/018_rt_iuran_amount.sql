-- ============================================================
-- Nominal iuran per bulan bisa diatur Ketua RT (default Rp 50.000).
-- Fungsi generate tagihan membaca nominal dari rt_units.iuran_amount.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.rt_units
  ADD COLUMN IF NOT EXISTS iuran_amount NUMERIC(15, 2) NOT NULL DEFAULT 50000;

-- Generate tagihan bulan ini untuk SEMUA warga — pakai nominal RT.
CREATE OR REPLACE FUNCTION public.ensure_monthly_iuran(
  p_amount NUMERIC DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rt_id UUID;
  v_role TEXT;
  v_period_key TEXT := to_char(NOW(), 'YYYY-MM');
  v_period_label TEXT;
  v_amount NUMERIC;
  v_count INT;
BEGIN
  SELECT rt_id, role INTO v_rt_id, v_role
  FROM public.profiles WHERE id = auth.uid();

  IF v_rt_id IS NULL THEN
    RAISE EXCEPTION 'Anda belum tergabung RT';
  END IF;

  IF v_role NOT IN ('ketua_rt', 'bendahara') THEN
    RAISE EXCEPTION 'Hanya Ketua/Bendahara yang bisa generate tagihan';
  END IF;

  SELECT COALESCE(iuran_amount, p_amount, 50000) INTO v_amount
  FROM public.rt_units WHERE id = v_rt_id;

  v_period_label := trim(to_char(NOW(), 'TMMonth YYYY'));

  INSERT INTO public.iuran_records (rt_id, user_id, period_key, period_label, amount)
  SELECT v_rt_id, p.id, v_period_key, v_period_label, v_amount
  FROM public.profiles p
  WHERE p.rt_id = v_rt_id AND p.role = 'warga'
  ON CONFLICT (rt_id, user_id, period_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Tagihan bulan ini untuk diri sendiri — pakai nominal RT.
-- Tagihan yang masih 'unpaid' ikut menyesuaikan bila nominal RT diubah.
CREATE OR REPLACE FUNCTION public.ensure_my_iuran(
  p_amount NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rt_id UUID;
  v_period_key TEXT := to_char(NOW(), 'YYYY-MM');
  v_period_label TEXT := trim(to_char(NOW(), 'TMMonth YYYY'));
  v_amount NUMERIC;
  v_id UUID;
BEGIN
  SELECT rt_id INTO v_rt_id FROM public.profiles WHERE id = auth.uid();
  IF v_rt_id IS NULL THEN RAISE EXCEPTION 'Anda belum tergabung RT'; END IF;

  SELECT COALESCE(iuran_amount, p_amount, 50000) INTO v_amount
  FROM public.rt_units WHERE id = v_rt_id;

  INSERT INTO public.iuran_records (rt_id, user_id, period_key, period_label, amount)
  VALUES (v_rt_id, auth.uid(), v_period_key, v_period_label, v_amount)
  ON CONFLICT (rt_id, user_id, period_key) DO UPDATE
    SET period_label = EXCLUDED.period_label,
        amount = CASE WHEN public.iuran_records.status = 'unpaid'
                      THEN EXCLUDED.amount ELSE public.iuran_records.amount END
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_monthly_iuran TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_my_iuran TO authenticated;
