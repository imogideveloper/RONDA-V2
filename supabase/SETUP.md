# Setup Supabase Sendiri (Opsi B)

Panduan membuat backend Supabase baru untuk RONDA App, lalu menghubungkan
frontend `mobile/` ke sana. Semua skema (tabel, view, RPC, storage bucket, RLS)
sudah disatukan di **[`setup_all.sql`](setup_all.sql)** — cukup jalankan sekali.

## 1. Buat project Supabase

1. Masuk ke https://supabase.com → **New project**.
2. Isi nama, **Database Password** (simpan), pilih region terdekat (mis. Singapore).
3. Tunggu project selesai provisioning (~2 menit).
4. Ke **Project Settings → API**, catat:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public key** (atau **Publishable key** di project baru).

## 2. Jalankan skema database

1. Buka **SQL Editor → New query**.
2. Copy **seluruh isi** [`setup_all.sql`](setup_all.sql) → paste → **Run**.
3. Pastikan tidak ada error merah. (File ini dirancang untuk database yang masih kosong.)

Ini membuat: tabel `profiles`, `rt_units`, `iuran_records`, `kas_transactions`,
`announcements`, `surat_requests`, `rt_warga_registry`, `rt_memberships`; view
`rt_kas_summary`; 18 RPC; trigger auto-profile saat signup; RLS + policy; dan 3
storage bucket (`announcement-images`, `profile-avatars`, `iuran-payment-proofs`).

## 3. Atur Auth

Frontend memakai tab **Email (Dev)** untuk login/daftar (paling gampang).

- **Authentication → Providers → Email**: pastikan **Enabled** (default aktif).
- **Authentication → Sign In / Providers → Email → "Confirm email"**:
  - **Matikan** jika ingin langsung masuk setelah daftar (paling praktis untuk dev).
  - Biarkan **nyala** jika ingin verifikasi via email (Anda harus klik link konfirmasi
    di email sebelum bisa login).
- Login **Nomor HP/OTP** butuh provider SMS aktif → boleh diabaikan; pakai Email saja.

## 4. Sambungkan frontend

Edit `mobile/.env` (salin dari `.env.example` jika belum ada):

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

Lalu:

```bash
cd mobile
npx expo start --web    # atau: npx expo start  (tekan w/a/i)
```

## 5. Buat akun & RT pertama

1. Di app: **"Belum punya akun? Daftar sebagai Warga"** → isi email + password (min 6).
   - Trigger `handle_new_user` otomatis membuat baris `profiles` untuk Anda.
2. Setelah login → layar **Onboarding**:
   - **Buat RT** → Anda menjadi **Ketua RT** (akses penuh dashboard pengurus), atau
   - **Gabung RT** pakai kode undangan (kalau ada).
   Untuk mengeksplor semua fitur, pilih **Buat RT**.

## Catatan

- `setup_all.sql` = prelude tabel `profiles` (tidak ada di migrasi bernomor karena
  di project lama dibuat terpisah) + migrasi `001`..`013` digabung berurutan.
- Kolom `profiles.role` bertipe `TEXT` (nilai: `warga`, `bendahara`, `ketua_rt`).
- `gen_random_uuid()` sudah tersedia di Supabase (PostgreSQL bawaan) — tidak perlu extension tambahan.
- Aman dijalankan **sekali** pada DB kosong. Menjalankan ulang tidak dianjurkan (sebagian
  perintah idempotent, sebagian tidak).
