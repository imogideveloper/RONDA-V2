// Port dari lib/widgets/warga_tagihan_flow_widgets.dart
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { IuranRecord, iuranPaymentMethodLabel } from '../../types/models';
import { daysLateFromPeriodKey, iuranPeriodTitle } from '../../lib/period';
import { formatDateShort } from '../../lib/date';
import { wargaCardStyle } from './wargaUi';

// Kartu merah TOTAL TAGIHAN.
export function WargaTagihanHeroCard({
  total,
  bulanTertunggak,
  daysLate,
}: {
  total: number;
  bulanTertunggak: number;
  daysLate: number;
}) {
  return (
    <View style={styles.hero}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="warning" size={16} color="rgba(255,255,255,0.9)" />
        <Text style={styles.heroKicker}>TOTAL TAGIHAN</Text>
      </View>
      <Text style={styles.heroAmount}>{formatRupiah(total)}</Text>
      <Text style={styles.heroSub}>
        {bulanTertunggak} bulan tertunggak{daysLate > 0 ? ` · Terlambat ${daysLate} hari` : ''}
      </Text>
    </View>
  );
}

// Strip kuning — menunggu verifikasi.
export function WargaMenungguVerifikasiCard({ bill }: { bill: IuranRecord }) {
  return (
    <View style={styles.menunggu}>
      <View style={styles.menungguIcon}>
        <Ionicons name="time-outline" size={22} color="#EA580C" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.periodTitle}>{iuranPeriodTitle(bill)}</Text>
        <Text style={styles.menungguSub}>
          {iuranPaymentMethodLabel(bill)} · Diajukan{' '}
          {bill.submittedAt ? formatDateShort(bill.submittedAt) : '-'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.amount}>{formatRupiah(bill.amount)}</Text>
        <View style={styles.verifBadge}>
          <Text style={styles.verifBadgeText}>VERIFIKASI</Text>
        </View>
      </View>
    </View>
  );
}

// Item tagihan bulanan — pilih, expand rincian.
export function WargaTagihanBillTile({
  bill,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
}: {
  bill: IuranRecord;
  selected: boolean;
  expanded: boolean;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
}) {
  const late = daysLateFromPeriodKey(bill.periodKey);
  const half = bill.amount / 2;
  const items = [
    { label: 'Keamanan', amount: half, icon: 'shield-outline' as const },
    { label: 'Kebersihan', amount: half, icon: 'sparkles-outline' as const },
  ];

  return (
    <View
      style={[
        wargaCardStyle(14),
        styles.tile,
        { borderColor: selected ? wargaColors.dangerRed : colors.border, borderWidth: selected ? 1.5 : 1 },
      ]}
    >
      <Pressable onPress={onToggleExpand} style={styles.tileHead}>
        <Pressable onPress={onToggleSelect} hitSlop={8}>
          <View
            style={[
              styles.radio,
              { borderColor: selected ? wargaColors.dangerRed : colors.border, backgroundColor: selected ? wargaColors.dangerRed : 'transparent' },
            ]}
          >
            {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.periodTitle}>{iuranPeriodTitle(bill)}</Text>
            {late > 0 && (
              <View style={styles.lateBadge}>
                <Text style={styles.lateBadgeText}>TERLAMBAT {late}H</Text>
              </View>
            )}
          </View>
          <Text style={styles.tileSub}>{items.length} item</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amount}>{formatRupiah(bill.amount)}</Text>
          <Text style={styles.tileToggle}>{expanded ? 'Sembunyikan ∨' : 'Lihat Rincian >'}</Text>
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.tileDetail}>
          {items.map((it) => (
            <View key={it.label} style={styles.lineItem}>
              <Ionicons name={it.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.lineLabel}>{it.label}</Text>
              <Text style={styles.lineAmount}>{formatRupiah(it.amount)}</Text>
            </View>
          ))}
          <View style={[styles.lineItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 8 }]}>
            <Text style={[styles.lineLabel, { fontWeight: '600', marginLeft: 0 }]}>Subtotal</Text>
            <Text style={[styles.lineAmount, { fontWeight: '700' }]}>{formatRupiah(bill.amount)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// Bar bawah — bayar tagihan terpilih.
export function WargaTagihanPayBar({
  count,
  total,
  onPay,
}: {
  count: number;
  total: number;
  onPay: () => void;
}) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.payBarSafe}>
      <View style={styles.payBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.payBarKicker}>{count} TAGIHAN DIPILIH</Text>
          <Text style={styles.payBarTotal}>{formatRupiah(total)}</Text>
        </View>
        <Pressable onPress={onPay} style={styles.payBarBtn}>
          <Text style={styles.payBarBtnText}>Bayar</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function WargaPaymentMethodTile({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onTap,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onTap: () => void;
}) {
  return (
    <Pressable onPress={onTap} style={({ pressed }) => [wargaCardStyle(14), styles.method, pressed && { opacity: 0.9 }]}>
      <View style={[styles.methodIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={24} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.periodTitle, { fontSize: 15 }]}>{title}</Text>
        <Text style={styles.tileSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export function WargaUploadBuktiBox({
  onTap,
  imageUri,
}: {
  onTap: () => void;
  imageUri?: string | null;
}) {
  return (
    <Pressable onPress={onTap} style={[styles.upload, { height: imageUri ? 160 : 120 }]}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.uploadImg} resizeMode="cover" />
      ) : (
        <View style={{ alignItems: 'center' }}>
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload-outline" size={28} color="#0284C7" />
          </View>
          <Text style={styles.uploadTitle}>Tap untuk upload bukti</Text>
          <Text style={styles.uploadSub}>JPG, PNG — maks 5MB</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#B91C1C',
    shadowColor: wargaColors.dangerRed,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroKicker: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  heroAmount: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 12 },
  heroSub: { color: 'rgba(255,255,255,0.88)', fontSize: 12, marginTop: 8 },

  menunggu: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  menungguIcon: { padding: 10, backgroundColor: '#FFF3E0', borderRadius: 12 },
  menungguSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  verifBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#FFF3E0', borderRadius: 6, marginTop: 4 },
  verifBadgeText: { fontSize: 9, fontWeight: '700', color: '#EA580C' },

  periodTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  amount: { fontWeight: '700', fontSize: 14, color: colors.textPrimary },

  tile: { marginBottom: 10 },
  tileHead: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  tileSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  tileToggle: { fontSize: 11, fontWeight: '600', color: wargaColors.dangerRed, marginTop: 4 },
  lateBadge: { marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: wargaColors.lightRed, borderRadius: 4 },
  lateBadgeText: { fontSize: 8, fontWeight: '700', color: wargaColors.dangerRed },
  tileDetail: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 14 },
  lineItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  lineLabel: { flex: 1, marginLeft: 8, fontSize: 13, color: colors.textSecondary },
  lineAmount: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  payBarSafe: { backgroundColor: wargaColors.dangerRed },
  payBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: wargaColors.dangerRed,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  payBarKicker: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  payBarTotal: { color: '#fff', fontSize: 22, fontWeight: '700' },
  payBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  payBarBtnText: { color: '#fff', fontWeight: '700' },

  method: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10 },
  methodIcon: { padding: 10, borderRadius: 12 },

  upload: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  uploadImg: { width: '100%', height: '100%' },
  uploadIcon: { padding: 12, backgroundColor: '#E0F2FE', borderRadius: 999 },
  uploadTitle: { fontWeight: '600', color: colors.textSecondary, marginTop: 10 },
  uploadSub: { fontSize: 11, color: colors.textSecondary },
});
