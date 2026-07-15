// OCR Kartu Keluarga (scan/foto) → teks. Web-only, pakai Tesseract.js dari CDN.
// PDF-scan: halaman pertama dirender jadi gambar (pdf.js) lalu di-OCR.
import { Platform } from 'react-native';
import { loadPdfJsWeb } from './pdfText';

function loadTesseract(): Promise<any> {
  const w = globalThis as any;
  if (w.Tesseract) return Promise.resolve(w.Tesseract);
  return new Promise((resolve, reject) => {
    const doc = w.document;
    if (!doc) {
      reject(new Error('OCR hanya tersedia di web.'));
      return;
    }
    const s = doc.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
    s.onload = () => (w.Tesseract ? resolve(w.Tesseract) : reject(new Error('Tesseract gagal dimuat.')));
    s.onerror = () => reject(new Error('Tidak bisa memuat OCR (butuh koneksi internet).'));
    doc.body.appendChild(s);
  });
}

async function pdfFirstPageDataUrl(uri: string): Promise<string> {
  const lib = await loadPdfJsWeb();
  const buf = await (await fetch(uri)).arrayBuffer();
  const pdf = await lib.getDocument({ data: buf }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 2 });
  const doc: any = (globalThis as any).document;
  const canvas = doc.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas.toDataURL('image/png');
}

/** OCR sebuah gambar/PDF KK → teks mentah. onProgress: 0..1 saat mengenali teks. */
export async function ocrKk(
  uri: string,
  isPdf: boolean,
  onProgress?: (p: number) => void,
): Promise<string> {
  if (Platform.OS !== 'web') {
    throw new Error('Scan KK (OCR) baru tersedia di versi web.');
  }
  const image = isPdf ? await pdfFirstPageDataUrl(uri) : uri;
  const Tesseract = await loadTesseract();
  const { data } = await Tesseract.recognize(image, 'ind', {
    logger: (m: any) => {
      if (m.status === 'recognizing text' && onProgress) onProgress(m.progress ?? 0);
    },
  });
  return (data?.text as string) ?? '';
}
