// Port dari lib/services/warga_home_loader.dart
// Loader Beranda dengan cache in-memory & fetch paralel.
import { rtService } from './rtService';
import { suratIsPending } from '../types/models';
import { WargaHomeData, emptyWargaHomeData } from '../types/wargaHomeData';

const DEFAULT_IURAN_AMOUNT = 50000;
const CACHE_TTL_MS = 45 * 1000;

let cache: WargaHomeData | null = null;
let cacheKey: string | null = null;
let cacheAt: number | null = null;

const key = (rtId: string, userId: string) => `${rtId}|${userId}`;

function isFresh(k: string): boolean {
  if (cache == null || cacheKey !== k || cacheAt == null) return false;
  return Date.now() - cacheAt < CACHE_TTL_MS;
}

export const wargaHomeLoader = {
  async load(rtId: string, userId: string, force = false): Promise<WargaHomeData> {
    const k = key(rtId, userId);
    if (!force && isFresh(k)) return cache!;

    // Iuran bulan ini di background — jangan blok UI.
    rtService.ensureMyIuran(DEFAULT_IURAN_AMOUNT).catch(() => undefined);

    const [bills, kas, announcements, ketua, surat] = await Promise.all([
      rtService.getIuranRecords(rtId, userId),
      rtService.getKasSummary(rtId),
      rtService.getAnnouncements(rtId),
      rtService.getKetuaProfile(rtId),
      rtService.getSuratRequests(rtId),
    ]);

    const data: WargaHomeData = {
      announcements,
      bills,
      kas,
      ketua,
      pendingSuratCount: surat.filter(suratIsPending).length,
      mySuratRequests: surat,
    };

    cache = data;
    cacheKey = k;
    cacheAt = Date.now();
    return data;
  },

  invalidate() {
    cache = null;
    cacheKey = null;
    cacheAt = null;
  },

  empty: emptyWargaHomeData,
};
