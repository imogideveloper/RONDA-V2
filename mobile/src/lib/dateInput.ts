// Konversi tanggal antara format Indonesia ("12 Mei 1990") dan ISO ("1990-05-12").
// Nilai disimpan dalam format Indonesia (konsisten dengan data lama & tampilan surat).
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** "1990-05-12" -> "12 Mei 1990". Kembalikan apa adanya bila bukan ISO. */
export function isoToIndo(iso: string): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  const year = m[1];
  const mon = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  if (mon < 1 || mon > 12) return iso;
  return `${day} ${BULAN[mon - 1]} ${year}`;
}

/** "12 Mei 1990" -> "1990-05-12". Kembalikan '' bila gagal parse. */
export function indoToISO(indo: string): string {
  if (!indo) return '';
  // Sudah ISO?
  const iso = indo.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const m = indo.trim().match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return '';
  const day = parseInt(m[1], 10);
  const monIdx = BULAN.findIndex((b) => b.toLowerCase() === m[2].toLowerCase());
  const year = parseInt(m[3], 10);
  if (monIdx < 0) return '';
  return `${year}-${String(monIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Nama hari dari tanggal Indonesia/ISO (mis. "Minggu"). '' bila gagal. */
export function hariFromDate(value: string): string {
  const iso = indoToISO(value);
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return '';
  return HARI[d.getDay()];
}
