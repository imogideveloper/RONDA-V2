-- ============================================================
-- Iuran multi-komponen (mis. Keamanan, Kebersihan, dst) per RT.
-- Disimpan sebagai daftar JSON di rt_units.iuran_components:
--   [{"name":"Keamanan","amount":50000},{"name":"Kebersihan","amount":50000}]
-- rt_units.iuran_amount tetap dipakai sebagai TOTAL (jumlah komponen),
-- sehingga fungsi generate tagihan tidak perlu diubah.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

ALTER TABLE public.rt_units
  ADD COLUMN IF NOT EXISTS iuran_components JSONB NOT NULL DEFAULT '[]'::jsonb;
