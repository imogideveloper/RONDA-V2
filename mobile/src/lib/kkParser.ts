// Parser Kartu Keluarga (teks PDF / hasil OCR) -> draft anggota keluarga.
// KK punya 2 tabel: (atas) Nama/NIK/JK/TTL/Agama; (bawah) Status Kawin/Hubungan.
// Digabung berdasarkan urutan baris (No 1..N sama di kedua tabel).
import { FamilyMemberInput } from '../services/familyService';

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}

function detectRelation(u: string): string | null {
  if (u.includes('KEPALA KELUARGA') || u.includes('KEPALA KEL')) return 'KEPALA';
  if (u.includes('ISTERI') || u.includes('ISTRI')) return 'Istri';
  if (u.includes('SUAMI')) return 'Suami';
  if (u.includes('ANAK')) return 'Anak';
  if (u.includes('ORANG TUA') || u.includes('ORANGTUA') || u.includes('MERTUA')) return 'Orang Tua';
  if (u.includes('MENANTU') || u.includes('CUCU') || u.includes('FAMILI') || u.includes('SAUDARA'))
    return 'Saudara';
  return null;
}

function detectMarital(u: string): string {
  if (u.includes('BELUM KAWIN')) return 'Belum Kawin';
  if (u.includes('CERAI HIDUP')) return 'Cerai Hidup';
  if (u.includes('CERAI MATI')) return 'Cerai Mati';
  if (u.includes('KAWIN')) return 'Kawin';
  return '';
}

function detectOccupation(u: string): string {
  const known = [
    'PELAJAR/MAHASISWA', 'MENGURUS RUMAH TANGGA', 'WIRASWASTA', 'KARYAWAN SWASTA',
    'PEGAWAI NEGERI SIPIL', 'GURU', 'PETANI', 'PEDAGANG', 'BURUH', 'PENSIUNAN',
    'BELUM/TIDAK BEKERJA', 'TIDAK BEKERJA',
  ];
  const hit = known.find((k) => u.includes(k));
  return hit ? titleCase(hit.replace('/', ' / ')) : '';
}

const NIK_RE = /\b\d{16}\b/;
const DATE_RE = /\b\d{2}-\d{2}-\d{4}\b/;

// Ambil alamat dari header KK (Alamat, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos).
// Best-effort: KK berupa teks digital lebih akurat daripada hasil foto/scan.
export function parseKkAddress(text: string): string {
  const t = text.replace(/\s+/g, ' ');
  const grab = (re: RegExp): string => {
    const m = t.match(re);
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  };

  const alamat = grab(/ALAMAT\s*:?\s*(.+?)(?:\s*(?:RT\s*\/?\s*RW|KODE\s*POS|DESA|KELURAHAN|KECAMATAN)\b|$)/i);
  const rtrwM = t.match(/RT\s*\/?\s*RW\s*:?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i);
  const rt = rtrwM ? rtrwM[1].replace(/^0+/, '') || rtrwM[1] : '';
  const rw = rtrwM ? rtrwM[2].replace(/^0+/, '') || rtrwM[2] : '';
  const kel = grab(/(?:DESA\s*\/?\s*KELURAHAN|KELURAHAN|DESA)\s*:?\s*([A-Za-z' .]+?)(?:\s*(?:KECAMATAN|KABUPATEN|KOTA|KODE|PROVINSI)\b|$)/i);
  const kec = grab(/KECAMATAN\s*:?\s*([A-Za-z' .]+?)(?:\s*(?:KABUPATEN|KOTA|KODE|PROVINSI|PROP)\b|$)/i);
  const kota = grab(/(?:KABUPATEN\s*\/?\s*KOTA|KABUPATEN|KOTA)\s*:?\s*([A-Za-z' .]+?)(?:\s*(?:KODE|PROVINSI|PROP|PROVINSI)\b|$)/i);
  const kodepos = grab(/KODE\s*POS\s*:?\s*(\d{5})/i);

  const parts: string[] = [];
  if (alamat) parts.push(titleCase(alamat));
  if (rt && rw) parts.push(`RT ${rt.padStart(2, '0')}/RW ${rw.padStart(2, '0')}`);
  if (kel) parts.push(`Kel. ${titleCase(kel)}`);
  if (kec) parts.push(`Kec. ${titleCase(kec)}`);
  if (kota) parts.push(`${titleCase(kota)}${kodepos ? ` ${kodepos}` : ''}`);
  else if (kodepos) parts.push(kodepos);

  return parts.join(', ');
}

// Data kepala keluarga dari KK (untuk auto-isi pendaftaran warga).
export function parseKkHead(text: string): { name: string; nik: string } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let headName = '';
  for (const line of lines) {
    const m = line.match(
      /NAMA\s+KEPALA\s+KELUARGA\s*:?\s*([A-Z' .]+?)(?:\s{2,}|DESA|KELURAHAN|KECAMATAN|ALAMAT|RT|$)/i,
    );
    if (m) {
      headName = m[1].replace(/\s+/g, ' ').trim();
      break;
    }
  }

  // NIK kepala keluarga: baris anggota (punya NIK + JK/tanggal) yang namanya cocok
  // dengan headName; kalau tak ketemu, pakai baris anggota pertama (KK = kepala di atas).
  let headNik = '';
  let firstNik = '';
  for (const line of lines) {
    const nikM = line.match(/\d{16}/);
    if (!nikM) continue;
    const u = line.toUpperCase();
    if (!/LAKI-LAKI|PEREMPUAN/.test(u) && !DATE_RE.test(u)) continue;
    if (firstNik === '') firstNik = nikM[0];
    const before = line.slice(0, nikM.index).replace(/^\s*\d+[\s.)\-]*/, '');
    const nameM = before.match(/[A-Za-z][A-Za-z'. ]+/);
    const name = nameM ? nameM[0].trim().toUpperCase() : '';
    if (headName && name && name.includes(headName.split(' ')[0].toUpperCase())) {
      headNik = nikM[0];
      break;
    }
  }

  return { name: headName ? titleCase(headName) : '', nik: headNik || firstNik };
}

export function parseKkMembers(text: string): FamilyMemberInput[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // Nama kepala keluarga dari header (untuk menyaringnya dari daftar anggota).
  let headName = '';
  for (const line of lines) {
    const m = line.match(
      /NAMA\s+KEPALA\s+KELUARGA\s*:?\s*([A-Z' .]+?)(?:\s{2,}|DESA|KELURAHAN|KECAMATAN|ALAMAT|RT|$)/i,
    );
    if (m) {
      headName = m[1].replace(/\s+/g, ' ').trim().toUpperCase();
      break;
    }
  }

  // Baris anggota (tabel atas): punya NIK 16 digit DAN (jenis kelamin ATAU tanggal).
  // Syarat ini menyaring Nomor KK (16 digit juga) di header yang tak punya JK/tanggal.
  const memberIdx: number[] = [];
  lines.forEach((line, idx) => {
    if (!NIK_RE.test(line)) return;
    const u = line.toUpperCase();
    if (/LAKI-LAKI|PEREMPUAN/.test(u) || DATE_RE.test(u)) memberIdx.push(idx);
  });

  const members: FamilyMemberInput[] = [];
  const seen = new Set<string>();
  for (const idx of memberIdx) {
    const line = lines[idx];
    const nikM = line.match(/\d{16}/)!;
    const nik = nikM[0];
    if (seen.has(nik)) continue;
    seen.add(nik);

    const u = line.toUpperCase();
    const before = line.slice(0, nikM.index).replace(/^\s*\d+[\s.)\-]*/, '');
    const nameM = before.match(/[A-Za-z][A-Za-z'. ]+/);
    const name = nameM ? titleCase(nameM[0].trim()) : '';

    const gender = u.includes('PEREMPUAN') ? 'Perempuan' : u.includes('LAKI') ? 'Laki-laki' : '';
    const dateM = u.match(DATE_RE);
    const birthDate = dateM ? dateM[0] : '';
    const placeM = u.match(/(?:LAKI-LAKI|PEREMPUAN)\s+([A-Z.' ]+?)\s+\d{2}-\d{2}-\d{4}/);
    const birthPlace = placeM ? titleCase(placeM[1].trim()) : '';
    const religion =
      ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDHA', 'KONGHUCU'].find((r) => u.includes(r)) ?? '';

    members.push({
      name,
      nik,
      gender,
      birthDate,
      birthPlace,
      religion: religion ? titleCase(religion) : '',
      occupation: detectOccupation(u),
      relation: '',
      maritalStatus: '',
    });
  }

  // Tabel bawah (status hubungan) = baris SETELAH baris anggota terakhir, tanpa NIK.
  // Ini menghindari "Nama Kepala Keluarga : ..." di header ikut terhitung.
  const lastNik = memberIdx.length ? memberIdx[memberIdx.length - 1] : -1;
  const bottom: { relation: string; marital: string }[] = [];
  lines.forEach((line, idx) => {
    if (idx <= lastNik || NIK_RE.test(line)) return;
    if (!/^\d/.test(line)) return; // hanya baris tabel (diawali No. urut); buang label footer
    const u = line.toUpperCase();
    const rel = detectRelation(u);
    if (rel) bottom.push({ relation: rel, marital: detectMarital(u) });
  });

  if (bottom.length === members.length) {
    members.forEach((m, i) => {
      m.relation = bottom[i].relation;
      m.maritalStatus = bottom[i].marital;
    });
  }

  const result = members.filter(
    (m) => m.relation !== 'KEPALA' && (headName === '' || m.name.toUpperCase() !== headName),
  );
  for (const m of result) if (!m.relation) m.relation = 'Lainnya';
  return result;
}
