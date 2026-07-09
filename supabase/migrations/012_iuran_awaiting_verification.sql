-- Status menunggu verifikasi setelah warga upload bukti bayar
ALTER TABLE public.iuran_records DROP CONSTRAINT IF EXISTS iuran_records_status_check;
ALTER TABLE public.iuran_records
  ADD CONSTRAINT iuran_records_status_check
  CHECK (status IN ('pending', 'awaiting_verification', 'paid'));

ALTER TABLE public.iuran_records
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Warga ajukan pembayaran → menunggu verifikasi Bendahara/Ketua
CREATE OR REPLACE FUNCTION public.submit_iuran_payment(
  p_iuran_id UUID,
  p_payment_method TEXT DEFAULT 'qris',
  p_payment_proof_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_row public.iuran_records%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_row FROM public.iuran_records WHERE id = p_iuran_id FOR UPDATE;
  IF v_row IS NULL OR v_row.user_id != v_user THEN
    RAISE EXCEPTION 'Tagihan tidak ditemukan';
  END IF;
  IF v_row.status = 'paid' THEN
    RAISE EXCEPTION 'Tagihan sudah lunas';
  END IF;
  IF v_row.status = 'awaiting_verification' THEN
    RAISE EXCEPTION 'Bukti pembayaran sudah diajukan, menunggu verifikasi';
  END IF;

  UPDATE public.iuran_records
  SET
    status = 'awaiting_verification',
    payment_method = COALESCE(NULLIF(trim(p_payment_method), ''), 'qris'),
    payment_proof_url = p_payment_proof_url,
    submitted_at = NOW()
  WHERE id = p_iuran_id;

  RETURN json_build_object('status', 'awaiting_verification', 'iuran_id', p_iuran_id);
END;
$$;

-- Verifikasi officer: dari pending (tunai langsung) atau awaiting_verification
CREATE OR REPLACE FUNCTION public.approve_iuran_as_officer(p_iuran_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer UUID := auth.uid();
  v_officer_rec public.profiles%ROWTYPE;
  v_row public.iuran_records%ROWTYPE;
  v_warga_name TEXT;
BEGIN
  IF v_officer IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_officer_rec FROM public.profiles WHERE id = v_officer;
  IF v_officer_rec.role NOT IN ('ketua_rt', 'bendahara') THEN
    RAISE EXCEPTION 'Hanya Ketua RT atau Bendahara yang bisa verifikasi iuran';
  END IF;

  SELECT * INTO v_row FROM public.iuran_records WHERE id = p_iuran_id FOR UPDATE;
  IF v_row IS NULL OR v_row.rt_id != v_officer_rec.rt_id THEN
    RAISE EXCEPTION 'Tagihan tidak ditemukan di RT Anda';
  END IF;

  IF v_row.status = 'paid' THEN
    RAISE EXCEPTION 'Tagihan sudah lunas';
  END IF;

  IF v_row.status NOT IN ('pending', 'awaiting_verification') THEN
    RAISE EXCEPTION 'Status tagihan tidak valid untuk verifikasi';
  END IF;

  SELECT full_name INTO v_warga_name FROM public.profiles WHERE id = v_row.user_id;

  UPDATE public.iuran_records
  SET status = 'paid', paid_at = COALESCE(paid_at, NOW())
  WHERE id = p_iuran_id;

  INSERT INTO public.kas_transactions (rt_id, recorded_by, type, amount, description, category)
  VALUES (
    v_row.rt_id, v_officer, 'masuk', v_row.amount,
    'Iuran ' || v_row.period_label || ' — ' || COALESCE(v_warga_name, 'Warga') || ' (verifikasi RT)',
    'iuran'
  );

  RETURN json_build_object('status', 'paid', 'iuran_id', p_iuran_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_iuran_payment TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_iuran_as_officer TO authenticated;
