// Port dari WargaLayananSuratItem (lib/widgets/warga_beranda_widgets.dart)
import type { IconName } from '../components/Icon';
import { wargaColors } from '../config/theme';

export interface SuratItem {
  title: string;
  sla: string;
  description: string;
  icon: IconName;
  iconColor: string;
  iconBg: string;
  accentColor: string;
  suratTypeKey: string;
  isPopular: boolean;
  keperluanOptions: string[];
}

export const SURAT_CATALOG: SuratItem[] = [
  {
    title: 'Surat Keterangan Domisili',
    sla: '2 hari kerja',
    description: 'Surat resmi alamat domisili warga untuk keperluan administrasi.',
    icon: 'home',
    iconColor: '#185FA5',
    iconBg: wargaColors.accentBlue,
    accentColor: '#3B82F6',
    suratTypeKey: 'Surat Keterangan Domisili',
    isPopular: true,
    keperluanOptions: [
      'Administrasi sekolah',
      'Pendaftaran program bantuan',
      'Pengajuan KTP/KK',
      'Keperluan lainnya',
    ],
  },
  {
    title: 'Surat Keterangan Tidak Mampu',
    sla: '3 hari kerja',
    description: 'Surat untuk pengajuan bantuan sosial atau keringanan biaya.',
    icon: 'heart',
    iconColor: wargaColors.dangerRed,
    iconBg: wargaColors.accentRed,
    accentColor: '#EC4899',
    suratTypeKey: 'Surat Keterangan Tidak Mampu',
    isPopular: false,
    keperluanOptions: [
      'Pendaftaran program bantuan',
      'Beasiswa / sekolah',
      'Bantuan kesehatan',
      'Keperluan lainnya',
    ],
  },
  {
    title: 'Surat Pengantar SKCK',
    sla: '1 hari kerja',
    description: 'Surat pengantar ke Polsek untuk pembuatan SKCK.',
    icon: 'shield',
    iconColor: '#5B21B6',
    iconBg: '#F3E8FF',
    accentColor: '#8B5CF6',
    suratTypeKey: 'Surat Pengantar SKCK',
    isPopular: false,
    keperluanOptions: [
      'Melamar pekerjaan',
      'Melanjutkan studi',
      'Keperluan administrasi',
      'Keperluan lainnya',
    ],
  },
  {
    title: 'Surat Keterangan Usaha',
    sla: '2 hari kerja',
    description: 'Surat keterangan usaha untuk UMKM / perizinan ringan.',
    icon: 'storefront',
    iconColor: '#BA7517',
    iconBg: wargaColors.accentYellow,
    accentColor: '#F59E0B',
    suratTypeKey: 'Surat Keterangan Usaha',
    isPopular: false,
    keperluanOptions: [
      'Perizinan usaha',
      'Pengajuan kredit UMKM',
      'Kontrak / kerjasama',
      'Keperluan lainnya',
    ],
  },
  {
    title: 'Surat Pengantar Nikah',
    sla: '3 hari kerja',
    description: 'Surat pengantar nikah ke Kelurahan / KUA.',
    icon: 'heart-outline',
    iconColor: wargaColors.primaryGreen,
    iconBg: wargaColors.lightGreen,
    accentColor: '#EC4899',
    suratTypeKey: 'Surat Pengantar Nikah',
    isPopular: false,
    keperluanOptions: [
      'Pengajuan nikah di KUA',
      'Administrasi catatan sipil',
      'Keperluan lainnya',
    ],
  },
];

const ALIASES: Record<string, string> = {
  'Surat Domisili': 'Surat Keterangan Domisili',
  'Surat Pengantar KTP': 'Surat Keterangan Tidak Mampu',
};

export function suratItemByTypeKey(key: string): SuratItem | null {
  const found = SURAT_CATALOG.find((i) => i.suratTypeKey === key);
  if (found) return found;
  const mapped = ALIASES[key];
  if (mapped) return suratItemByTypeKey(mapped);
  return null;
}
