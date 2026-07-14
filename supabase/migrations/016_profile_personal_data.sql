-- ============================================================
-- Data diri warga di profil (diisi sekali, dipakai auto-isi surat):
-- NIK, tempat & tanggal lahir, pekerjaan.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nik         TEXT,
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS birth_date  TEXT,
  ADD COLUMN IF NOT EXISTS occupation  TEXT;
