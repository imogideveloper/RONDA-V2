// Port dari lib/widgets/warga_surat_widgets.dart
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, wargaColors } from '../../config/theme';
import { SuratRequest, suratIsApproved, suratIsPending, suratIsRejected, suratReferenceCode } from '../../types/models';
import { SuratItem } from '../../lib/suratCatalog';
import { formatDate } from '../../lib/date';
import { wargaCardStyle, wargaText } from './wargaUi';

export function WargaSuratHeroCard({
  jenisCount,
  pendingCount,
  approvedCount,
}: {
  jenisCount: number;
  pendingCount: number;
  approvedCount: number;
}) {
  return (
    <View style={styles.hero}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="document-text-outline" size={16} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroKicker}>LAYANAN SURAT RT</Text>
          </View>
          <Text style={styles.heroBig}>{jenisCount} Jenis</Text>
          <Text style={styles.heroSub}>
            {pendingCount > 0
              ? `${pendingCount} permohonan menunggu`
              : 'Ajukan surat untuk keperluan administrasi'}
          </Text>
        </View>
        <View style={styles.heroIcon}>
          <Ionicons name="clipboard-outline" size={32} color="#fff" />
        </View>
      </View>
      <View style={styles.pillRow}>
        <Pill icon="document-text-outline" label={`${jenisCount} Jenis`} />
        <Pill icon="time-outline" label={`${pendingCount} Menunggu`} />
        <Pill icon="checkmark-circle-outline" label={`${approvedCount} Disetujui`} success />
      </View>
    </View>
  );
}

function Pill({ icon, label, success }: { icon: keyof typeof Ionicons.glyphMap; label: string; success?: boolean }) {
  return (
    <View style={[styles.pill, { backgroundColor: `rgba(255,255,255,${success ? 0.22 : 0.14})` }]}>
      <Ionicons name={icon} size={14} color="#fff" />
      <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function WargaSuratSegmentToggle({
  selected,
  pendingBadge,
  approvedBadge,
  onChanged,
}: {
  selected: number;
  pendingBadge: number;
  approvedBadge: number;
  onChanged: (i: number) => void;
}) {
  return (
    <View style={styles.segment}>
      <SegTab index={0} label="Permohonan Saya" badge={pendingBadge} active={selected === 0} onPress={() => onChanged(0)} />
      <SegTab index={1} label="Surat Disetujui" badge={approvedBadge} active={selected === 1} onPress={() => onChanged(1)} />
    </View>
  );
}

function SegTab({ index, label, badge, active, onPress }: { index: number; label: string; badge: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segTab, active && styles.segTabActive]}>
      <Text style={[styles.segLabel, active && { color: colors.textPrimary, fontWeight: '600' }]}>{label}</Text>
      {badge > 0 && (
        <View style={[styles.segBadge, { backgroundColor: index === 0 ? '#FEF3C7' : '#E5E7EB' }]}>
          <Text style={[styles.segBadgeText, { color: index === 0 ? '#92400E' : colors.textSecondary }]}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function WargaSuratTypeCard({ item, onTap }: { item: SuratItem; onTap: () => void }) {
  return (
    <Pressable onPress={onTap} style={({ pressed }) => [wargaCardStyle(16), styles.typeCard, pressed && { opacity: 0.9 }]}>
      <View style={[styles.accent, { backgroundColor: item.accentColor }]} />
      <View style={[styles.typeIcon, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={22} color={item.iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Badge text="SURAT" fg="#7C3AED" bg="#F3E8FF" />
          {item.isPopular && <View style={{ marginLeft: 6 }}><Badge text="POPULER" fg="#fff" bg="#EA580C" /></View>}
          <View style={{ flex: 1 }} />
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.sla}>{item.sla}</Text>
        </View>
        <Text style={styles.typeTitle}>{item.title}</Text>
        <Text style={styles.typeDesc} numberOfLines={2}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} style={{ alignSelf: 'center' }} />
    </Pressable>
  );
}

function Badge({ text, fg, bg }: { text: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export function WargaSuratRequestCard({
  request,
  rtNumber,
  onReapply,
}: {
  request: SuratRequest;
  rtNumber: string;
  onReapply?: () => void;
}) {
  const pending = suratIsPending(request);
  const rejected = suratIsRejected(request);
  const approved = suratIsApproved(request);

  let badgeBg = '#FEF3C7', badgeFg = '#92400E', badgeIcon: keyof typeof Ionicons.glyphMap = 'ellipse', badgeLabel = 'Menunggu';
  if (approved) { badgeBg = wargaColors.lightGreen; badgeFg = wargaColors.primaryGreen; badgeIcon = 'checkmark-circle'; badgeLabel = 'Disetujui'; }
  else if (rejected) { badgeBg = '#FEE2E2'; badgeFg = wargaColors.dangerRed; badgeIcon = 'close-circle-outline'; badgeLabel = 'Ditolak'; }

  return (
    <View style={[wargaCardStyle(16), styles.reqCard]}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reqTitle}>{request.suratType}</Text>
          <Text style={[wargaText.greeting, { fontSize: 12, marginTop: 4 }]}>
            {suratReferenceCode(request, rtNumber)} · {formatDate(request.createdAt)}
          </Text>
        </View>
        <View style={[styles.reqBadge, { backgroundColor: badgeBg, borderColor: rejected ? badgeFg + '66' : 'transparent', borderWidth: rejected ? 1 : 0 }]}>
          <Ionicons name={badgeIcon} size={12} color={badgeFg} />
          <Text style={[styles.reqBadgeText, { color: badgeFg }]}>{badgeLabel}</Text>
        </View>
      </View>
      {pending && (
        <>
          <Text style={[wargaText.greeting, { fontSize: 12, marginTop: 10 }]} numberOfLines={2}>{request.purpose}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Text style={[styles.step, styles.stepActive]}>Diajukan</Text>
            <Text style={styles.connector}>→</Text>
            <Text style={[styles.step, styles.stepActive]}>Menunggu</Text>
            <Text style={styles.connector}>→</Text>
            <Text style={styles.step}>Disetujui</Text>
          </View>
        </>
      )}
      {rejected && onReapply && (
        <Pressable onPress={onReapply} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
          <Ionicons name="refresh" size={18} color={wargaColors.dangerRed} />
          <Text style={{ color: wargaColors.dangerRed, fontWeight: '600' }}>Ajukan Ulang</Text>
        </Pressable>
      )}
    </View>
  );
}

export function WargaSuratFormStepper({ step }: { step: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <StepDot n={1} label="Isi Data" active={step >= 0} />
      <View style={[styles.stepLine, { backgroundColor: step >= 1 ? '#3B82F6' : '#E5E7EB' }]} />
      <StepDot n={2} label="Preview" active={step >= 1} />
    </View>
  );
}

function StepDot({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.stepDot, { backgroundColor: active ? '#3B82F6' : 'transparent', borderColor: active ? '#3B82F6' : '#D1D5DB' }]}>
        <Text style={{ fontWeight: '600', fontSize: 13, color: active ? '#fff' : colors.textSecondary }}>{n}</Text>
      </View>
      <Text style={{ fontSize: 11, fontWeight: active ? '600' : '500', color: active ? '#3B82F6' : colors.textSecondary, marginTop: 4 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { padding: 18, borderRadius: 16, backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  heroKicker: { color: 'rgba(255,255,255,0.92)', fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  heroBig: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.9)', fontSize: 12, marginTop: 4 },
  heroIcon: { padding: 14, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 14, alignSelf: 'flex-start' },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  pill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 10 },
  pillText: { color: '#fff', fontSize: 10, fontWeight: '600', flexShrink: 1 },

  segment: { flexDirection: 'row', padding: 4, backgroundColor: '#E8ECE8', borderRadius: 14 },
  segTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12 },
  segTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  segLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  segBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  segBadgeText: { fontSize: 10, fontWeight: '700' },

  typeCard: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingLeft: 16, marginBottom: 10, overflow: 'hidden' },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  typeIcon: { padding: 10, borderRadius: 999 },
  sla: { fontSize: 11, color: colors.textSecondary, marginLeft: 4 },
  typeTitle: { fontWeight: '600', fontSize: 14, color: colors.textPrimary, marginTop: 6 },
  typeDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '700' },

  reqCard: { padding: 14, marginBottom: 10 },
  reqTitle: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  reqBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  reqBadgeText: { fontSize: 11, fontWeight: '600' },
  step: { fontSize: 10, color: colors.textSecondary },
  stepActive: { fontWeight: '600', color: wargaColors.primaryGreen },
  connector: { fontSize: 10, color: colors.textSecondary, marginHorizontal: 4 },

  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
  stepDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
