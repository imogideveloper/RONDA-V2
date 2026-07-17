// Template PDF "Data Warga RT" + parser PDF -> baris warga (untuk impor via PDF).
// Impor PDF hanya andal bila PDF berupa teks digital (bukan hasil foto/scan).

export interface WargaImportRow {
  full_name: string;
  phone: string;
  email: string;
  blok_rumah: string;
}

function esc(s: string): string {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

// Contoh baris untuk template (ikut terbaca bila di-upload balik).
const CONTOH: WargaImportRow[] = [
  { full_name: 'Budi Santoso', phone: '081234567890', email: 'budi@email.com', blok_rumah: 'Blok A No 1' },
  { full_name: 'Siti Rahayu', phone: '081987654321', email: 'siti@email.com', blok_rumah: 'Blok B No 2' },
];

// `warga` = data warga terdaftar (bila ada). Kosong -> pakai contoh.
export function buildWargaTemplateHtml(warga: WargaImportRow[] = []): string {
  const data = warga.length > 0 ? warga : CONTOH;
  const rows = data.map(
    (r, i) => `<tr>
      <td class="c">${i + 1}</td>
      <td>${esc(r.full_name)}</td>
      <td>${esc(r.phone)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.blok_rumah)}</td>
    </tr>`,
  ).join('');
  // Beberapa baris kosong bernomor agar mudah menambah warga baru.
  const blanks = Array.from({ length: 8 }, (_, i) => `<tr class="blank"><td class="c">${data.length + i + 1}</td><td></td><td></td><td></td><td></td></tr>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; }
  .page { padding: 40px 44px; }
  .c { text-align: center; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #6b7280; margin-bottom: 16px; }
  .note { font-size: 11px; color: #374151; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 10px 12px; margin-bottom: 16px; line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #059669; color: #fff; padding: 8px 10px; text-align: left; }
  td { border: 1px solid #d1d5db; padding: 8px 10px; }
  tr.blank td { height: 26px; }
  .foot { font-size: 10px; color: #9ca3af; margin-top: 16px; }
</style></head><body><div class="page">
  <div class="c"><h1>DATA WARGA RT</h1></div>
  <div class="c sub">Formulir Pendataan Kepala Keluarga</div>
  <div class="note">
    <b>Cara isi:</b> ketik data warga pada tabel di bawah (Nama, Nomor HP, Email, Blok/Rumah) memakai editor PDF /
    aplikasi pengolah dokumen, lalu simpan sebagai PDF.<br/>
    <b>Impor:</b> di app → Data Warga → menu → <b>Import data warga (PDF)</b> → pilih file ini.
    Pastikan tiap baris memuat <b>Nomor HP</b> (mis. 08xxxxxxxxxx) agar terbaca.
  </div>
  <table>
    <tr><th class="c" style="width:8%">No</th><th style="width:34%">Nama Lengkap</th><th style="width:22%">Nomor HP</th><th style="width:22%">Email</th><th style="width:14%">Blok/Rumah</th></tr>
    ${rows}
    ${blanks}
  </table>
  <div class="foot">Template dihasilkan oleh RONDA — Sistem Operasi RT.</div>
</div></body></html>`;
}

// Parse teks hasil ekstraksi PDF (per baris) menjadi baris warga.
// Strategi: tiap baris yang memuat NOMOR HP dianggap 1 warga.
const PHONE_RE = /(\+?62|0)\d{8,13}/;
const EMAIL_RE = /[^\s]+@[^\s]+\.[^\s]+/;

export function parseWargaFromPdfText(text: string): WargaImportRow[] {
  const out: WargaImportRow[] = [];
  const seen = new Set<string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const pm = line.match(PHONE_RE);
    if (!pm || pm.index == null) continue; // baris tanpa HP (header/judul) → lewati
    const phone = pm[0];
    const before = line.slice(0, pm.index).trim();
    const after = line.slice(pm.index + phone.length).trim();
    // Nama: buang penomoran depan ("1." / "1)" / "1 ")
    const name = before.replace(/^\d+[.)]?\s*/, '').trim();
    if (name.length < 2) continue; // kemungkinan bukan baris data
    const em = after.match(EMAIL_RE);
    const email = em ? em[0] : '';
    const blok = (email ? after.replace(email, '') : after).replace(/[|;,]+/g, ' ').trim();
    const key = phone.replace(/\D/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ full_name: name, phone, email, blok_rumah: blok });
  }
  return out;
}
