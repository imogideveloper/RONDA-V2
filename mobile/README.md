# RT OS Indonesia — React Native (Expo)

Port React Native (Expo + TypeScript) dari aplikasi Flutter `ronda_app`.
Tahap ini menyelesaikan **satu alur end-to-end: Splash → Login → Beranda Warga**,
sekaligus fondasi (Supabase client, theme, model, service) untuk fitur berikutnya.

## Menjalankan

```bash
cd mobile
cp .env.example .env  # isi EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install           # atau: npx expo install (menyelaraskan versi native)
npx expo start        # scan QR dengan Expo Go, atau tekan w / a / i
```

> Konfigurasi Supabase dibaca dari environment (`.env`, prefix `EXPO_PUBLIC_`) lewat
> `app.config.ts` → `expo-constants` (lihat `src/config/supabase.ts`). Backend sama
> dengan versi Flutter. Jangan commit `.env` (sudah di-`.gitignore`).
> Login **Email (Dev)** paling mudah untuk uji coba; login **Nomor HP/OTP** butuh
> Phone Auth + provider SMS aktif di Supabase.

## Struktur

```
src/
  config/     supabase.ts, theme.ts (palet emerald, formatRupiah, role)
  lib/        phone.ts, date.ts (helper normalisasi HP, tanggal ID, greeting)
  types/      models.ts, wargaHomeData.ts (port models/*.dart → TS)
  services/   authService, rtService, wargaDirectoryService, wargaHomeLoader
  components/ Toast, Card, Field, warga/BerandaWidgets
  screens/    SplashScreen, LoginScreen, HomeScreen (role router)
              warga/WargaMainShell, warga/WargaHomeScreen
  navigation/ types.ts (RootStack)
```

## Peta port Flutter → React Native

| Flutter (lib/) | React Native (src/) |
|---|---|
| `config/supabase_config.dart` | `config/supabase.ts` |
| `config/app_theme.dart` | `config/theme.ts` |
| `services/auth_service.dart` | `services/authService.ts` |
| `services/rt_service.dart` | `services/rtService.ts` (subset) |
| `services/warga_home_loader.dart` | `services/wargaHomeLoader.ts` |
| `models/*.dart` | `types/models.ts`, `types/wargaHomeData.ts` |
| `pages/splash_page.dart` | `screens/SplashScreen.tsx` |
| `pages/auth/login_otp_page.dart` | `screens/LoginScreen.tsx` |
| `pages/role_home_router.dart` | `screens/HomeScreen.tsx` |
| `pages/shell/warga_main_shell.dart` | `screens/warga/WargaMainShell.tsx` |
| `pages/warga/warga_home_view.dart` | `screens/warga/WargaHomeScreen.tsx` |
| `widgets/warga_beranda_widgets.dart` | `components/warga/BerandaWidgets.tsx` |

## Padanan plugin (untuk fitur lanjutan)

| Flutter | Expo |
|---|---|
| image_picker | expo-image-picker |
| file_picker | expo-document-picker |
| share_plus | expo-sharing / Share API |
| url_launcher | expo-linking |
| shared_preferences | @react-native-async-storage/async-storage |
| google_fonts | @expo-google-fonts/outfit |

## Belum diport (tahap berikutnya)

- Onboarding (buat/gabung RT) — saat ini layar placeholder di `HomeScreen`.
- Tab Iuran, Info, Profil warga — placeholder di `WargaMainShell`.
- Alur bayar iuran, layanan surat, kontak darurat, riwayat kas — tombol memunculkan toast "menyusul".
- Dasbor Ketua RT & Bendahara.
