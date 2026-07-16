// Draft isi surat per jenis (dipakai di layar preview draft surat Ketua RT).
// Isi digenerate otomatis dari data permohonan + Setting RT (kop, alamat, ttd).

export interface SuratDraftContext {
  suratType: string;
  wargaName: string;
  purpose: string; // keperluan
  rtNumber: string;
  rwNumber: string | null;
  rtName: string;
  address: string; // alamat RT dari Setting RT
  ketuaName: string;
  kelurahan?: string | null;
  kecamatan?: string | null;
  kota?: string | null;
}

/** "Kelurahan X, Kecamatan Y, Kota Z" bila terisi; jika tidak, pakai nama RT. */
export function lokasiRt(ctx: {
  rtName: string;
  kelurahan?: string | null;
  kecamatan?: string | null;
  kota?: string | null;
}): string {
  const parts = [
    ctx.kelurahan && ctx.kelurahan.trim() !== '' ? `Kelurahan ${ctx.kelurahan.trim()}` : null,
    ctx.kecamatan && ctx.kecamatan.trim() !== '' ? `Kecamatan ${ctx.kecamatan.trim()}` : null,
    ctx.kota && ctx.kota.trim() !== '' ? `Kota ${ctx.kota.trim()}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : ctx.rtName;
}

export interface SuratDraft {
  heading: string; // judul surat, mis. "SURAT KETERANGAN DOMISILI"
  nomor: string; // nomor surat (placeholder)
  pembuka: string;
  isi: string[]; // paragraf isi
  penutup: string;
  keperluan: string; // frasa keperluan (untuk ditebalkan di dalam paragraf isi)
}

function nomorSurat(rtNumber: string): string {
  const mm = String(new Date().getMonth() + 1).padStart(2, '0');
  return `SR-${rtNumber}/${mm}/___`;
}

// Kata kunci -> jenis baku (menampung katalog + alias + custom).
function normalizeType(t: string): 'domisili' | 'tidak_mampu' | 'skck' | 'usaha' | 'nikah' | 'umum' {
  const s = t.toLowerCase();
  if (s.includes('domisili')) return 'domisili';
  if (s.includes('tidak mampu') || s.includes('kurang mampu') || s.includes('sktm')) return 'tidak_mampu';
  if (s.includes('skck') || s.includes('kelakuan baik')) return 'skck';
  if (s.includes('usaha')) return 'usaha';
  if (s.includes('nikah')) return 'nikah';
  return 'umum';
}

export function buildSuratDraft(ctx: SuratDraftContext): SuratDraft {
  const rw = ctx.rwNumber ?? '-';
  const pembuka =
    `Yang bertanda tangan di bawah ini, Ketua RT ${ctx.rtNumber} RW ${rw}, ${lokasiRt(ctx)}, ` +
    `dengan ini menerangkan dengan sebenarnya bahwa:`;
  const penutup =
    'Demikian surat ini kami buat dengan sebenarnya, agar dapat dipergunakan sebagaimana mestinya. ' +
    'Kepada pihak yang berkepentingan dimohon dapat memberikan bantuan seperlunya.';
  const keperluan = ctx.purpose.trim() === '' ? '(sesuai permohonan)' : ctx.purpose.trim();
  const kind = normalizeType(ctx.suratType);

  let heading = ctx.suratType.toUpperCase();
  let isi: string[];

  switch (kind) {
    case 'domisili':
      heading = 'SURAT KETERANGAN DOMISILI';
      isi = [
        `Adalah benar warga yang berdomisili di wilayah RT ${ctx.rtNumber} RW ${rw}, sesuai dengan alamat tersebut di atas.`,
        `Surat keterangan ini dibuat untuk keperluan: ${keperluan}.`,
      ];
      break;
    case 'tidak_mampu':
      heading = 'SURAT KETERANGAN TIDAK MAMPU';
      isi = [
        `Adalah benar warga kami yang menurut sepengetahuan kami tergolong keluarga kurang/tidak mampu secara ekonomi.`,
        `Surat keterangan ini diberikan untuk keperluan: ${keperluan}.`,
      ];
      break;
    case 'skck':
      heading = 'SURAT PENGANTAR SKCK';
      isi = [
        `Adalah benar warga kami dan sepanjang pengetahuan kami berkelakuan baik serta tidak pernah terlibat tindak pidana selama tinggal di lingkungan kami.`,
        `Surat pengantar ini dibuat sebagai pengantar pembuatan SKCK untuk keperluan: ${keperluan}.`,
      ];
      break;
    case 'usaha':
      heading = 'SURAT KETERANGAN USAHA';
      isi = [
        `Adalah benar warga kami yang memiliki dan menjalankan usaha di wilayah RT ${ctx.rtNumber} RW ${rw}.`,
        `Surat keterangan usaha ini dibuat untuk keperluan: ${keperluan}.`,
      ];
      break;
    case 'nikah':
      heading = 'SURAT PENGANTAR NIKAH';
      isi = [
        `Adalah benar warga kami yang akan melangsungkan pernikahan.`,
        `Surat pengantar ini dibuat sebagai pengantar ke Kelurahan/KUA untuk keperluan: ${keperluan}.`,
      ];
      break;
    default:
      isi = [
        `Adalah benar warga kami yang berdomisili di wilayah RT ${ctx.rtNumber} RW ${rw}.`,
        `Surat ini dibuat untuk keperluan: ${keperluan}.`,
      ];
  }

  return { heading, nomor: nomorSurat(ctx.rtNumber), pembuka, isi, penutup, keperluan };
}
