-- ============================================================
-- Lengkapi format surat agar sesuai kop resmi:
-- - profiles: jenis kelamin, agama, status perkawinan
-- - rt_units: kelurahan, kecamatan, kota (untuk kop & pembuka)
-- - surat_requests: snapshot jenis kelamin/agama/status saat mengajukan
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender         TEXT,
  ADD COLUMN IF NOT EXISTS religion       TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT;

ALTER TABLE public.rt_units
  ADD COLUMN IF NOT EXISTS kelurahan TEXT,
  ADD COLUMN IF NOT EXISTS kecamatan TEXT,
  ADD COLUMN IF NOT EXISTS kota      TEXT;

ALTER TABLE public.surat_requests
  ADD COLUMN IF NOT EXISTS gender         TEXT,
  ADD COLUMN IF NOT EXISTS religion       TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT;
