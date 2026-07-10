// Port dari lib/services/announcement_read_service.dart (SharedPreferences → AsyncStorage)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Announcement } from '../types/models';

const PREFS_KEY = 'announcement_reads_v1';
const key = (rtId: string, id: string) => `${rtId}:${id}`;

async function loadAll(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(PREFS_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

async function saveAll(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify([...ids]));
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export const announcementReadService = {
  async isRead(rtId: string, id: string): Promise<boolean> {
    return (await loadAll()).has(key(rtId, id));
  },

  async markRead(rtId: string, id: string): Promise<void> {
    const all = await loadAll();
    all.add(key(rtId, id));
    await saveAll(all);
  },

  /** Pengumuman relevan untuk badge: pinned atau ≤14 hari, belum dibaca. */
  async unreadCount(rtId: string, items: Announcement[]): Promise<number> {
    if (items.length === 0) return 0;
    const all = await loadAll();
    const since = Date.now() - FOURTEEN_DAYS_MS;
    let count = 0;
    for (const a of items) {
      if (all.has(key(rtId, a.id))) continue;
      if (a.isPinned || a.createdAt.getTime() > since) count++;
    }
    return count;
  },

  async readIdsForRt(rtId: string): Promise<Set<string>> {
    const all = await loadAll();
    const prefix = `${rtId}:`;
    return new Set([...all].filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length)));
  },

  async filterUnread(rtId: string, items: Announcement[]): Promise<Announcement[]> {
    const all = await loadAll();
    const since = Date.now() - FOURTEEN_DAYS_MS;
    return items.filter((a) => {
      if (all.has(key(rtId, a.id))) return false;
      return a.isPinned || a.createdAt.getTime() > since;
    });
  },
};
