// Port dari AuthService.normalizePhone / displayPhone (lib/services/auth_service.dart)

/** 0838... / 838... / +62838... → +62838... */
export function normalizePhone(raw: string): string {
  let p = (raw ?? '').replace(/\D/g, '');
  if (p.startsWith('62')) p = p.slice(2);
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 0) return '+62';
  return `+62${p}`;
}

/** Tampilan ramah untuk UI (tanpa perlu user ketik +) */
export function displayPhone(raw: string): string {
  const n = normalizePhone(raw);
  return n === '+62' ? '' : n;
}

/** Hanya sisakan angka — pengganti IndonesiaPhoneFormatter untuk input. */
export function digitsOnly(raw: string): string {
  return (raw ?? '').replace(/\D/g, '');
}

/** Pesan error OTP yang lebih mudah dipahami (AuthService.mapAuthError) */
export function mapAuthError(message: string): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('unsupported phone provider')) {
    return 'SMS belum diatur di Supabase. Aktifkan Phone Auth + provider (Twilio), atau pakai login Email untuk development.';
  }
  if (m.includes('signups not allowed')) {
    return 'Pendaftaran OTP dinonaktifkan. Aktifkan "Allow new signups" di Supabase Auth.';
  }
  return message;
}
