// HTML A4 (multi-halaman) Laporan Keuangan Bulanan RT — gaya editorial:
// serif untuk judul/nama, monospace untuk angka & label, seksi berlabel A–I.
import { RtUnit } from '../types/models';
import { formatDate } from './date';

export interface LaporanLine {
  no: number;
  keterangan: string;
  sub?: string; // "PERIODE IURAN" (mis. April 2026)
  tgl?: string; // tanggal terima / transaksi
  amount: number;
}
export interface LaporanKk {
  no: number;
  name: string;
  amount: number;
}

export interface LaporanKasData {
  rt: RtUnit;
  monthLabel: string; // "Mei 2026"
  saldoAwal: number;
  totalMasuk: number;
  totalKeluar: number;
  saldoAkhir: number;
  iuranPeriodIni: LaporanLine[];
  iuranPeriodeLain: LaporanLine[];
  totalIuranPeriodeLain: number;
  pemasukanLain: LaporanLine[];
  totalPemasukanLain: number;
  pengeluaran: LaporanLine[];
  totalPengeluaran: number;
  targetIuran: number;
  realisasiIuran: number;
  lunasCount: number;
  belumCount: number;
  kkBelum: LaporanKk[];
  iuranJenis: string[];
  totalTunggakan: number;
  reconPaidPeriode: number;
  reconKasIuran: number;
  selisih: number;
  ketuaName: string;
  bendaharaName: string;
  phone?: string | null;
}

const INK = '#1F1D1A';
const MUTE = '#8A8272';
const LINE = '#DED8CC';
const CREAM = '#F4F1EA';
const RED = '#B0322F';
const AMBER = '#A67C2E';

function fmt(n: number): string {
  return Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function rp(n: number): string {
  return `Rp ${n < 0 ? '-' : ''}${fmt(n)}`;
}
function esc(s: string): string {
  return String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

function sectionHead(letter: string, title: string, accent = false): string {
  return `<div class="sec">
    <span class="letter${accent ? ' letter-a' : ''}">${letter}</span>
    <span class="sectitle${accent ? ' t-amber' : ''}">${esc(title)}</span>
  </div><div class="secrule"></div>`;
}

function emptyBox(text: string): string {
  return `<div class="empty">${esc(text)}</div>`;
}

// Tabel detail: NO | KETERANGAN | (PERIODE) | JUMLAH | (TGL)
function detailTable(
  lines: LaporanLine[],
  o: { midHead?: string; dateHead?: string; emptyText: string; totalLabel?: string; total?: number },
): string {
  if (lines.length === 0) return emptyBox(o.emptyText);
  const hasMid = !!o.midHead;
  const hasDate = !!o.dateHead;
  const head =
    `<tr><th class="cno">NO</th><th>KETERANGAN</th>` +
    (hasMid ? `<th class="cmid">${esc(o.midHead!)}</th>` : '') +
    `<th class="camt">JUMLAH</th>` +
    (hasDate ? `<th class="cdate">${esc(o.dateHead!)}</th>` : '') +
    `</tr>`;
  const body = lines
    .map(
      (l) =>
        `<tr><td class="cno">${String(l.no).padStart(2, '0')}</td>` +
        `<td class="cket">${esc(l.keterangan)}</td>` +
        (hasMid ? `<td class="cmid">${esc(l.sub ?? '-')}</td>` : '') +
        `<td class="camt">${rp(l.amount)}</td>` +
        (hasDate ? `<td class="cdate">${esc(l.tgl ?? '-')}</td>` : '') +
        `</tr>`,
    )
    .join('');
  const span = 2 + (hasMid ? 1 : 0);
  const total =
    o.totalLabel != null && o.total != null
      ? `<tr class="tot"><td colspan="${span}">${esc(o.totalLabel)}</td><td class="camt">${rp(o.total)}</td>${hasDate ? '<td></td>' : ''}</tr>`
      : '';
  return `<table class="tbl">${head}${body}${total}</table>`;
}

export function buildLaporanKasHtml(d: LaporanKasData): string {
  const { rt } = d;
  const rw = rt.rwNumber ?? '-';
  const rtLine = `RT ${esc(rt.rtNumber)} / RW ${esc(rw)}`;
  const seal = `RT${esc(rt.rtNumber)}<br/>RW${esc(rw)}`;
  const today = formatDate(new Date());
  const pct = d.targetIuran > 0 ? Math.round((d.realisasiIuran / d.targetIuran) * 100) : 0;
  const locFoot = [
    rt.kelurahan ? `Kelurahan ${esc(rt.kelurahan)}` : '',
    rt.kecamatan ? `Kecamatan ${esc(rt.kecamatan)}` : '',
    rt.kota ? `Kota ${esc(rt.kota)}` : '',
  ]
    .filter(Boolean)
    .join(' &middot; ');

  const jenisChips =
    d.iuranJenis.length > 0
      ? d.iuranJenis.map((j) => `<span class="chip">${esc(j)}</span>`).join(' ')
      : `<span class="chip">Iuran Bulanan</span>`;

  const kkTable =
    d.kkBelum.length === 0
      ? emptyBox('Semua KK sudah lunas iuran periode ini.')
      : `<table class="tbl">
          <tr><th class="cno">NO</th><th>NAMA KK</th><th class="cjenis">JENIS IURAN BELUM BAYAR</th><th class="camt">TOTAL TUNGGAKAN</th></tr>
          ${d.kkBelum
            .map(
              (k) =>
                `<tr><td class="cno">${String(k.no).padStart(2, '0')}</td>` +
                `<td class="cket">${esc(k.name)}</td>` +
                `<td class="cjenis">${jenisChips}</td>` +
                `<td class="camt red">${rp(k.amount)}</td></tr>`,
            )
            .join('')}
          <tr class="tot"><td colspan="3">Total Tunggakan</td><td class="camt">${rp(d.totalTunggakan)}</td></tr>
        </table>`;

  return `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #fff; color: ${INK};
         font-family: Georgia, 'Times New Roman', Times, serif; }
  .page { padding: 32px 38px 0; font-size: 12px; }
  .mono { font-family: 'Courier New', Courier, monospace; }

  /* ── Kop ── */
  .head { display: flex; align-items: flex-start; justify-content: space-between; }
  .hleft { display: flex; align-items: flex-start; gap: 14px; }
  .seal { width: 56px; height: 56px; border-radius: 50%; border: 1.5px solid ${INK};
          display: flex; align-items: center; justify-content: center; text-align: center;
          font-family: 'Courier New', monospace; font-size: 9px; line-height: 1.25; letter-spacing: 0.5px; }
  .htitle { font-size: 21px; font-weight: 700; letter-spacing: -0.2px; }
  .hrt { font-size: 17px; font-weight: 700; margin-top: 1px; }
  .haddr { font-size: 11px; font-style: italic; color: #55504A; margin-top: 3px; line-height: 1.45; }
  .hright { text-align: right; }
  .badge { display: inline-block; background: ${INK}; color: #fff; font-family: 'Courier New', monospace;
           font-size: 11px; font-weight: 700; letter-spacing: 1.5px; padding: 5px 12px; }
  .hmeta { font-family: 'Courier New', monospace; font-size: 10px; color: ${MUTE};
           margin-top: 10px; line-height: 1.5; }
  .hmeta b { color: ${INK}; font-weight: 700; }
  .rule { border-top: 3px solid ${INK}; margin: 14px 0 4px; }

  /* ── Seksi ── */
  .sec { display: flex; align-items: center; gap: 10px; margin-top: 22px; }
  .letter { width: 20px; height: 18px; background: ${CREAM}; border: 1px solid ${LINE};
            font-family: 'Courier New', monospace; font-size: 10px; color: ${MUTE};
            display: flex; align-items: center; justify-content: center; }
  .letter-a { border-color: #E4D5B4; background: #FBF3E2; color: ${AMBER}; }
  .sectitle { font-size: 14px; font-weight: 700; }
  .t-amber { color: ${AMBER}; }
  .secrule { border-top: 1px solid ${LINE}; margin-top: 7px; }
  .note { font-size: 10.5px; font-style: italic; color: ${MUTE}; margin-top: 7px; }

  /* ── A: Ringkasan ── */
  table.sum { width: 100%; border-collapse: collapse; margin-top: 12px; border: 1px solid ${LINE}; }
  table.sum td { width: 25%; padding: 12px 14px; border-right: 1px solid ${LINE}; vertical-align: top; }
  table.sum td:last-child { border-right: none; background: ${CREAM}; }
  .slabel { font-family: 'Courier New', monospace; font-size: 9px; color: ${MUTE};
            letter-spacing: 1px; text-transform: uppercase; }
  .sval { font-size: 16px; font-weight: 700; margin-top: 7px; }

  /* ── Tabel ── */
  table.tbl { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.tbl th { background: ${CREAM}; border-top: 1px solid ${LINE}; border-bottom: 1px solid ${LINE};
                 font-family: 'Courier New', monospace; font-weight: 400; font-size: 9px; color: ${MUTE};
                 letter-spacing: 1px; text-align: left; padding: 9px 10px; text-transform: uppercase; }
  table.tbl td { padding: 10px; border-bottom: 1px solid #EFEAE1; font-size: 12px; vertical-align: top; }
  .cno { width: 34px; font-family: 'Courier New', monospace; font-size: 10px; color: ${MUTE}; }
  .cket { font-weight: 700; }
  .cmid { width: 120px; }
  .cjenis { width: 250px; }
  .camt { width: 130px; text-align: right; white-space: nowrap;
          font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; }
  th.camt, th.cdate { text-align: right; }
  .cdate { width: 88px; text-align: right; font-family: 'Courier New', monospace; font-size: 10px; }
  .red { color: ${RED}; }
  tr.tot td { background: ${INK}; color: #fff; border-bottom: none;
              font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }
  tr.tot td.camt { color: #fff; }
  .chip { display: inline-block; border: 1px solid ${LINE}; background: #fff; color: #55504A;
          font-family: 'Courier New', monospace; font-size: 9px; padding: 3px 7px; margin: 1px 3px 1px 0; white-space: nowrap; }
  .empty { border: 1px solid ${LINE}; background: ${CREAM}; text-align: center; font-style: italic;
           color: ${MUTE}; font-size: 11.5px; padding: 22px 12px; margin-top: 12px; }

  /* ── F: Status iuran ── */
  table.st { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.st td { width: 50%; border: 1px solid ${LINE}; padding: 13px 15px; vertical-align: top; }
  table.st td.hl { border-color: #E7BDBB; background: #FDF4F3; }
  .stval { font-size: 17px; font-weight: 700; margin-top: 6px; }
  .barbox { border: 1px solid ${LINE}; padding: 12px 15px; margin-top: 10px; }
  .barrow { display: flex; align-items: center; justify-content: space-between;
            font-family: 'Courier New', monospace; font-size: 10.5px; color: #55504A; }
  .track { height: 5px; background: #EFEAE1; margin: 9px 0 8px; }
  .fill { height: 5px; background: ${INK}; }

  /* ── H: Rekonsiliasi ── */
  .quote { border: 1px solid ${LINE}; background: ${CREAM}; padding: 14px 16px; margin-top: 12px; }
  .quote p { margin: 0; font-size: 11.5px; font-style: italic; line-height: 1.6; border-left: 2px solid ${LINE}; padding-left: 12px; }
  table.rec { width: 100%; border-collapse: collapse; margin-top: 12px; }
  table.rec td { padding: 10px 2px; border-bottom: 1px solid #EFEAE1; font-size: 12px; }
  table.rec td.v { text-align: right; white-space: nowrap; font-family: 'Courier New', monospace; font-size: 11px; font-weight: 700; }
  table.rec tr.sel td { font-weight: 700; border-bottom: 1px solid ${LINE}; }
  .explain { color: ${RED}; font-size: 11.5px; font-weight: 700; line-height: 1.6; margin-top: 12px; }

  /* ── I: TTD ── */
  table.sign { width: 100%; border-collapse: collapse; margin-top: 26px; }
  table.sign td { width: 50%; padding-right: 40px; vertical-align: bottom; }
  .srole { font-family: 'Courier New', monospace; font-size: 9.5px; color: ${MUTE}; letter-spacing: 1.5px; }
  .sspace { height: 62px; }
  .sline { border-top: 1px solid ${INK}; }
  .sname { font-size: 13px; font-weight: 700; margin-top: 8px; }

  .foot { display: flex; justify-content: space-between; background: ${CREAM}; border-top: 1px solid ${LINE};
          margin: 30px -38px 0; padding: 14px 38px; font-family: 'Courier New', monospace;
          font-size: 9.5px; color: ${MUTE}; }
</style></head><body><div class="page">

  <div class="head">
    <div class="hleft">
      <div class="seal">${seal}</div>
      <div>
        <div class="htitle">Laporan Keuangan</div>
        <div class="hrt">${rtLine}</div>
        ${rt.address ? `<div class="haddr">${esc(rt.address)}</div>` : ''}
        <div class="haddr">${[rt.kecamatan ? `Kecamatan ${esc(rt.kecamatan)}` : '', rt.kota ? `Kota ${esc(rt.kota)}` : ''].filter(Boolean).join(', ')}</div>
        ${d.phone ? `<div class="haddr">Telp: ${esc(d.phone)}</div>` : ''}
      </div>
    </div>
    <div class="hright">
      <div class="badge">${esc(d.monthLabel.toUpperCase())}</div>
      <div class="hmeta">Tanggal cetak<br/><b>${esc(today)}</b></div>
      <div class="hmeta">Tutup Buku<br/>Otomatis per akhir bulan</div>
    </div>
  </div>
  <div class="rule"></div>

  ${sectionHead('A', 'Ringkasan Keuangan')}
  <table class="sum"><tr>
    <td><div class="slabel">Saldo Awal</div><div class="sval">${rp(d.saldoAwal)}</div></td>
    <td><div class="slabel">Total Pemasukan</div><div class="sval">${rp(d.totalMasuk)}</div></td>
    <td><div class="slabel">Total Pengeluaran</div><div class="sval">${rp(d.totalKeluar)}</div></td>
    <td><div class="slabel">Saldo Akhir</div><div class="sval">${rp(d.saldoAkhir)}</div></td>
  </tr></table>
  <div class="note">* Dihitung berdasarkan buku kas (transaksi yang tercatat masuk/keluar).</div>

  ${sectionHead('B', 'Detail Pemasukan — Iuran Warga')}
  ${detailTable(d.iuranPeriodIni, {
    dateHead: 'TGL TERIMA',
    emptyText: 'Tidak ada iuran yang dibayar pada periode ini.',
    totalLabel: d.iuranPeriodIni.length ? 'Total Iuran Periode Ini' : undefined,
    total: d.iuranPeriodIni.length ? d.iuranPeriodIni.reduce((s, l) => s + l.amount, 0) : undefined,
  })}

  ${sectionHead('C', 'Pemasukan Iuran Dari Periode Lain', true)}
  <div class="note">* Iuran ini ditagihkan untuk bulan lain, tetapi uangnya diterima di bulan ini (cash basis).</div>
  ${detailTable(d.iuranPeriodeLain, {
    midHead: 'PERIODE IURAN',
    dateHead: 'TGL TERIMA',
    emptyText: 'Tidak ada pemasukan iuran dari periode lain.',
    totalLabel: d.iuranPeriodeLain.length ? 'Total Iuran Periode Lain' : undefined,
    total: d.iuranPeriodeLain.length ? d.totalIuranPeriodeLain : undefined,
  })}

  ${sectionHead('D', 'Detail Pemasukan — Lain-lain')}
  ${detailTable(d.pemasukanLain, {
    dateHead: 'TGL',
    emptyText: 'Tidak ada pemasukan lain pada periode ini.',
    totalLabel: d.pemasukanLain.length ? 'Total Pemasukan Lain-lain' : undefined,
    total: d.pemasukanLain.length ? d.totalPemasukanLain : undefined,
  })}

  ${sectionHead('E', 'Detail Pengeluaran')}
  ${detailTable(d.pengeluaran, {
    dateHead: 'TGL',
    emptyText: 'Tidak ada pengeluaran pada periode ini.',
    totalLabel: d.pengeluaran.length ? 'Total Pengeluaran' : undefined,
    total: d.pengeluaran.length ? d.totalPengeluaran : undefined,
  })}

  ${sectionHead('F', 'Status Iuran')}
  <table class="st"><tr>
    <td><div class="slabel">Target Iuran (Semua Item)</div><div class="stval">${rp(d.targetIuran)}</div></td>
    <td class="hl"><div class="slabel">Realisasi (Paid Only)</div><div class="stval red">${rp(d.realisasiIuran)}</div></td>
  </tr></table>
  <div class="barbox">
    <div class="barrow"><span>Persentase Realisasi Iuran</span><span class="red" style="font-weight:700">${pct}%</span></div>
    <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    <div class="barrow"><span>KK Lunas: ${d.lunasCount}</span><span>KK Belum Bayar: ${d.belumCount}</span></div>
  </div>

  ${sectionHead('G', 'Daftar KK Belum Bayar')}
  ${kkTable}

  ${sectionHead('H', 'Catatan Rekonsiliasi')}
  <div class="quote">
    <p>Rekonsiliasi menyilangkan dua sumber data: data iuran (status pembayaran per KK) vs buku kas (transaksi yang tercatat).
    Sistem menggunakan <b>CASH BASIS</b> — kas dicatat saat uang diterima (tanggal approve), bukan saat tagihan diterbitkan.
    Jika iuran bulan ini dibayar di bulan lain, transaksi kas akan muncul di bulan pembayaran, bukan bulan tagihan.</p>
  </div>
  <div class="quote" style="margin-top:10px">
    <p><b>TUTUP BUKU</b>: Status iuran dihitung berdasarkan posisi akhir bulan. Pembayaran setelah akhir bulan tidak mengubah laporan periode tersebut.</p>
  </div>
  <table class="rec">
    <tr><td>Total iuran "Paid" periode ini (data iuran per KK)</td><td class="v">${rp(d.reconPaidPeriode)}</td></tr>
    <tr><td>Total pemasukan "Iuran Warga" di buku kas periode ini</td><td class="v">${rp(d.reconKasIuran)}</td></tr>
    <tr class="sel"><td>Selisih</td><td class="v">${rp(d.selisih)}</td></tr>
  </table>
  ${
    d.totalIuranPeriodeLain > 0
      ? `<div class="explain">Penjelasan: Terdapat pemasukan kas "Iuran Warga" sebesar ${rp(d.totalIuranPeriodeLain)} yang merupakan pembayaran iuran bulan lain yang diverifikasi di bulan ini (cash basis). Detail transaksi dari periode lain: Cek Huruf C. Pemasukan Iuran Dari Periode Lain.</div>`
      : ''
  }

  ${sectionHead('I', 'Tanda Tangan')}
  <table class="sign"><tr>
    <td>
      <div class="srole">BENDAHARA RT</div>
      <div class="sspace"></div>
      <div class="sline"></div>
      <div class="sname">${esc(d.bendaharaName || '-')}</div>
    </td>
    <td>
      <div class="srole">KETUA RT</div>
      <div class="sspace"></div>
      <div class="sline"></div>
      <div class="sname">${esc(d.ketuaName || '-')}</div>
    </td>
  </tr></table>

  <div class="foot"><span>${rtLine} &middot; ${locFoot}</span><span>Dicetak ${esc(today)}</span></div>
</div></body></html>`;
}
