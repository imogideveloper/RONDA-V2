// HTML A4 untuk Bukti Pembayaran Iuran warga (dicetak jadi PDF).
import { RtUnit } from '../types/models';
import { formatDate } from './date';

export interface IuranReceiptRow {
  periodLabel: string;
  paidDateLabel: string;
  method: string;
  amount: number;
}

export interface IuranReceiptData {
  rt: RtUnit;
  wargaName: string;
  wargaPhone: string;
  rows: IuranReceiptRow[];
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

export function buildIuranReceiptHtml(d: IuranReceiptData): string {
  const { rt } = d;
  const rw = rt.rwNumber ?? '-';
  const kel = rt.kelurahan ?? '-';
  const kec = rt.kecamatan ?? '-';
  const kota = rt.kota ?? '-';
  const today = formatDate(new Date());
  const green = '#059669';
  const noBukti = `IUR/${rt.rtNumber}/${new Date().getFullYear()}/${String(Date.now()).slice(-5)}`;
  const ttdName = d.bendaharaName || d.ketuaName;
  const ttdRole = d.bendaharaName ? 'Bendahara RT' : `Ketua RT ${rt.rtNumber}`;

  const ttd = d.signatureUrl
    ? `<img src="${esc(d.signatureUrl)}" style="height:70px;object-fit:contain" />`
    : `<div style="width:110px;height:70px;border:2px solid ${green};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto;color:${green};font-size:10px;font-weight:700;letter-spacing:1px;line-height:1.3">TTD<br/>DIGITAL</div>`;

  const rows = d.rows
    .map(
      (r) => `<tr>
        <td>${esc(r.periodLabel)}</td>
        <td>${esc(r.paidDateLabel)}</td>
        <td>${esc(r.method)}</td>
        <td class="amt">${fmt(r.amount)}</td>
      </tr>`,
    )
    .join('');

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
  table.rep th.amt, table.rep td.amt { text-align: right; }
  table.rep td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
  table.rep tr.total td { font-weight: 800; border-top: 2px solid #111827; border-bottom: none; }
  .amt { font-weight: 700; }
  .lunas { display:inline-block; margin-top: 16px; padding: 6px 16px; border: 2px solid ${green}; color: ${green}; font-weight: 800; border-radius: 8px; font-size: 13px; letter-spacing: 1px; }
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

  <div class="c title">BUKTI PEMBAYARAN IURAN</div>
  <div class="c period">No. ${esc(noBukti)}</div>

  <table class="info">
    <tr>
      <td class="k">Nama Warga:</td><td class="v">${esc(d.wargaName)}</td>
      <td class="k">No. HP:</td><td class="v">${esc(d.wargaPhone || '-')}</td>
    </tr>
    <tr>
      <td class="k">RT/RW:</td><td class="v">${esc(rt.rtNumber)}/${esc(rw)}</td>
      <td class="k">Jumlah Periode:</td><td class="v">${d.rows.length} bulan</td>
    </tr>
  </table>

  <table class="rep">
    <tr><th>Periode</th><th>Tanggal Bayar</th><th>Metode</th><th class="amt">Jumlah (Rp)</th></tr>
    ${rows}
    <tr class="total"><td colspan="3">TOTAL DIBAYAR</td><td class="amt">${fmt(d.total)}</td></tr>
  </table>

  <div class="c"><span class="lunas">✓ LUNAS</span></div>

  <div class="sign">
    ${esc(kota)}, ${esc(today)}<br/>
    ${esc(ttdRole)}
    <div style="margin-top:10px">${ttd}</div>
    <div class="signname">${esc(ttdName)}</div>
  </div>

  <div class="foot">Dokumen ini dicetak secara digital oleh RONDA — Sistem Operasi RT | ${esc(today)}</div>
</div></body></html>`;
}
