-- 024_kk_document.sql
-- Dokumen Kartu Keluarga (PDF) yang diunggah warga saat daftar.
-- Dipakai auto-isi data + preview oleh Ketua RT saat menyetujui warga baru.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kk_url TEXT;

-- Bucket publik untuk PDF KK (path: {user_id}/kk.pdf).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kk-docs',
  'kk-docs',
  true,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "kk_docs_public_read" ON storage.objects;
DROP POLICY IF EXISTS "kk_docs_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "kk_docs_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "kk_docs_owner_delete" ON storage.objects;

CREATE POLICY "kk_docs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'kk-docs');

CREATE POLICY "kk_docs_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kk-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "kk_docs_owner_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'kk-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "kk_docs_owner_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'kk-docs' AND auth.uid()::text = (storage.foldername(name))[1]
  );
