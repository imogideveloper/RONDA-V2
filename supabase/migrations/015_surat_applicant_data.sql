-- ============================================================
-- Data pemohon pada permohonan surat (diisi warga saat mengajukan):
-- NIK, tempat & tanggal lahir, pekerjaan. Dipakai di draft surat.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.surat_requests
  ADD COLUMN IF NOT EXISTS nik         TEXT,
  ADD COLUMN IF NOT EXISTS birth_place TEXT,
  ADD COLUMN IF NOT EXISTS birth_date  TEXT,
  ADD COLUMN IF NOT EXISTS occupation  TEXT;
