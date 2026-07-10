// Port dari lib/config/app_theme.dart
// RT OS Indonesia — palet Emerald, ringan, mudah dibaca usia 35–60.

export const colors = {
  emerald: '#059669',
  emeraldLight: '#10B981',
  emeraldDark: '#047857',
  emeraldSoft: '#D1FAE5',
  emeraldMuted: '#ECFDF5',

  background: '#F8FAF9',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textHint: '#9CA3AF',
  border: '#E5E7EB',
  warning: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
} as const;

// Warna khusus Beranda Warga (WargaBerandaColors di Flutter).
export const wargaColors = {
  background: '#F8FAF9',
  bgColor: '#F8FAF9',
  primaryGreen: '#059669',
  primaryDark: '#047857',
  lightGreen: '#D1FAE5',
  accentGreen: '#D1FAE5',
  accentYellow: '#FEF3C7',
  accentBlue: '#DBEAFE',
  accentRed: '#FEF2F2',
  accentLime: '#EAF3DE',
  lightRed: '#FEE2E2',
  dangerRed: '#EF4444',
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
} as const;

// Bayangan lembut (AppTheme.softShadow)
export const softShadow = {
  shadowColor: '#000000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;

/** Rp 1.250.000 — port AppTheme.formatRupiah */
export function formatRupiah(amount: number): string {
  const s = Math.round(amount).toString();
  let out = 'Rp ';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += '.';
    out += s[i];
  }
  return out;
}

// ── Role ──────────────────────────────────────────────────────────
export type UserRole = 'ketuaRt' | 'bendahara' | 'warga' | 'unknown';

export function roleFromString(role?: string | null): UserRole {
  switch (role) {
    case 'ketua_rt':
    case 'ketua_rw':
      return 'ketuaRt';
    case 'bendahara':
      return 'bendahara';
    case 'warga':
      return 'warga';
    default:
      return 'unknown';
  }
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'ketuaRt':
      return 'Ketua RT';
    case 'bendahara':
      return 'Bendahara RT';
    case 'warga':
      return 'Warga';
    default:
      return 'Pengguna';
  }
}
