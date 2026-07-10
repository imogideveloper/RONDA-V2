// Aturan "aktif vs expired" untuk papan info warga + util pengelompokan arsip.
// - Pengumuman (Info RT): expired jika tanggal kegiatan (eventDate) sudah lewat.
// - Surat (Surat RT): expired jika lewat SURAT_ACTIVE_DAYS sejak diajukan.
// - Tagihan (Iuran): expired jika bulan periodenya sudah lewat.
// Item aktif tampil di papan info; item expired diarsip (dikelompokkan tahun→bulan).
import { Announcement, IuranRecord, SuratRequest } from '../types/models';

export const SURAT_ACTIVE_DAYS = 30;

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function currentPeriodKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Pengumuman aktif bila belum punya tanggal kegiatan, atau tanggalnya belum lewat. */
export function announcementActive(a: Announcement): boolean {
  if (!a.eventDate) return true;
  return a.eventDate >= startOfToday();
}

/** Surat aktif bila belum lewat SURAT_ACTIVE_DAYS sejak diajukan. */
export function suratActive(s: SuratRequest): boolean {
  const days = (Date.now() - s.createdAt.getTime()) / 86_400_000;
  return days <= SURAT_ACTIVE_DAYS;
}

/** Tagihan aktif bila periode = bulan sekarang atau mendatang. */
export function billActive(b: IuranRecord): boolean {
  return b.periodKey >= currentPeriodKey();
}

export interface MonthGroup<T> {
  key: string;
  year: number;
  month: number; // 1..12
  label: string; // "Juli 2026"
  items: T[];
}

/** Kelompokkan item per tahun→bulan, urut terbaru dahulu. */
export function groupByYearMonth<T>(items: T[], dateOf: (t: T) => Date): MonthGroup<T>[] {
  const map = new Map<string, MonthGroup<T>>();
  for (const it of items) {
    const d = dateOf(it);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    let g = map.get(key);
    if (!g) {
      g = { key, year, month, label: `${BULAN[month - 1]} ${year}`, items: [] };
      map.set(key, g);
    }
    g.items.push(it);
  }
  return Array.from(map.values()).sort((a, b) => b.year - a.year || b.month - a.month);
}

/** Tanggal dari periodKey 'YYYY-MM' (untuk grouping tagihan). */
export function dateFromPeriodKey(periodKey: string): Date {
  const [y, m] = periodKey.split('-').map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, 1);
}
