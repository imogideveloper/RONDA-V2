-- 025: Ketua RT bisa mengganti (regenerate) kode undangan RT bila bocor.
-- Memakai generate_invite_code() yang sudah ada (acak 6 char, unik per-RT).

CREATE OR REPLACE FUNCTION public.regenerate_invite_code(p_rt_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_ketua UUID;
BEGIN
  SELECT ketua_id INTO v_ketua FROM public.rt_units WHERE id = p_rt_id;
  IF v_ketua IS NULL THEN
    RAISE EXCEPTION 'RT tidak ditemukan';
  END IF;
  IF v_ketua <> auth.uid() THEN
    RAISE EXCEPTION 'Hanya Ketua RT yang bisa mengganti kode undangan';
  END IF;

  -- ulang sampai dapat kode yang belum dipakai RT lain
  LOOP
    v_code := public.generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.rt_units WHERE invite_code = v_code);
  END LOOP;

  UPDATE public.rt_units SET invite_code = v_code WHERE id = p_rt_id;
  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_invite_code TO authenticated;
