-- ============================================================
-- Setting RT (Ketua RT): kop surat, tanda tangan, QRIS, norek bank
-- Alamat memakai kolom rt_units.address yang sudah ada.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.rt_units
  ADD COLUMN IF NOT EXISTS kop_surat_url       TEXT,
  ADD COLUMN IF NOT EXISTS signature_url       TEXT,
  ADD COLUMN IF NOT EXISTS qris_url            TEXT,
  ADD COLUMN IF NOT EXISTS bank_name           TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name   TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Ketua sudah bisa UPDATE rt_units miliknya lewat policy "rt_update_ketua"
-- (dibuat di migrasi 001), jadi tidak perlu RPC baru untuk simpan setting.

-- ── Storage bucket: aset RT (kop surat, tanda tangan, QRIS) ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rt-assets',
  'rt-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "rt_assets_public_read" ON storage.objects;
DROP POLICY IF EXISTS "rt_assets_ketua_insert" ON storage.objects;
DROP POLICY IF EXISTS "rt_assets_ketua_update" ON storage.objects;
DROP POLICY IF EXISTS "rt_assets_ketua_delete" ON storage.objects;

-- Publik boleh baca (QRIS ditampilkan ke warga; kop/tt dipakai di surat)
CREATE POLICY "rt_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'rt-assets');

-- Hanya Ketua RT yang boleh unggah/ubah/hapus. Path diawali {rt_id}/...
CREATE POLICY "rt_assets_ketua_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'rt-assets'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ketua_rt')
  );

CREATE POLICY "rt_assets_ketua_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'rt-assets'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ketua_rt')
  );

CREATE POLICY "rt_assets_ketua_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'rt-assets'
    AND auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ketua_rt')
  );
