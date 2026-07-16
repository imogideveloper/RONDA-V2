// Verifikasi Surat — Ketua RT meninjau & menyetujui permohonan surat warga.
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { suratItemByTypeKey } from '../../lib/suratCatalog';
import { formatDateShort } from '../../lib/date';
import {
  SuratRequest,
  profileIsKetua,
  suratIsApproved,
  suratIsPending,
  suratIsRejected,
  suratPersonName,
  suratReferenceCode,
} from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SuratPengantar'>;

function statusMeta(r: SuratRequest): { label: string; color: string; bg: string } {
  if (suratIsApproved(r)) return { label: 'DISETUJUI', color: wargaColors.primaryGreen, bg: wargaColors.lightGreen };
  if (suratIsRejected(r)) return { label: 'DITOLAK', color: wargaColors.dangerRed, bg: wargaColors.lightRed };
  return { label: 'MENUNGGU', color: '#D97706', bg: '#FEF3C7' };
}

export default function SuratPengantarScreen({ route, navigation }: Props) {
  const { profile, rt } = route.params;
  const toast = useToast();
  const isKetua = profileIsKetua(profile);
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState<SuratRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<SuratRequest | null>(null);

  const load = useCallback(async () => {
    const list = await rtService.getSuratRequests(rt.id, isKetua);
    setRequests(list);
    setLoading(false);
    setRefreshing(false);
  }, [rt.id, isKetua]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = requests.filter(suratIsPending);
  const processed = requests.filter((r) => !suratIsPending(r));
  const list = tab === 0 ? pending : processed;

  const decide = async (req: SuratRequest, status: string) => {
    try {
      await rtService.updateSuratStatus(req.id, status);
      setDetail(null);
      await load();
      toast.success(status === 'approved' ? 'Surat disetujui' : 'Surat ditolak');
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    }
  };

  const renderCard = (r: SuratRequest) => {
    const item = suratItemByTypeKey(r.suratType);
    const st = statusMeta(r);
    return (
      <Pressable key={r.id} style={styles.card} onPress={() => setDetail(r)}>
        <View style={styles.cardIcon}>
          <Icon name={item?.icon ?? 'document-text-outline'} size={20} color={wargaColors.primaryGreen} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardTopRow}>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={styles.nomor}>{suratReferenceCode(r, rt.rtNumber)}</Text>
          </View>
          <Text style={styles.cardTitle}>{r.suratType}</Text>
          <Text style={styles.cardSub}>
            {suratPersonName(r)} • {formatDateShort(r.createdAt)}
          </Text>
        </View>
        <View style={[styles.dot, { backgroundColor: st.color }]} />
        <Icon name="chevron-forward" size={18} color={colors.textHint} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.shieldIcon}>
          <Icon name="shield" size={18} color={wargaColors.primaryGreen} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Verifikasi Surat</Text>
          <Text style={styles.headerSub}>Kelola permohonan surat warga</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
      >
        {/* Statistik */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={styles.statTop}>
              <Icon name="time-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statLabel}>MENUNGGU</Text>
            </View>
            <Text style={styles.statValue}>{pending.length}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: wargaColors.primaryDark }]}>
            <View style={styles.statTop}>
              <Icon name="checkmark-circle" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.statLabel}>DIPROSES</Text>
            </View>
            <Text style={styles.statValue}>{processed.length}</Text>
          </View>
        </View>

        {/* Tab */}
        <View style={styles.segment}>
          <SegTab label="Menunggu" count={pending.length} active={tab === 0} onPress={() => setTab(0)} />
          <SegTab label="Diproses" count={processed.length} active={tab === 1} onPress={() => setTab(1)} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.emerald} size="large" /></View>
        ) : list.length === 0 ? (
          <Text style={styles.empty}>{tab === 0 ? 'Tidak ada permohonan menunggu.' : 'Belum ada surat yang diproses.'}</Text>
        ) : (
          list.map(renderCard)
        )}
      </ScrollView>

      {/* Detail & aksi — dialog di tengah */}
      <Modal visible={detail != null} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetail(null)} />
          {detail && (() => {
            const st = statusMeta(detail);
            const item = suratItemByTypeKey(detail.suratType);
            return (
              <View style={styles.dialog}>
                <View style={styles.dialogHeader}>
                  <Text style={styles.dialogTitle}>Detail Permohonan</Text>
                  <Pressable onPress={() => setDetail(null)} hitSlop={8} style={styles.closeBtn}>
                    <Icon name="close-circle-outline" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
                  <View style={styles.cardTopRow}>
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Text style={styles.nomor}>{suratReferenceCode(detail, rt.rtNumber)}</Text>
                  </View>

                  <View style={styles.suratMini}>
                    <View style={styles.cardIcon}>
                      <Icon name={item?.icon ?? 'document-text-outline'} size={20} color={wargaColors.primaryGreen} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{detail.suratType}</Text>
                      <Text style={styles.cardSub}>Diajukan: {formatDateShort(detail.createdAt)}</Text>
                    </View>
                  </View>

                  <View style={styles.sectionRow}>
                    <Icon name="person-outline" size={15} color="#185FA5" />
                    <Text style={styles.sectionLabel2}>Pemohon</Text>
                  </View>
                  <View style={styles.dataCard}>
                    <View style={styles.dataGrid}>
                      <DataCell label="Nama" value={suratPersonName(detail)} />
                      <DataCell label="NIK" value={detail.nik} />
                      <DataCell label="Pekerjaan" value={detail.occupation} />
                      <DataCell label="Status" value={detail.maritalStatus} />
                    </View>
                    <DataCell label="Alamat" value={rt.address} full />
                  </View>

                  <View style={styles.sectionRow}>
                    <Icon name="document-text-outline" size={15} color="#185FA5" />
                    <Text style={styles.sectionLabel2}>Keperluan</Text>
                  </View>
                  <View style={styles.keperluanBox}>
                    <Text style={styles.keperluanText}>{detail.purpose || '—'}</Text>
                  </View>

                  <Pressable
                    style={styles.draftBtn}
                    onPress={() => {
                      const req = detail;
                      setDetail(null);
                      navigation.navigate('SuratDraft', { rt, request: req, ketuaName: profile.fullName });
                    }}
                  >
                    <Icon name="document-text-outline" size={18} color={wargaColors.primaryGreen} />
                    <Text style={styles.draftText}>Lihat Draft Surat</Text>
                  </Pressable>
                </ScrollView>

                {isKetua && suratIsPending(detail) && (
                  <View style={styles.actionRow}>
                    <Pressable style={[styles.actionBtn, styles.rejectBtn]} onPress={() => decide(detail, 'rejected')}>
                      <Icon name="close-circle-outline" size={18} color={wargaColors.dangerRed} />
                      <Text style={styles.rejectText}>Tolak</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.approveBtn]} onPress={() => decide(detail, 'approved')}>
                      <Icon name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.approveText}>Setujui</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DataCell({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <View style={{ width: full ? '100%' : '50%', marginTop: full ? 10 : 0, marginBottom: full ? 0 : 12 }}>
      <Text style={styles.cellLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.cellValue}>{value && value.trim() !== '' ? value : '—'}</Text>
    </View>
  );
}

function SegTab({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segTab, active && styles.segTabActive]}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.segBadge, active && styles.segBadgeActive]}>
          <Text style={[styles.segBadgeText, active && { color: wargaColors.primaryGreen }]}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  center: { paddingVertical: 60, alignItems: 'center' },
  scroll: { paddingHorizontal: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  shieldIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: wargaColors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 18 },
  statCard: { flex: 1, backgroundColor: wargaColors.primaryGreen, borderRadius: 16, padding: 16 },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5 },
  statValue: { fontSize: 30, fontWeight: '800', color: '#fff', marginTop: 6 },
  segment: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 4, gap: 4, marginBottom: 16 },
  segTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  segTabActive: { backgroundColor: wargaColors.lightGreen },
  segText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  segTextActive: { color: wargaColors.primaryGreen },
  segBadge: { backgroundColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  segBadgeActive: { backgroundColor: '#fff' },
  segBadgeText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: wargaColors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  nomor: { fontSize: 11, color: colors.textSecondary },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 40 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: 22, padding: 20, maxHeight: '88%' },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  suratMini: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.background, borderRadius: 14, padding: 12, marginTop: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, marginBottom: 8 },
  sectionLabel2: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  dataCard: { backgroundColor: colors.background, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellLabel: { fontSize: 10, fontWeight: '600', color: colors.textHint, letterSpacing: 0.3 },
  cellValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginTop: 2 },
  keperluanBox: { backgroundColor: colors.background, borderRadius: 14, padding: 14 },
  keperluanText: { fontSize: 13, color: colors.textPrimary },
  draftBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: wargaColors.primaryGreen, marginTop: 16 },
  draftText: { color: wargaColors.primaryGreen, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 48, borderRadius: 12 },
  rejectBtn: { borderWidth: 1, borderColor: wargaColors.dangerRed },
  rejectText: { color: wargaColors.dangerRed, fontWeight: '700' },
  approveBtn: { backgroundColor: wargaColors.primaryGreen },
  approveText: { color: '#fff', fontWeight: '700' },
});
