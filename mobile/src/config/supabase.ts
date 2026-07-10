import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Konfigurasi Supabase dibaca dari environment (app.config.ts -> extra) atau
// langsung dari variabel EXPO_PUBLIC_*. Lihat .env.example.
const extra = Constants.expoConfig?.extra ?? {};

const SUPABASE_URL =
  (extra.supabaseUrl as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  (extra.supabaseAnonKey as string | undefined) ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Konfigurasi Supabase tidak ditemukan. Salin .env.example ke .env dan isi ' +
      'EXPO_PUBLIC_SUPABASE_URL serta EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
