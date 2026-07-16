-- 021_surat_applicant_name.sql
-- Nama pemohon surat. Diperlukan saat surat diajukan untuk ANGGOTA KELUARGA
-- (bukan pemilik akun), agar nama yang tampil = nama anggota, bukan nama akun.
-- Bila NULL, tampilan jatuh ke nama pemilik akun (profiles.full_name).

ALTER TABLE public.surat_requests
  ADD COLUMN IF NOT EXISTS applicant_name TEXT;
