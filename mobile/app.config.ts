import type { ConfigContext, ExpoConfig } from 'expo/config';

// Read static config from app.json, then inject Supabase credentials from the
// environment so they are never hard-coded in the repo. Values are exposed to
// the app via `Constants.expoConfig.extra` (see src/config/supabase.ts).
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
});
