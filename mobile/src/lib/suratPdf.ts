// Ekspor surat ke PDF.
// Web: unduh langsung via html2pdf.js (fallback ke jendela cetak bila gagal).
// Native: expo-print -> file PDF -> bagikan/simpan.
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SuratLetterData } from '../components/warga/SuratLetterPreview';
import { buildSuratHtml } from './suratHtml';

const HTML2CANVAS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

// Muat script CDN sekali; resolve nilai global bila sudah ada.
function loadScript(src: string, globalKey: string): Promise<any> {
  const w = globalThis as any;
  if (w[globalKey]) return Promise.resolve(w[globalKey]);
  return new Promise((resolve, reject) => {
    const doc = w.document;
    if (!doc) {
      reject(new Error('Unduh PDF hanya tersedia di web.'));
      return;
    }
    const s = doc.createElement('script');
    s.src = src;
    s.onload = () => (w[globalKey] ? resolve(w[globalKey]) : reject(new Error(`${globalKey} gagal dimuat.`)));
    s.onerror = () => reject(new Error('Tidak bisa memuat pembuat PDF (butuh internet).'));
    doc.body.appendChild(s);
  });
}

const loadHtml2Canvas = () => loadScript(HTML2CANVAS_CDN, 'html2canvas');
async function loadJsPDF(): Promise<any> {
  await loadScript(JSPDF_CDN, 'jspdf');
  return (globalThis as any).jspdf.jsPDF;
}

// Ubah <img src="http..."> jadi data URI supaya html2canvas tak kena CORS.
async function inlineImages(html: string): Promise<string> {
  const urls = new Set<string>();
  const re = /<img[^>]+src="(https?:\/\/[^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) urls.add(m[1]);
  let out = html;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const dataUrl: string = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.onerror = () => reject(new Error('read fail'));
        fr.readAsDataURL(blob);
      });
      out = out.split(url).join(dataUrl);
    } catch {
      // biarkan URL asli; html2canvas coba useCORS.
    }
  }
  return out;
}

// Unduh langsung sebagai file PDF di web (tanpa dialog cetak).
// Render HTML penuh di dalam IFRAME (styling pasti benar), lalu capture via html2canvas + jsPDF.
async function downloadPdfWeb(html: string, filename: string): Promise<void> {
  const w = globalThis as any;
  const doc = w.document;
  const [html2canvas, JsPDF] = await Promise.all([loadHtml2Canvas(), loadJsPDF()]);
  const processed = await inlineImages(html);

  const iframe = doc.createElement('iframe');
  // Di luar layar (tetap punya ukuran → konten iframe ter-render internal).
  // html2canvas menangkap elemen .page DI DALAM iframe, jadi tak perlu terlihat.
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: '794px', // ~A4 pada 96dpi
    height: '1123px',
    border: '0',
    background: '#ffffff',
  });
  doc.body.appendChild(iframe);
  const idoc = iframe.contentWindow.document;
  idoc.open();
  idoc.write(processed);
  idoc.close();

  // Tunggu sampai konten BENAR-BENAR ter-layout (deterministik, hindari race).
  await new Promise<void>((resolve) => {
    const start = Date.now();
    const check = () => {
      const ready = idoc.readyState === 'complete';
      const page = idoc.querySelector('.page') as any;
      const hasSize = page && page.offsetHeight > 50;
      if ((ready && hasSize) || Date.now() - start > 4000) resolve();
      else setTimeout(check, 100);
    };
    check();
  });
  // Tunggu font siap (bila didukung).
  try {
    await (idoc as any).fonts?.ready;
  } catch {
    // abaikan
  }
  // Tunggu semua gambar (kop/TTD) selesai load.
  const imgs = Array.from(idoc.querySelectorAll('img')) as any[];
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          }),
    ),
  );
  // Jeda pengendapan agar render benar-benar selesai.
  await new Promise((r) => setTimeout(r, 400));

  const safe = filename.replace(/[^\w.-]+/g, '_') || 'dokumen.pdf';
  try {
    const target = idoc.querySelector('.page') || idoc.body;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: 794,
      width: 794,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = 210;
    const pageH = 297;
    const marginX = 10; // napas kiri-kanan (mm)
    // Muat SELURUH surat dalam SATU halaman A4 (contain), diberi margin & dipusatkan.
    let renderW = pageW - marginX * 2;
    let renderH = (canvas.height * renderW) / canvas.width;
    if (renderH > pageH) {
      renderH = pageH;
      renderW = (canvas.width * renderH) / canvas.height;
    }
    const offsetX = (pageW - renderW) / 2;
    pdf.addImage(imgData, 'JPEG', offsetX, 0, renderW, renderH);
    pdf.save(safe);
  } finally {
    try {
      doc.body.removeChild(iframe);
    } catch {
      // ignore
    }
  }
}

// Cetak HTML di web via iframe tersembunyi (hanya isi surat, bukan halaman app).
function printHtmlWeb(html: string): Promise<void> {
  return new Promise((resolve) => {
    const doc: any = (globalThis as any).document;
    if (!doc) {
      resolve();
      return;
    }
    const iframe = doc.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed',
      right: '0',
      bottom: '0',
      width: '0',
      height: '0',
      border: '0',
    });
    doc.body.appendChild(iframe);
    const idoc = iframe.contentWindow.document;
    idoc.open();
    idoc.write(html);
    idoc.close();

    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch {
        // ignore
      }
      setTimeout(() => {
        try {
          doc.body.removeChild(iframe);
        } catch {
          // ignore
        }
        resolve();
      }, 1000);
    };

    // Tunggu load (termasuk gambar kop/ttd) + jeda kecil; ada fallback bila onload tak terpicu.
    iframe.onload = () => setTimeout(run, 500);
    setTimeout(run, 1800);
  });
}

/** Unduh/cetak HTML A4 apa pun sebagai PDF (web: unduh langsung; native: file + share). */
export async function exportHtmlAsPdf(
  html: string,
  dialogTitle = 'Simpan / Bagikan',
  filename = 'dokumen.pdf',
): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      await downloadPdfWeb(html, filename);
    } catch {
      // Gagal (mis. tanpa internet / CDN diblok) → pakai dialog cetak browser.
      await printHtmlWeb(html);
    }
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle });
  }
}

export async function exportSuratPdf(
  data: SuratLetterData,
  opts?: { showSignature?: boolean },
): Promise<void> {
  const fname = `${(data.suratType || 'Surat').trim()}.pdf`;
  await exportHtmlAsPdf(buildSuratHtml(data, opts), 'Simpan / Bagikan Surat', fname);
}
