-- ============================================================
-- RONDA App — Seed data demo (opsional)
-- Buat 3 akun demo via Supabase Auth terlebih dahulu, lalu
-- jalankan bagian UPDATE di bawah dengan UUID yang sesuai.
-- ============================================================

-- Contoh: setelah buat user demo di Auth Dashboard
-- UPDATE profiles SET role = 'ketua_rt', full_name = 'Budi Santoso' WHERE id = '<uuid-ketua>';
-- UPDATE profiles SET role = 'bendahara', full_name = 'Siti Aminah' WHERE id = '<uuid-bendahara>';
-- UPDATE profiles SET role = 'warga', full_name = 'Andi Wijaya' WHERE id = '<uuid-warga>';

-- Atau gunakan RPC create_rt_unit setelah login sebagai ketua demo:
-- SELECT create_rt_unit('RT 05 Kelurahan Mawar', '05', '03', 'Jl. Melati No. 1');
