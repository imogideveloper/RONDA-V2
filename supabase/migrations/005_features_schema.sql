-- ============================================================
-- Fitur jalan: Iuran, Kas (CRUD), Pengumuman, Surat
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- ── Iuran ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.iuran_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_id         UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_key    TEXT NOT NULL,
  period_label  TEXT NOT NULL,
  amount        NUMERIC(15, 2) NOT NULL DEFAULT 50000,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rt_id, user_id, period_key)
);

CREATE INDEX IF NOT EXISTS idx_iuran_rt ON public.iuran_records(rt_id);
CREATE INDEX IF NOT EXISTS idx_iuran_user ON public.iuran_records(user_id);

-- ── Surat pengantar ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.surat_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rt_id       UUID NOT NULL REFERENCES public.rt_units(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  surat_type  TEXT NOT NULL,
  purpose     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_surat_rt ON public.surat_requests(rt_id);

-- ── RLS Iuran ─────────────────────────────────────────────────
ALTER TABLE public.iuran_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "iuran_select_rt" ON public.iuran_records;
CREATE POLICY "iuran_select_rt" ON public.iuran_records
  FOR SELECT USING (
    rt_id IN (SELECT rt_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "iuran_insert_system" ON public.iuran_records;
CREATE POLICY "iuran_insert_rt" ON public.iuran_records
  FOR INSERT WITH CHECK (
    rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ketua_rt', 'bendahara')
    )
  );

DROP POLICY IF EXISTS "iuran_update_own" ON public.iuran_records;
CREATE POLICY "iuran_update_own" ON public.iuran_records
  FOR UPDATE USING (
    user_id = auth.uid()
    OR rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ketua_rt', 'bendahara')
    )
  );

-- ── RLS Surat ─────────────────────────────────────────────────
ALTER TABLE public.surat_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "surat_select" ON public.surat_requests;
CREATE POLICY "surat_select" ON public.surat_requests
  FOR SELECT USING (
    user_id = auth.uid()
    OR rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('ketua_rt', 'bendahara')
    )
  );

DROP POLICY IF EXISTS "surat_insert" ON public.surat_requests;
CREATE POLICY "surat_insert" ON public.surat_requests
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND rt_id IN (SELECT rt_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "surat_update_ketua" ON public.surat_requests;
CREATE POLICY "surat_update_ketua" ON public.surat_requests
  FOR UPDATE USING (
    rt_id IN (
      SELECT rt_id FROM public.profiles
      WHERE id = auth.uid() AND role = 'ketua_rt'
    )
  );

-- ── RPC: generate tagihan bulan ini untuk semua warga ───────────
CREATE OR REPLACE FUNCTION public.ensure_monthly_iuran(
  p_amount NUMERIC DEFAULT 50000
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

  v_period_label := trim(to_char(NOW(), 'TMMonth YYYY'));

  INSERT INTO public.iuran_records (rt_id, user_id, period_key, period_label, amount)
  SELECT v_rt_id, p.id, v_period_key, v_period_label, p_amount
  FROM public.profiles p
  WHERE p.rt_id = v_rt_id AND p.role = 'warga'
  ON CONFLICT (rt_id, user_id, period_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Tagihan bulan ini untuk diri sendiri (warga / uji coba solo)
CREATE OR REPLACE FUNCTION public.ensure_my_iuran(
  p_amount NUMERIC DEFAULT 50000
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
  v_id UUID;
BEGIN
  SELECT rt_id INTO v_rt_id FROM public.profiles WHERE id = auth.uid();
  IF v_rt_id IS NULL THEN RAISE EXCEPTION 'Anda belum tergabung RT'; END IF;

  INSERT INTO public.iuran_records (rt_id, user_id, period_key, period_label, amount)
  VALUES (v_rt_id, auth.uid(), v_period_key, v_period_label, p_amount)
  ON CONFLICT (rt_id, user_id, period_key) DO UPDATE SET period_label = EXCLUDED.period_label
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ── RPC: bayar iuran (warga) + catat ke kas ─────────────────────
CREATE OR REPLACE FUNCTION public.pay_iuran(p_iuran_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.iuran_records%ROWTYPE;
  v_name TEXT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_row FROM public.iuran_records WHERE id = p_iuran_id FOR UPDATE;

  IF v_row IS NULL OR v_row.user_id != v_user THEN
    RAISE EXCEPTION 'Tagihan tidak ditemukan';
  END IF;

  IF v_row.status = 'paid' THEN
    RAISE EXCEPTION 'Tagihan sudah lunas';
  END IF;

  UPDATE public.iuran_records
  SET status = 'paid', paid_at = NOW()
  WHERE id = p_iuran_id;

  SELECT full_name INTO v_name FROM public.profiles WHERE id = v_user;

  INSERT INTO public.kas_transactions (rt_id, recorded_by, type, amount, description, category)
  VALUES (
    v_row.rt_id, v_user, 'masuk', v_row.amount,
    'Iuran ' || v_row.period_label || ' — ' || COALESCE(v_name, 'Warga'),
    'iuran'
  );

  RETURN json_build_object('status', 'paid', 'iuran_id', p_iuran_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_monthly_iuran TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_my_iuran TO authenticated;
GRANT EXECUTE ON FUNCTION public.pay_iuran TO authenticated;
