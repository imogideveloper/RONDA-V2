// Port dari lib/utils/period_grouping.dart
import { formatRupiah } from '../config/theme';
import { IuranRecord, KasTransaction, iuranPaymentMethodLabel, kasIsIncome } from '../types/models';

const MONTH_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

export function monthLabel(month: number, short = false): string {
  if (month < 1 || month > 12) return '-';
  return short ? MONTH_SHORT[month - 1] : MONTH_LONG[month - 1];
}

export function weekdayDateLabel(d: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${days[d.getDay()]}, ${d.getDate()} ${monthLabel(d.getMonth() + 1)} ${d.getFullYear()}`;
}

function parseYM(periodKey: string): { y: number; m: number } | null {
  const parts = (periodKey ?? '').split('-');
  if (parts.length < 2) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(y) || isNaN(m)) return null;
  return { y, m };
}

export function daysLateFromPeriodKey(periodKey: string): number {
  const ym = parseYM(periodKey);
  if (!ym) return 0;
  const endOfMonth = new Date(ym.y, ym.m, 0);
  const now = new Date();
  if (now <= endOfMonth) return 0;
  return Math.floor((now.getTime() - endOfMonth.getTime()) / 86400000);
}

export function iuranPeriodTitle(record: IuranRecord): string {
  const ym = parseYM(record.periodKey);
  if (ym) return `${monthLabel(ym.m)} ${ym.y}`;
  return record.periodLabel;
}

export function iuranPaidSubtitle(record: IuranRecord): string {
  if (record.paidAt == null) return 'Belum dibayar';
  const d = record.paidAt;
  return `${iuranPaymentMethodLabel(record)} • ${d.getDate()} ${monthLabel(d.getMonth() + 1, true)}`;
}

export function iuranDueDateLabel(periodKey: string): string {
  const ym = parseYM(periodKey);
  if (!ym) return '-';
  const end = new Date(ym.y, ym.m, 0);
  return `${end.getDate()} ${monthLabel(ym.m)} ${ym.y}`;
}

export function iuranPeriodBadge(periodKey: string): string {
  const ym = parseYM(periodKey);
  if (!ym) return periodKey.toUpperCase();
  return `${monthLabel(ym.m, true).toUpperCase()} ${ym.y}`;
}

/** Rp 100.000 → Rp 100rb */
export function formatRupiahCompact(amount: number): string {
  const n = Math.round(amount);
  if (n >= 1000 && n % 1000 === 0) return `Rp ${Math.floor(n / 1000)}rb`;
  return formatRupiah(n);
}

export function maxDaysLate(unpaid: IuranRecord[]): number {
  let max = 0;
  for (const r of unpaid) {
    const d = daysLateFromPeriodKey(r.periodKey);
    if (d > max) max = d;
  }
  return max;
}

// ── Pengelompokan tahun→bulan ──────────────────────────────────────
export interface PeriodMonthGroup<T> {
  year: number;
  month: number;
  items: T[];
  totalAmount: number;
}
export interface PeriodYearGroup<T> {
  year: number;
  months: PeriodMonthGroup<T>[];
}

export function groupIuranByYearMonth(records: IuranRecord[]): PeriodYearGroup<IuranRecord>[] {
  const byYear = new Map<number, Map<number, Map<string, IuranRecord>>>();
  for (const r of records) {
    const ym = parseYM(r.periodKey);
    if (!ym) continue;
    if (!byYear.has(ym.y)) byYear.set(ym.y, new Map());
    const months = byYear.get(ym.y)!;
    if (!months.has(ym.m)) months.set(ym.m, new Map());
    months.get(ym.m)!.set(r.periodKey, r);
  }
  return [...byYear.keys()]
    .sort((a, b) => b - a)
    .map((y) => {
      const monthsMap = byYear.get(y)!;
      const months = [...monthsMap.keys()]
        .sort((a, b) => b - a)
        .map((m) => {
          const items = [...monthsMap.get(m)!.values()].sort((a, b) =>
            b.periodKey.localeCompare(a.periodKey),
          );
          return {
            year: y,
            month: m,
            items,
            totalAmount: items.reduce((s, i) => s + i.amount, 0),
          };
        });
      return { year: y, months };
    });
}

export function groupKasKeluarByYearMonth(
  transactions: KasTransaction[],
): PeriodYearGroup<KasTransaction>[] {
  const keluar = transactions.filter((t) => !kasIsIncome(t));
  const byYear = new Map<number, Map<number, KasTransaction[]>>();
  for (const t of keluar) {
    const y = t.createdAt.getFullYear();
    const m = t.createdAt.getMonth() + 1;
    if (!byYear.has(y)) byYear.set(y, new Map());
    const months = byYear.get(y)!;
    if (!months.has(m)) months.set(m, []);
    months.get(m)!.push(t);
  }
  return [...byYear.keys()]
    .sort((a, b) => b - a)
    .map((y) => {
      const monthsMap = byYear.get(y)!;
      const months = [...monthsMap.keys()]
        .sort((a, b) => b - a)
        .map((m) => {
          const items = monthsMap
            .get(m)!
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          return {
            year: y,
            month: m,
            items,
            totalAmount: items.reduce((s, i) => s + i.amount, 0),
          };
        });
      return { year: y, months };
    });
}
