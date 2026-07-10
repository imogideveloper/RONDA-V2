// Port dari lib/utils/whatsapp_launcher.dart (url_launcher → expo-linking)
import * as Linking from 'expo-linking';

export function normalizePhoneForWhatsApp(raw: string): string {
  let digits = (raw ?? '').replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (!digits.startsWith('62') && digits.length >= 9) {
    digits = `62${digits}`;
  }
  return digits;
}

async function open(url: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return false;
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

export async function openWhatsAppPhone(phone: string): Promise<boolean> {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (normalized.length < 10) return false;
  return open(`https://wa.me/${normalized}`);
}

export async function openWhatsAppTagihan(args: {
  phone: string;
  wargaName: string;
  periodLabel: string;
  amountFormatted: string;
  rtLabel: string;
}): Promise<boolean> {
  const normalized = normalizePhoneForWhatsApp(args.phone);
  if (normalized.length < 10) return false;
  const text =
    `Assalamualaikum Pak/Bu ${args.wargaName},\n\n` +
    `Reminder iuran RT *${args.rtLabel}* periode *${args.periodLabel}* sebesar *${args.amountFormatted}*.\n\n` +
    `Mohon segera diselesaikan. Terima kasih.\n` +
    `_Pesan dari RT OS Ronda_`;
  return open(`https://wa.me/${normalized}?text=${encodeURIComponent(text)}`);
}
