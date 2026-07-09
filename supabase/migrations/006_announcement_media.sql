-- ============================================================
-- Pengumuman: tanggal kegiatan + foto + storage
-- Jalankan di Supabase SQL Editor
-- ============================================================

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ── Storage bucket (foto lokasi kerja bakti, dll.) ────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcement-images',
  'announcement-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Hapus policy lama jika re-run
DROP POLICY IF EXISTS "announcement_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "announcement_images_officer_upload" ON storage.objects;
DROP POLICY IF EXISTS "announcement_images_officer_update" ON storage.objects;
DROP POLICY IF EXISTS "announcement_images_officer_delete" ON storage.objects;

-- Semua orang bisa lihat (URL publik)
CREATE POLICY "announcement_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'announcement-images');

-- Ketua / Bendahara boleh upload
CREATE POLICY "announcement_images_officer_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'announcement-images'
    AND auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('ketua_rt', 'bendahara')
    )
  );

CREATE POLICY "announcement_images_officer_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'announcement-images'
    AND auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('ketua_rt', 'bendahara')
    )
  );

CREATE POLICY "announcement_images_officer_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'announcement-images'
    AND auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE role IN ('ketua_rt', 'bendahara')
    )
  );
