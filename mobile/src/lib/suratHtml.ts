// Bangun HTML surat (untuk ekspor PDF via expo-print / print browser).
import { SuratLetterData } from '../components/warga/SuratLetterPreview';
import { buildSuratDraft } from './suratDraft';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const tanggalIndo = (d: Date) => `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const BLANK = '________________';

export function buildSuratHtml(data: SuratLetterData, opts?: { showSignature?: boolean }): string {
  const { rt } = data;
  const showSignature = opts?.showSignature ?? true;
  const draft = buildSuratDraft({
    suratType: data.suratType,
    wargaName: data.wargaName,
    purpose: data.purpose,
    rtNumber: rt.rtNumber,
    rwNumber: rt.rwNumber,
    rtName: rt.name,
    address: rt.address ?? '-',
    ketuaName: data.ketuaName,
    kelurahan: rt.kelurahan,
    kecamatan: rt.kecamatan,
    kota: rt.kota,
  });

  const orBlank = (s?: string | null) => (s && s.trim() !== '' ? esc(s.trim()) : BLANK);
  const ttl =
    (data.birthPlace && data.birthPlace.trim() !== '') || (data.birthDate && data.birthDate.trim() !== '')
      ? `${esc(data.birthPlace?.trim() || '-')}, ${esc(data.birthDate?.trim() || '-')}`
      : BLANK;
  const alamat = esc(rt.address ?? '-');
  const kotaLoc = [rt.kelurahan, rt.kecamatan, rt.kota]
    .filter((x): x is string => !!x && x.trim() !== '')
    .map(esc)
    .join(', ');
  const tanggalKota = rt.kota && rt.kota.trim() !== '' ? `${esc(rt.kota.trim())}, ${tanggalIndo(new Date())}` : tanggalIndo(new Date());

  const kop = rt.kopSuratUrl
    ? `<div style="text-align:center"><img src="${esc(rt.kopSuratUrl)}" style="max-height:90px;max-width:100%"/></div>`
    : `<div style="text-align:center">
         <div style="font-size:17px;font-weight:700">RUKUN TETANGGA ${esc(rt.rtNumber)} — RUKUN WARGA ${esc(rt.rwNumber ?? '-')}</div>
         <div style="font-size:12px">${kotaLoc !== '' ? kotaLoc : alamat}</div>
       </div>`;

  const row = (label: string, value: string) =>
    `<tr><td style="width:150px;vertical-align:top">${label}</td><td style="width:10px;vertical-align:top">:</td><td>${value}</td></tr>`;

  const sig = showSignature && rt.signatureUrl
    ? `<img src="${esc(rt.signatureUrl)}" style="height:66px"/>`
    : `<div style="height:56px"></div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
    <style>
      @page { size: A4; margin: 22mm 20mm; }
      body { font-family: 'Times New Roman', Georgia, serif; color:#111; font-size:12pt; line-height:1.5; }
      p { text-align: justify; margin: 0 0 10px; }
      table { border-collapse: collapse; }
      td { font-size: 12pt; padding: 1px 0; }
    </style></head><body>
    ${kop}
    <hr style="border:none;border-top:2px solid #111;margin:8px 0 16px"/>
    <div style="text-align:center;font-weight:700;text-decoration:underline;font-size:13pt">${esc(draft.heading)}</div>
    <div style="text-align:center;font-size:11pt;margin:2px 0 16px">Nomor: ${esc(draft.nomor)}</div>
    <p>${esc(draft.pembuka)}</p>
    <table style="margin:0 0 12px 8px">
      ${row('Nama', esc(data.wargaName))}
      ${row('NIK', orBlank(data.nik))}
      ${row('Tempat/Tgl Lahir', ttl)}
      ${row('Jenis Kelamin', orBlank(data.gender))}
      ${row('Agama', orBlank(data.religion))}
      ${row('Status', orBlank(data.maritalStatus))}
      ${row('Pekerjaan', orBlank(data.occupation))}
      ${row('Alamat', alamat)}
    </table>
    ${draft.isi.map((p) => `<p>${esc(p)}</p>`).join('')}
    <p>${esc(draft.penutup)}</p>
    <div style="margin-top:24px;width:230px;margin-left:auto;text-align:center">
      <div>${esc(tanggalKota)}</div>
      <div>Ketua RT ${esc(rt.rtNumber)} RW ${esc(rt.rwNumber ?? '-')}</div>
      <div style="margin:2px 0">${sig}</div>
      <div style="font-weight:700;text-decoration:underline">( ${data.ketuaName ? esc(data.ketuaName) : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'} )</div>
    </div>
    </body></html>`;
}
