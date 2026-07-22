-- 027: Ketua/Bendahara bisa MENOLAK bukti pembayaran iuran (kembalikan ke pending).
CREATE OR REPLACE FUNCTION public.reject_iuran_as_officer(p_iuran_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_officer UUID := auth.uid();
  v_officer_rec public.profiles%ROWTYPE;
  v_row public.iuran_records%ROWTYPE;
BEGIN
  IF v_officer IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_officer_rec FROM public.profiles WHERE id = v_officer;
  IF v_officer_rec.role NOT IN ('ketua_rt', 'bendahara') THEN
    RAISE EXCEPTION 'Hanya Ketua RT atau Bendahara yang bisa memverifikasi iuran';
  END IF;

  SELECT * INTO v_row FROM public.iuran_records WHERE id = p_iuran_id FOR UPDATE;
  IF v_row IS NULL OR v_row.rt_id != v_officer_rec.rt_id THEN
    RAISE EXCEPTION 'Tagihan tidak ditemukan di RT Anda';
  END IF;

  IF v_row.status <> 'awaiting_verification' THEN
    RAISE EXCEPTION 'Hanya pembayaran yang menunggu verifikasi yang bisa ditolak';
  END IF;

  -- Kembalikan ke belum bayar; hapus bukti agar warga bisa unggah ulang.
  UPDATE public.iuran_records
  SET status = 'pending', payment_proof_url = NULL, payment_method = NULL,
      paid_at = NULL, submitted_at = NULL
  WHERE id = p_iuran_id;

  RETURN json_build_object('status', 'pending', 'iuran_id', p_iuran_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_iuran_as_officer TO authenticated;
