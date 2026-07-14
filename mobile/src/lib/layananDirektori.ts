// Direktori Layanan Warga — daftar kategori + layanan di lingkungan RT.
// Dipakai di WargaLayananScreen. "Populer" belum dibuat (menyusul).
import type { IconName } from '../components/Icon';

export interface LayananService {
  name: string;
  subtitle: string;
  tag?: string; // mis. "PESAN", "24/7", "ANTAR"
  phone?: string; // nomor WhatsApp/telepon (opsional, format 08xxx)
}

export interface LayananCategory {
  key: string;
  label: string;
  icon: IconName;
  color: string;
  services: LayananService[];
}

export const LAYANAN_CATEGORIES: LayananCategory[] = [
  {
    key: 'harian',
    label: 'Harian',
    icon: 'storefront',
    color: '#16A34A',
    services: [
      { name: 'Air Galon', subtitle: 'Kebutuhan Harian', tag: 'PESAN', phone: '081200000001' },
      { name: 'Gas LPG 3kg', subtitle: 'Kebutuhan Harian', tag: 'ANTAR', phone: '081200000002' },
      { name: 'Laundry Kiloan', subtitle: 'Cuci & setrika', tag: 'ANTAR', phone: '081200000003' },
      { name: 'Warung Sembako', subtitle: 'Kebutuhan Harian', phone: '081200000004' },
      { name: 'Katering Rumahan', subtitle: 'Makanan harian', tag: 'PESAN', phone: '081200000005' },
    ],
  },
  {
    key: 'perbaikan',
    label: 'Perbaikan',
    icon: 'construct-outline',
    color: '#F59E0B',
    services: [
      { name: 'Tukang Ledeng', subtitle: 'Perbaikan pipa & air', phone: '081200000011' },
      { name: 'Tukang Listrik', subtitle: 'Instalasi & perbaikan', phone: '081200000012' },
      { name: 'Servis AC', subtitle: 'Cuci & isi freon', tag: 'PANGGIL', phone: '081200000013' },
      { name: 'Tukang Bangunan', subtitle: 'Renovasi ringan', phone: '081200000014' },
      { name: 'Servis Elektronik', subtitle: 'TV, kulkas, mesin cuci', phone: '081200000015' },
    ],
  },
  {
    key: 'kendaraan',
    label: 'Kendaraan',
    icon: 'car',
    color: '#2563EB',
    services: [
      { name: 'Bengkel Motor', subtitle: 'Servis & sparepart', phone: '081200000021' },
      { name: 'Bengkel Mobil', subtitle: 'Servis & tune up', phone: '081200000022' },
      { name: 'Tambal Ban', subtitle: 'Motor & mobil', tag: '24 JAM', phone: '081200000023' },
    ],
  },
  {
    key: 'darurat',
    label: 'Darurat',
    icon: 'shield',
    color: '#DC2626',
    services: [
      { name: 'Ambulance', subtitle: 'Keamanan & Darurat', tag: '24/7', phone: '081200000031' },
      { name: 'Pemadam Kebakaran', subtitle: 'Keamanan & Darurat', tag: '24/7', phone: '113' },
      { name: 'Pos Keamanan RT', subtitle: 'Satpam & ronda', tag: '24/7', phone: '081200000033' },
    ],
  },
  {
    key: 'dokumen',
    label: 'Dokumen',
    icon: 'document-text',
    color: '#4B5563',
    services: [
      { name: 'Fotokopi & ATK', subtitle: 'Cetak & jilid', phone: '081200000041' },
      { name: 'Jasa Ketik & Print', subtitle: 'Dokumen & tugas', phone: '081200000042' },
    ],
  },
  {
    key: 'sosial',
    label: 'Sosial',
    icon: 'people',
    color: '#EC4899',
    services: [
      { name: 'Posyandu', subtitle: 'Kesehatan ibu & anak', phone: '081200000051' },
      { name: 'Karang Taruna', subtitle: 'Kegiatan pemuda', phone: '081200000052' },
      { name: 'PKK', subtitle: 'Pemberdayaan keluarga', phone: '081200000053' },
      { name: 'Bank Sampah', subtitle: 'Daur ulang & tabungan', phone: '081200000054' },
    ],
  },
  {
    key: 'infra',
    label: 'Infra',
    icon: 'business',
    color: '#7C3AED',
    services: [
      { name: 'WiFi & Internet', subtitle: 'Infrastruktur Rumah', tag: '24/7', phone: '081200000061' },
      { name: 'PDAM / Air Bersih', subtitle: 'Layanan air', phone: '081200000062' },
      { name: 'Listrik PLN', subtitle: 'Gangguan & token', tag: '24/7', phone: '123' },
    ],
  },
  {
    key: 'event',
    label: 'Event',
    icon: 'party',
    color: '#EA580C',
    services: [
      { name: 'Sewa Tenda & Kursi', subtitle: 'Hajatan & acara', tag: 'SEWA', phone: '081200000071' },
      { name: 'Sound System', subtitle: 'Hajatan & acara', tag: 'SEWA', phone: '081200000072' },
      { name: 'Dekorasi', subtitle: 'Pelaminan & panggung', phone: '081200000073' },
      { name: 'MC & Hiburan', subtitle: 'Acara RT/RW', phone: '081200000074' },
    ],
  },
];

export function layananTotal(categories: LayananCategory[] = LAYANAN_CATEGORIES): number {
  return categories.reduce((sum, c) => sum + c.services.length, 0);
}

export interface LayananSearchHit extends LayananService {
  category: LayananCategory;
}

/** Cari layanan lintas kategori berdasarkan nama/subjudul/kategori. */
export function searchLayanan(query: string): LayananSearchHit[] {
  const q = query.trim().toLowerCase();
  if (q === '') return [];
  const hits: LayananSearchHit[] = [];
  for (const category of LAYANAN_CATEGORIES) {
    for (const s of category.services) {
      if (
        s.name.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        category.label.toLowerCase().includes(q)
      ) {
        hits.push({ ...s, category });
      }
    }
  }
  return hits;
}
