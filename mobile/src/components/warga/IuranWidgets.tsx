// Port dari lib/widgets/warga_iuran_widgets.dart
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../Icon';
import * as Clipboard from 'expo-clipboard';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { IuranRecord, iuranIsAwaiting, iuranIsPaid, iuranPaymentMethodLabel } from '../../types/models';
import {
  formatRupiahCompact,
  iuranDueDateLabel,
  iuranPeriodBadge,
  iuranPeriodTitle,
} from '../../lib/period';
import { wargaCardStyle } from './wargaUi';
import { useToast } from '../Toast';

interface StatusUi {
  label: string;
  subtitle: string;
  accent: string;
  accentBg: string;
  icon: IconName;
}

export function iuranStatusFromBill(bill: IuranRecord | null): StatusUi {
  if (bill == null) {
    return {
      label: 'Belum ada tagihan',
      subtitle: 'Tagihan bulan ini akan muncul otomatis.',
      accent: colors.textSecondary,
      accentBg: '#F3F4F6',
      icon: 'information-circle-outline',
    };
  }
  if (iuranIsPaid(bill)) {
    return {
      label: 'Lunas',
      subtitle: `Terima kasih, iuran ${iuranPeriodTitle(bill)} sudah lunas.`,
      accent: wargaColors.primaryGreen,
      accentBg: wargaColors.lightGreen,
      icon: 'checkmark-circle',
    };
  }
  if (iuranIsAwaiting(bill)) {
    return {
      label: 'Menunggu verifikasi',
      subtitle: `Bukti ${iuranPeriodTitle(bill)} sedang dicek Bendahara RT.`,
      accent: '#92400E',
      accentBg: '#FEF3C7',
      icon: 'hourglass-outline',
    };
  }
  return {
    label: 'Belum bayar',
    subtitle: `Jatuh tempo ${iuranDueDateLabel(bill.periodKey)} · ${formatRupiahCompact(bill.amount)}`,
    accent: wargaColors.dangerRed,
    accentBg: '#FEE2E2',
    icon: 'time-outline',
  };
}

export function WargaIuranHeroSection({
  currentBill,
  rtSwitcher,
}: {
  currentBill: IuranRecord | null;
  rtSwitcher?: React.ReactNode;
}) {
  const periodTitle = currentBill ? iuranPeriodTitle(currentBill) : '—';
  const badge = currentBill ? iuranPeriodBadge(currentBill.periodKey) : null;
  const status = iuranStatusFromBill(currentBill);

  return (
    <View style={styles.hero}>
      <Text style={styles.heroTitle}>Iuran Saya</Text>
      <Text style={styles.heroPeriod}>Periode {periodTitle}</Text>
      {rtSwitcher ? <View style={{ marginTop: 14 }}>{rtSwitcher}</View> : null}
      <View style={styles.statusCard}>
        <View style={[styles.statusIcon, { backgroundColor: status.accentBg }]}>
          <Icon name={status.icon} size={26} color={status.accent} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.statusKicker}>STATUS IURAN</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <Text style={[styles.statusLabel, { color: status.accent }]}>{status.label}</Text>
            {badge && (
              <View style={styles.periodBadge}>
                <Text style={styles.periodBadgeText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusSub}>{status.subtitle}</Text>
        </View>
      </View>
    </View>
  );
}

export function WargaIuranSection({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: string | null;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {trailing ? <Text style={styles.sectionTrailing}>{trailing}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function WargaIuranQrisCard({
  rtLabel,
  amount,
  onScan,
}: {
  rtLabel: string;
  amount: number;
  onScan: () => void;
}) {
  return (
    <Pressable onPress={onScan} style={({ pressed }) => [styles.qris, pressed && { opacity: 0.9 }]}>
      <View style={styles.qrisIcon}>
        <Icon name="qr-code" size={28} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.qrisTitle}>Bayar via QRIS</Text>
        <Text style={styles.qrisSub}>
          {rtLabel} • {formatRupiahCompact(amount)}
        </Text>
      </View>
      <View style={styles.qrisScan}>
        <Text style={styles.qrisScanText}>Scan</Text>
      </View>
    </Pressable>
  );
}

export function WargaIuranVirtualAccountCard({
  accountNumber,
  accountName,
}: {
  rtNumber: string;
  accountNumber: string;
  accountName: string;
}) {
  const toast = useToast();
  return (
    <View style={[wargaCardStyle(16), { padding: 18 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Icon name="business" size={22} color="#2563EB" />
        <Text style={styles.vaTitle}>Virtual Account Bank BRI</Text>
      </View>
      <View style={styles.vaBox}>
        <Text style={styles.vaNumber}>{accountNumber}</Text>
        <Pressable
          hitSlop={8}
          onPress={async () => {
            await Clipboard.setStringAsync(accountNumber.replace(/-/g, ''));
            toast.success('Nomor VA disalin');
          }}
        >
          <Icon name="copy-outline" size={20} color="#2563EB" />
        </Pressable>
      </View>
      <Text style={styles.vaName}>{accountName}</Text>
    </View>
  );
}

export function WargaIuranEwalletTile({
  label,
  phone,
  icon,
  color,
}: {
  label: string;
  phone: string;
  icon: IconName;
  color: string;
}) {
  return (
    <View style={[wargaCardStyle(14), styles.ewallet]}>
      <Icon name={icon} size={22} color={color} />
      <Text style={styles.ewalletLabel}>{label}</Text>
      <Text style={styles.ewalletPhone} numberOfLines={1}>
        {phone}
      </Text>
    </View>
  );
}

export function WargaIuranHistoryCard({
  record,
  onPay,
}: {
  record: IuranRecord;
  onPay?: () => void;
}) {
  const paid = iuranIsPaid(record);
  const awaiting = iuranIsAwaiting(record);
  const title = iuranPeriodTitle(record);

  let iconBg: string, iconColor: string, icon: IconName;
  let amountColor: string, subtitle: string, badge: string, badgeBg: string, badgeFg: string;

  if (paid) {
    iconBg = wargaColors.lightGreen;
    iconColor = wargaColors.primaryGreen;
    icon = 'checkmark-circle';
    amountColor = wargaColors.primaryGreen;
    const d = record.paidAt;
    const dateStr = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : '—';
    subtitle = `Dibayar tgl ${dateStr} via ${iuranPaymentMethodLabel(record)}`;
    badge = 'LUNAS';
    badgeBg = wargaColors.lightGreen;
    badgeFg = wargaColors.primaryGreen;
  } else if (awaiting) {
    iconBg = '#FEF3C7';
    iconColor = '#92400E';
    icon = 'hourglass-outline';
    amountColor = '#92400E';
    subtitle = 'Menunggu verifikasi Bendahara';
    badge = 'PROSES';
    badgeBg = '#FEF3C7';
    badgeFg = '#92400E';
  } else {
    iconBg = '#FEE2E2';
    iconColor = wargaColors.dangerRed;
    icon = 'warning';
    amountColor = wargaColors.dangerRed;
    subtitle = 'Belum dibayar';
    badge = 'BELUM';
    badgeBg = '#FEE2E2';
    badgeFg = wargaColors.dangerRed;
  }

  return (
    <Pressable
      onPress={onPay}
      style={({ pressed }) => [wargaCardStyle(14), styles.histCard, pressed && onPay ? { opacity: 0.9 } : null]}
    >
      <View style={[styles.histIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.histTitle}>{title}</Text>
        <Text style={[styles.histSub, { color: iconColor }]}>{subtitle}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.histAmount, { color: amountColor }]}>
          {formatRupiahCompact(record.amount)}
        </Text>
        <View style={[styles.histBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.histBadgeText, { color: badgeFg }]}>{badge}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function WargaIuranTotalsCard({
  paidTotal,
  paidMonths,
  unpaidTotal,
  unpaidMonths,
}: {
  paidTotal: number;
  paidMonths: number;
  unpaidTotal: number;
  unpaidMonths: number;
}) {
  return (
    <View style={styles.totals}>
      <View style={{ flex: 1 }}>
        <Text style={styles.totalsKicker}>TOTAL SUDAH DIBAYAR</Text>
        <Text style={[styles.totalsValue, { color: wargaColors.primaryGreen }]}>
          {formatRupiah(paidTotal)}
        </Text>
        <Text style={styles.totalsMonths}>{paidMonths} bulan</Text>
      </View>
      <View style={styles.totalsDivider} />
      <View style={{ flex: 1, paddingLeft: 12 }}>
        <Text style={styles.totalsKicker}>TOTAL TERTUNGGAK</Text>
        <Text style={[styles.totalsValue, { color: '#EA580C' }]}>{formatRupiah(unpaidTotal)}</Text>
        <Text style={styles.totalsMonths}>{unpaidMonths} bulan</Text>
      </View>
    </View>
  );
}

export function WargaIuranDownloadCard({
  lastPaidLabel,
  onTap,
}: {
  lastPaidLabel: string;
  onTap?: () => void;
}) {
  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [wargaCardStyle(14), styles.download, pressed && onTap ? { opacity: 0.9 } : null]}
    >
      <View style={styles.downloadIcon}>
        <Icon name="receipt-outline" size={24} color="#2563EB" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.downloadTitle}>Download Bukti Bayar</Text>
        <Text style={styles.downloadSub}>Terakhir: {lastPaidLabel}</Text>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '600' },
  heroPeriod: { color: 'rgba(255,255,255,0.92)', fontSize: 14, marginTop: 6 },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  statusIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statusKicker: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, color: colors.textSecondary },
  statusLabel: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  statusSub: { fontSize: 13, lineHeight: 18, color: colors.textSecondary, marginTop: 10 },
  periodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginTop: 6,
  },
  periodBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textPrimary },

  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  sectionTrailing: { fontSize: 12, color: colors.textSecondary },

  qris: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 20 },
  qrisIcon: { padding: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  qrisTitle: { color: '#fff', fontWeight: '600', fontSize: 15 },
  qrisSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  qrisScan: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 10 },
  qrisScanText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  vaTitle: { fontWeight: '600', fontSize: 14, marginLeft: 10, color: colors.textPrimary },
  vaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vaNumber: { flex: 1, fontWeight: '700', fontSize: 16, color: colors.textPrimary },
  vaName: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },

  ewallet: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10 },
  ewalletLabel: { fontWeight: '700', fontSize: 11, marginTop: 6, color: colors.textPrimary },
  ewalletPhone: { fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  histCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 12 },
  histIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  histTitle: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  histSub: { fontSize: 11, marginTop: 2 },
  histAmount: { fontWeight: '700', fontSize: 14 },
  histBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  histBadgeText: { fontSize: 9, fontWeight: '700' },

  totals: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: '#ECFEFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  totalsKicker: { fontSize: 10, fontWeight: '600', color: colors.textSecondary },
  totalsValue: { fontWeight: '700', fontSize: 16, marginTop: 4 },
  totalsMonths: { fontSize: 11, color: colors.textSecondary },
  totalsDivider: { width: 1, height: 48, backgroundColor: '#99F6E4' },

  download: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  downloadIcon: { padding: 10, backgroundColor: wargaColors.accentBlue, borderRadius: 10 },
  downloadTitle: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  downloadSub: { fontSize: 12, color: colors.textSecondary },
});
