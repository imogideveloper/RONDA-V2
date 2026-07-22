// Ekstraksi teks dari PDF (untuk baca alamat dari PDF di Pengaturan RT).
// Web: memuat pdf.js dari CDN saat dibutuhkan (butuh internet), tanpa menambah bundle.
// Native: belum didukung.
import { Platform } from 'react-native';

const PDFJS_VERSION = '3.11.174';
const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}`;

export function loadPdfJsWeb(): Promise<any> {
  const w = globalThis as any;
  if (w.pdfjsLib) return Promise.resolve(w.pdfjsLib);
  return new Promise((resolve, reject) => {
    const doc = w.document;
    if (!doc) {
      reject(new Error('Baca PDF hanya tersedia di web.'));
      return;
    }
    const s = doc.createElement('script');
    s.src = `${PDFJS_CDN}/pdf.min.js`;
    s.onload = () => {
      const lib = w.pdfjsLib;
      if (!lib) {
        reject(new Error('pdf.js gagal dimuat.'));
        return;
      }
      lib.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
      resolve(lib);
    };
    s.onerror = () => reject(new Error('Tidak bisa memuat pembaca PDF (butuh koneksi internet).'));
    doc.body.appendChild(s);
  });
}

/** Ambil seluruh teks dari sebuah file PDF (dirapikan jadi satu baris). */
export async function extractPdfText(uri: string): Promise<string> {
  if (Platform.OS !== 'web') {
    throw new Error('Baca PDF baru tersedia di versi web.');
  }
  const lib = await loadPdfJsWeb();
  const buf = await (await fetch(uri)).arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  let out = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => (it && typeof it.str === 'string' ? it.str : '')).join(' ') + ' ';
  }
  return out.replace(/\s+/g, ' ').trim();
}

/**
 * Render semua halaman PDF jadi gambar PNG (data URL) memakai pdf.js.
 * Dipakai untuk PREVIEW dokumen di dalam app, menghindari iframe/blob yang
 * diblokir Chrome. Hanya web.
 */
export async function renderPdfToImages(uri: string, maxPages = 3): Promise<string[]> {
  if (Platform.OS !== 'web') {
    throw new Error('Preview PDF baru tersedia di web.');
  }
  const lib = await loadPdfJsWeb();
  const buf = await (await fetch(uri)).arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const doc = (globalThis as any).document;
  const out: string[] = [];
  const total = Math.min(pdf.numPages, maxPages);
  for (let p = 1; p <= total; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = doc.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    out.push(canvas.toDataURL('image/png'));
  }
  return out;
}

/** Ekstrak teks PDF dengan MEMPERTAHANKAN baris (item dikelompokkan per posisi-y). */
export async function extractPdfLines(uri: string): Promise<string> {
  if (Platform.OS !== 'web') {
    throw new Error('Baca PDF baru tersedia di web.');
  }
  const lib = await loadPdfJsWeb();
  const buf = await (await fetch(uri)).arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const TOL = 4; // toleransi posisi-y agar 1 baris tabel tidak terpecah
  let out = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = (content.items as any[])
      .filter((it) => it && typeof it.str === 'string' && it.str.trim() !== '')
      .map((it) => ({ x: it.transform[4] as number, y: it.transform[5] as number, str: it.str as string }));
    // urut atas->bawah, lalu kiri->kanan
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    // kelompokkan jadi baris berdasarkan y dalam toleransi
    const groups: { refY: number; items: { x: number; str: string }[] }[] = [];
    for (const it of items) {
      const g = groups[groups.length - 1];
      if (g && Math.abs(it.y - g.refY) <= TOL) g.items.push(it);
      else groups.push({ refY: it.y, items: [it] });
    }
    for (const g of groups) {
      const line = g.items
        .sort((a, b) => a.x - b.x)
        .map((o) => o.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (line) out += line + '\n';
    }
  }
  return out;
}
