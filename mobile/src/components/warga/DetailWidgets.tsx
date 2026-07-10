// Port dari lib/widgets/warga_detail_widgets.dart (subset yang dipakai halaman warga)
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { IuranRecord, KasTransaction, Profile, RtUnit, kasDateLabel, profileIsBendahara, profileIsKetua, profileRoleLabel } from '../../types/models';
import { iuranPaidSubtitle, iuranPeriodTitle } from '../../lib/period';
import { wargaCardStyle, wargaText } from './wargaUi';
import { WargaProfileAvatar } from './DashboardWidgets';

export function WargaPageSummaryDarkCard({ saldo, totalKeluar }: { saldo: number; totalKeluar: number }) {
  return (
    <View style={styles.darkCard}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="wallet-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={styles.darkKicker}>SALDO KAS RT</Text>
        </View>
        <Text style={styles.darkSaldo}>{formatRupiah(saldo)}</Text>
      </View>
      <View style={styles.darkDivider} />
      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Text style={styles.darkKicker}>TOTAL PENGELUARAN</Text>
        <Text style={styles.darkKeluar}>{formatRupiah(totalKeluar)}</Text>
      </View>
    </View>
  );
}

export function WargaEmergencyBannerCard({ rtLine }: { rtLine: string }) {
  return (
    <View style={styles.emergency}>
      <View style={styles.emergencyIcon}>
        <Icon name="alert-circle" size={28} color="#fff" />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={styles.emergencyTitle}>Hubungi Pengurus RT</Text>
        <Text style={styles.emergencySub}>{rtLine}</Text>
      </View>
    </View>
  );
}

export function WargaPengurusContactCard({
  profile,
  rt,
  onCall,
  onWhatsApp,
}: {
  profile: Profile;
  rt: RtUnit;
  onCall: () => void;
  onWhatsApp: () => void;
}) {
  const roleLine = profileIsKetua(profile)
    ? `Ketua RT ${rt.rtNumber}`
    : profileIsBendahara(profile)
      ? `Bendahara RT ${rt.rtNumber}`
      : profileRoleLabel(profile);
  const roleColor = profileIsBendahara(profile) ? '#EA580C' : wargaColors.primaryGreen;

  return (
    <View style={[wargaCardStyle(16), styles.contact]}>
      <WargaProfileAvatar imageUrl={profile.avatarUrl} fullName={profile.fullName} radius={28} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.contactName}>{profile.fullName}</Text>
        <Text style={[styles.contactRole, { color: roleColor }]}>{roleLine}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]}>
          {profile.phone.length > 0 ? profile.phone : 'Nomor belum diisi'}
        </Text>
      </View>
      <ContactBtn icon="call" color={roleColor} onTap={onCall} />
      <View style={{ width: 8 }} />
      <ContactBtn icon="chatbubble-ellipses" color={wargaColors.primaryGreen} onTap={onWhatsApp} />
    </View>
  );
}

function ContactBtn({ icon, color, onTap }: { icon: IconName; color: string; onTap: () => void }) {
  return (
    <Pressable onPress={onTap} style={({ pressed }) => [styles.contactBtn, { borderColor: color + '73' }, pressed && { opacity: 0.7 }]}>
      <Icon name={icon} size={20} color={color} />
    </Pressable>
  );
}

export function WargaKontribusiHeroCard({ total, bulanCount }: { total: number; bulanCount: number }) {
  return (
    <View style={styles.kontribusiHero}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="wallet-outline" size={18} color="rgba(255,255,255,0.9)" />
          <Text style={styles.kontribusiKicker}>TOTAL KONTRIBUSI</Text>
        </View>
        <Text style={styles.kontribusiTotal}>{formatRupiah(total)}</Text>
        <Text style={styles.kontribusiSub}>
          {bulanCount > 0 ? `${bulanCount} bulan sudah dibayar` : 'Belum ada pembayaran lunas'}
        </Text>
      </View>
      <View style={styles.kontribusiIcon}>
        <Icon name="checkmark" size={28} color="#fff" />
      </View>
    </View>
  );
}

export function WargaPaidIuranCard({ record }: { record: IuranRecord }) {
  return (
    <View style={[wargaCardStyle(16), styles.paidCard]}>
      <View style={styles.paidIcon}>
        <Icon name="checkmark" size={22} color={wargaColors.primaryGreen} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.paidTitle}>{iuranPeriodTitle(record)}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]}>{iuranPaidSubtitle(record)}</Text>
      </View>
      <Text style={styles.paidAmount}>{formatRupiah(record.amount)}</Text>
    </View>
  );
}

// Expansion tile tahun (collapsible).
export function WargaYearExpansionTile({
  year,
  monthCount,
  trailingAmount,
  trailingColor,
  accentBadge = false,
  defaultOpen = false,
  children,
}: {
  year: number;
  monthCount: number;
  trailingAmount: string;
  trailingColor: string;
  accentBadge?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={styles.yearTile}>
      <Pressable onPress={() => setOpen(!open)} style={styles.tileHead}>
        <Text style={styles.yearNum}>{year}</Text>
        <View style={[styles.monthBadge, { backgroundColor: accentBadge ? wargaColors.lightGreen : '#E5E7EB' }]}>
          <Text style={[styles.monthBadgeText, { color: accentBadge ? wargaColors.primaryGreen : colors.textSecondary }]}>
            {monthCount} bulan
          </Text>
        </View>
        <Text style={[styles.trailing, { color: trailingColor, flex: 1, textAlign: 'right' }]}>{trailingAmount}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} style={{ marginLeft: 6 }} />
      </Pressable>
      {open && <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>{children}</View>}
    </View>
  );
}

export function WargaMonthExpansionTile({
  monthTitle,
  itemCount,
  trailingAmount,
  trailingColor,
  children,
}: {
  monthTitle: string;
  itemCount: number;
  trailingAmount: string;
  trailingColor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.monthTile}>
      <Pressable onPress={() => setOpen(!open)} style={styles.tileHead}>
        <Text style={[styles.monthTitle, { flex: 1 }]}>{monthTitle}</Text>
        <Text style={styles.countLabel}>{itemCount === 1 ? '1 transaksi' : `${itemCount} transaksi`}</Text>
        <Text style={[styles.trailing, { color: trailingColor, fontSize: 13, marginLeft: 8 }]}>{trailingAmount}</Text>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} style={{ marginLeft: 6 }} />
      </Pressable>
      {open && <View style={{ paddingHorizontal: 10, paddingBottom: 10 }}>{children}</View>}
    </View>
  );
}

export function WargaKasTransactionCard({ tx }: { tx: KasTransaction }) {
  const c = (tx.category ?? tx.description).toLowerCase();
  let icon: IconName = 'card';
  let color = '#D97706';
  let bg = '#FFFBEB';
  let label = 'OPERASIONAL';
  if (c.includes('util') || c.includes('listrik') || c.includes('air')) {
    icon = 'flash'; color = '#2563EB'; bg = '#EFF6FF'; label = 'UTILITAS';
  } else if (c.includes('iuran')) {
    icon = 'cash'; color = colors.emerald; bg = colors.emeraldMuted; label = 'IURAN';
  }
  return (
    <View style={styles.kasCard}>
      <View style={[styles.kasIcon, { backgroundColor: bg }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.kasDesc}>{tx.description}</Text>
        <Text style={styles.kasMeta}>{label} • {kasDateLabel(tx)}</Text>
        {tx.recorderName ? <Text style={styles.kasRecorder}>Dicatat: {tx.recorderName}</Text> : null}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Icon name="arrow-down-outline" size={14} color={colors.danger} />
        <Text style={styles.kasAmount}>{formatRupiah(tx.amount)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  darkCard: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  darkKicker: { color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  darkSaldo: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 8 },
  darkKeluar: { color: '#F87171', fontSize: 18, fontWeight: '800', marginTop: 8 },
  darkDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 16 },

  emergency: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#B91C1C',
    shadowColor: wargaColors.dangerRed,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  emergencyIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  emergencyTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emergencySub: { color: 'rgba(255,255,255,0.92)', fontSize: 12, marginTop: 4 },

  contact: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10 },
  contactName: { fontWeight: '700', fontSize: 15, color: colors.textPrimary },
  contactRole: { fontWeight: '600', fontSize: 13, marginTop: 2 },
  contactBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  kontribusiHero: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  kontribusiKicker: { color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  kontribusiTotal: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 8 },
  kontribusiSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  kontribusiIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },

  paidCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  paidIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: wargaColors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  paidTitle: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  paidAmount: { fontWeight: '700', fontSize: 14, color: wargaColors.primaryGreen },

  yearTile: { marginBottom: 10, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  monthTile: { marginBottom: 8, backgroundColor: colors.surface, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  tileHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  yearNum: { fontWeight: '800', fontSize: 16, color: colors.textPrimary, marginRight: 8 },
  monthBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  monthBadgeText: { fontSize: 11, fontWeight: '600' },
  monthTitle: { fontWeight: '800', fontSize: 15, color: colors.textPrimary },
  countLabel: { fontSize: 11, color: colors.textSecondary },
  trailing: { fontWeight: '800', fontSize: 14 },

  kasCard: { flexDirection: 'row', padding: 12, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  kasIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  kasDesc: { fontWeight: '700', fontSize: 14, color: colors.textPrimary },
  kasMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  kasRecorder: { fontSize: 11, color: colors.textHint, marginTop: 2 },
  kasAmount: { fontWeight: '800', color: colors.danger, fontSize: 13 },
});
