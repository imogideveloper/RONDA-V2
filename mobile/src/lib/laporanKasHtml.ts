// HTML A4 untuk Laporan Keuangan Bulanan RT (dicetak jadi PDF).
import { RtUnit } from '../types/models';
import { formatDate } from './date';

export interface LaporanKasData {
  rt: RtUnit;
  monthLabel: string; // "Mei 2026"
  masuk: number;
  keluar: number;
  saldo: number;
  paid: number;
  total: number;
  ketuaName: string;
  bendaharaName: string;
  signatureUrl?: string | null;
}

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function esc(s: string): string {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

export function buildLaporanKasHtml(d: LaporanKasData): string {
  const { rt } = d;
  const rw = rt.rwNumber ?? '-';
  const kel = rt.kelurahan ?? '-';
  const kec = rt.kecamatan ?? '-';
  const kota = rt.kota ?? '-';
  const pct = d.total > 0 ? Math.round((d.paid / d.total) * 100) : 0;
  const today = formatDate(new Date());
  const green = '#059669';
  const red = '#DC2626';

  const ttd = d.signatureUrl
    ? `<img src="${esc(d.signatureUrl)}" style="height:70px;object-fit:contain" />`
    : `<div style="width:110px;height:70px;border:2px solid ${green};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;color:${green};font-size:10px;font-weight:700;letter-spacing:1px;line-height:1.3">TTD<br/>DIGITAL</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; margin: 0; }
  .page { padding: 42px 52px; }
  .c { text-align: center; }
  .gov { font-size: 15px; font-weight: 700; }
  .sub { font-size: 12px; color: #4b5563; margin-top: 2px; }
  hr { border: none; border-top: 2px solid #111827; margin: 8px 0; }
  hr.thin { border-top: 1px solid #d1d5db; }
  .rt { font-size: 16px; font-weight: 800; margin-top: 6px; }
  .title { font-size: 17px; font-weight: 800; margin-top: 22px; }
  .period { font-size: 12px; color: #6b7280; margin-top: 3px; }
  .info { border-collapse: collapse; margin-top: 20px; font-size: 12px; }
  .info td { padding: 4px 0; vertical-align: top; white-space: nowrap; }
  .info td.k { color: #6b7280; padding-right: 8px; }
  .info td.v { font-weight: 700; padding-right: 44px; }
  table.rep { width: 100%; border-collapse: collapse; margin-top: 22px; font-size: 13px; }
  table.rep th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 12px; }
  table.rep td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
  .amt { font-weight: 700; }
  .barlabel { font-weight: 700; margin-top: 20px; font-size: 13px; }
  .track { height: 16px; background: #e5e7eb; border-radius: 8px; margin-top: 8px; overflow: hidden; }
  .fill { height: 16px; background: ${green}; border-radius: 8px; }
  .note { font-size: 11px; color: #6b7280; margin-top: 6px; }
  .sign { text-align: center; margin-top: 40px; font-size: 12px; color: #374151; }
  .signname { font-weight: 700; margin-top: 6px; text-decoration: underline; }
  .foot { text-align: center; font-size: 10px; color: #9ca3af; margin-top: 48px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
</style></head><body><div class="page">
  <div class="c gov">PEMERINTAH KOTA ${esc(kota.toUpperCase())}</div>
  <div class="c sub">Kecamatan ${esc(kec)} — Kelurahan ${esc(kel)}</div>
  <hr/>
  <div class="c rt">RUKUN TETANGGA ${esc(rt.rtNumber)} — RUKUN WARGA ${esc(rw)}</div>
  <div class="c sub">${esc(kel)}, ${esc(kec)}, ${esc(kota)}</div>
  <hr class="thin"/>

  <div class="c title">LAPORAN KEUANGAN BULANAN</div>
  <div class="c period">Periode: ${esc(d.monthLabel)}</div>

  <table class="info">
    <tr>
      <td class="k">RT/RW:</td><td class="v">${esc(rt.rtNumber)}/${esc(rw)}</td>
      <td class="k">Kelurahan:</td><td class="v">${esc(kel)}</td>
      <td class="k">Kecamatan:</td><td class="v">${esc(kec)}</td>
    </tr>
    <tr>
      <td class="k">Kota:</td><td class="v">${esc(kota)}</td>
      <td class="k">Ketua RT:</td><td class="v">${esc(d.ketuaName)}</td>
      <td class="k">Bendahara:</td><td class="v">${esc(d.bendaharaName || '-')}</td>
    </tr>
  </table>

  <table class="rep">
    <tr><th>Keterangan</th><th>Jumlah (Rp)</th></tr>
    <tr><td>Pemasukan</td><td class="amt" style="color:${green}">${fmt(d.masuk)}</td></tr>
    <tr><td>Pengeluaran</td><td class="amt" style="color:${red}">${fmt(d.keluar)}</td></tr>
    <tr><td><b>Saldo</b></td><td class="amt">${fmt(d.saldo)}</td></tr>
  </table>

  <div class="barlabel">Realisasi Iuran</div>
  <div style="position:relative">
    <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    <div style="position:absolute;right:0;top:-2px;font-weight:800;color:${green};font-size:14px">${pct}%</div>
  </div>
  <div class="note">${d.paid} dari ${d.total} KK telah lunas iuran bulan ini</div>

  <div class="sign">
    ${esc(kota)}, ${esc(today)}<br/>
    Ketua RT ${esc(rt.rtNumber)} RW ${esc(rw)}
    <div style="margin-top:10px">${ttd}</div>
    <div class="signname">${esc(d.ketuaName)}</div>
  </div>

  <div class="foot">Dokumen ini dicetak secara digital oleh RONDA — Sistem Operasi RT | ${esc(today)}</div>
</div></body></html>`;
}
