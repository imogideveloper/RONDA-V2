// Penyimpanan preferensi ringan per-user (device-only) via AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadPrefs<T extends object>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...(JSON.parse(raw) as Partial<T>) };
  } catch {
    return fallback;
  }
}

export async function savePrefs<T extends object>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // abaikan — preferensi non-kritis
  }
}
