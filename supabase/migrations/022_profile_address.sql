-- 022_profile_address.sql
-- Alamat rumah per-warga (dibaca dari Kartu Keluarga saat scan KK, bukan input manual).
-- Dipakai untuk: kolom Blok/Rumah ekspor Data Warga, alamat template Ucapan Duka Cita, dan surat.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS address TEXT;

-- Ketua RT menyetel alamat seorang warga di RT-nya (mis. hasil scan KK).
CREATE OR REPLACE FUNCTION public.ketua_update_member_address(p_member_id UUID, p_address TEXT)
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
  SET address = NULLIF(trim(p_address), '')
  WHERE id = p_member_id AND rt_id = v_ketua.rt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ketua_update_member_address TO authenticated;
