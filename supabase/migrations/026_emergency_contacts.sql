-- 026: Kontak darurat RT (diisi Ketua RT) — Ketua/Bendahara/Security + telepon.
ALTER TABLE public.rt_units
  ADD COLUMN IF NOT EXISTS emergency_ketua_phone     TEXT,
  ADD COLUMN IF NOT EXISTS emergency_bendahara_phone TEXT,
  ADD COLUMN IF NOT EXISTS emergency_security_name   TEXT,
  ADD COLUMN IF NOT EXISTS emergency_security_phone  TEXT;
