# Ronda-App

Aplikasi manajemen RT/RW — iuran, kas, pengumuman, surat, dan layanan warga.

## Stack

- Backend: Supabase (auth, database, storage) — lihat `supabase/`
- Frontend mobile: React Native (Expo + TypeScript) — lihat `mobile/`
- Frontend lama (Flutter) masih ada di root/`lib/` untuk referensi

## Backend (Supabase)

Jalankan migrasi SQL di `supabase/migrations/` di Supabase SQL Editor (atau `supabase db push`)
sebelum uji fitur lengkap.

## Frontend mobile (React Native / Expo)

Frontend mobile ada di folder [`mobile/`](mobile/) dan terhubung ke Supabase yang sama.

```bash
cd mobile
cp .env.example .env      # isi EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
npx expo start            # tekan w = web, a = Android, i = iOS
```

Perintah lain:

- `npx expo start --web` — jalankan di browser (http://localhost:8081)
- `npx expo start --android` — jalankan di emulator/perangkat Android
- `npx tsc --noEmit` — cek tipe TypeScript

Konfigurasi Supabase dibaca dari environment (`.env`, prefix `EXPO_PUBLIC_`) melalui
`app.config.ts` → `expo-constants`. Jangan commit `.env` (sudah di-`.gitignore`).
