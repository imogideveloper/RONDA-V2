// Ekspor surat ke PDF. Web: buka jendela cetak (Simpan sebagai PDF).
// Native: expo-print -> file PDF -> bagikan/simpan.
import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SuratLetterData } from '../components/warga/SuratLetterPreview';
import { buildSuratHtml } from './suratHtml';

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

export async function exportSuratPdf(
  data: SuratLetterData,
  opts?: { showSignature?: boolean },
): Promise<void> {
  const html = buildSuratHtml(data, opts);

  if (Platform.OS === 'web') {
    // Web: cetak lewat iframe berisi HANYA HTML surat (bukan halaman app), tanpa popup.
    await printHtmlWeb(html);
    return;
  }

  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Simpan / Bagikan Surat' });
  }
}
