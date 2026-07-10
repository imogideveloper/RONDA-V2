// Helper tanggal Bahasa Indonesia — port dari berbagai *.dart

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** 12 Mei 2025 */
export function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** 12 Mei — tanpa tahun */
export function formatDateShort(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function monthLabel(m: number): string {
  return MONTHS_LONG[m - 1] ?? '';
}

/** greetingByTime() dari ketua_rt_dashboard_widgets.dart */
export function greetingByTime(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

/** honorificName() — "Budi Santoso" → "Pak Budi" */
export function honorificName(fullName: string): string {
  const parts = (fullName ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Bapak/Ibu';
  if (parts.length >= 2 && parts[0].length <= 3) return `Pak ${parts[1]}`;
  return `Pak ${parts[0]}`;
}

/** daysLateFromPeriodKey — periodKey "YYYY-MM" */
export function daysLateFromPeriodKey(periodKey: string): number {
  const parts = (periodKey ?? '').split('-');
  if (parts.length < 2) return 0;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(y) || isNaN(m)) return 0;
  // Akhir bulan = hari ke-0 bulan berikutnya
  const endOfMonth = new Date(y, m, 0);
  const now = new Date();
  if (now <= endOfMonth) return 0;
  const diffMs = now.getTime() - endOfMonth.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
