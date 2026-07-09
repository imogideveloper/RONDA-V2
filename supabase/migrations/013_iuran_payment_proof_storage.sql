-- Bukti bayar iuran: warga upload, officer & warga bisa lihat (bucket publik)
-- Migration 012 hanya RPC/tabel — error 403 Storage RLS butuh file ini.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'iuran-payment-proofs',
  'iuran-payment-proofs',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "iuran_proofs_public_read" ON storage.objects;
DROP POLICY IF EXISTS "iuran_proofs_warga_insert" ON storage.objects;
DROP POLICY IF EXISTS "iuran_proofs_warga_update" ON storage.objects;
DROP POLICY IF EXISTS "iuran_proofs_warga_delete" ON storage.objects;

CREATE POLICY "iuran_proofs_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'iuran-payment-proofs');

-- Path: {user_id}/{rt_id}/{timestamp}.ext — sama pola dengan profile-avatars
CREATE POLICY "iuran_proofs_warga_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'iuran-payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "iuran_proofs_warga_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'iuran-payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "iuran_proofs_warga_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'iuran-payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
