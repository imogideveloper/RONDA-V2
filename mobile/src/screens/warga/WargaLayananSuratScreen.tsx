// Port dari lib/pages/warga/warga_layanan_surat_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import {
  WargaSuratHeroCard,
  WargaSuratRequestCard,
  WargaSuratSegmentToggle,
  WargaSuratTypeCard,
} from '../../components/warga/SuratWidgets';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { wargaHomeLoader } from '../../services/wargaHomeLoader';
import { SuratRequest, suratIsApproved, suratIsPending, suratIsRejected, suratPersonName } from '../../types/models';
import { SURAT_CATALOG, SuratItem, suratItemByTypeKey } from '../../lib/suratCatalog';
import { suratActive, groupByYearMonth } from '../../lib/papanInfo';
import { SuratLetterData } from '../../components/warga/SuratLetterPreview';
import { buildSuratDraft } from '../../lib/suratDraft';
import { exportSuratPdf } from '../../lib/suratPdf';
import { formatDate, formatDateShort } from '../../lib/date';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaLayananSurat'>;

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Kelompokkan surat: Tahun -> Bulan -> Surat (terbaru dahulu), pakai tanggal disetujui.
function nestYearMonth(items: SuratRequest[]) {
  const months = groupByYearMonth(items, (r) => r.updatedAt ?? r.createdAt);
  const years: { year: number; count: number; months: typeof months }[] = [];
  for (const mg of months) {
    let y = years.find((x) => x.year === mg.year);
    if (!y) {
      y = { year: mg.year, count: 0, months: [] };
      years.push(y);
    }
    y.months.push(mg);
    y.count += mg.items.length;
  }
  return years;
}

export default function WargaLayananSuratScreen({ route }: Props) {
  const { profile, rt, initialSuratType } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const [requests, setRequests] = useState<SuratRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState(0);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());
  const [detailReq, setDetailReq] = useState<SuratRequest | null>(null);
  const [submittedType, setSubmittedType] = useState<string | null>(null);

  const toggleNum = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, key: number) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  const toggleStr = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const suratNomorOf = (r: SuratRequest) =>
    buildSuratDraft({
      suratType: r.suratType,
      wargaName: r.userName ?? '',
      purpose: r.purpose,
      rtNumber: rt.rtNumber,
      rwNumber: rt.rwNumber,
      rtName: rt.name,
      address: rt.address ?? '-',
      ketuaName: '',
    }).nomor;

  const letterDataFromRequest = (r: SuratRequest): SuratLetterData => ({
    rt,
    suratType: r.suratType,
    wargaName: suratPersonName(r, profile.fullName),
    purpose: r.purpose,
    ketuaName: '',
    nik: r.nik,
    birthPlace: r.birthPlace,
    birthDate: r.birthDate,
    occupation: r.occupation,
    gender: r.gender,
    religion: r.religion,
    maritalStatus: r.maritalStatus,
    address: r.submitterAddress ?? profile.address,
  });

  const downloadPdf = async (r: SuratRequest) => {
    setDownloading(r.id);
    try {
      await exportSuratPdf(letterDataFromRequest(r), { showSignature: suratIsApproved(r) });
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setDownloading(null);
    }
  };

  const load = useCallback(async () => {
    try {
      const list = await rtService.getSuratRequests(rt.id);
      setRequests(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rt.id]);

  const onSubmittedSuccess = useCallback(
    (suratType?: string) => {
      setSegment(0);
      setSubmittedType(suratType ?? 'Surat');
      // Beranda warga (papan info) pakai cache terpisah — segarkan agar surat baru langsung tampil.
      wargaHomeLoader.invalidate();
      load();
    },
    [load],
  );

  const openForm = useCallback(
    (item: SuratItem) => {
      navigation.navigate('WargaSuratForm', { profile, rt, suratItem: item, onSubmitted: onSubmittedSuccess });
    },
    [navigation, profile, rt, onSubmittedSuccess],
  );

  const openCustom = useCallback(() => {
    navigation.navigate('WargaSuratCustom', { profile, rt, onSubmitted: onSubmittedSuccess });
  }, [navigation, profile, rt, onSubmittedSuccess]);

  useEffect(() => {
    load();
  }, [load]);

  // Sembunyikan kartu "Permohonan Terkirim!" otomatis setelah beberapa detik.
  useEffect(() => {
    if (!submittedType) return;
    const t = setTimeout(() => setSubmittedType(null), 6000);
    return () => clearTimeout(t);
  }, [submittedType]);

  // Buka form otomatis bila initialSuratType diberikan (sekali).
  const [autoOpened, setAutoOpened] = useState(false);
  useEffect(() => {
    if (!autoOpened && initialSuratType) {
      const item = suratItemByTypeKey(initialSuratType);
      if (item) {
        setAutoOpened(true);
        openForm(item);
      }
    }
  }, [autoOpened, initialSuratType, openForm]);

  // Surat "berpindah" dari beranda ke Riwayat begitu lewat tanggal pengajuannya.
  const isPastSubmission = (r: SuratRequest) => {
    const d = new Date(r.createdAt);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  const pendingCount = requests.filter(suratIsPending).length;
  const approvedCount = requests.filter(suratIsApproved).length;
  // Permohonan Saya hanya menampilkan surat yang MASIH menunggu keputusan.
  // Surat yang sudah ditolak/disetujui berpindah ke tab Riwayat, jadi tidak dobel di sini.
  const activeRequests = requests.filter(suratIsPending);
  // Riwayat: surat yang tanggal pengajuannya sudah lewat & sudah diproses (disetujui / ditolak).
  const historyRequests = requests.filter((r) => isPastSubmission(r) && !suratIsPending(r));
  const archivedRequests = requests.filter((r) => !suratActive(r));

  const renderHistoryCard = (r: SuratRequest) => {
    const item = suratItemByTypeKey(r.suratType);
    const rejected = suratIsRejected(r);
    return (
      <Pressable key={r.id} style={styles.approvedCard} onPress={() => setDetailReq(r)}>
        <View style={[styles.approvedIcon, rejected && { backgroundColor: '#FEE2E2' }]}>
          <Icon
            name={item?.icon ?? 'document-text-outline'}
            size={20}
            color={rejected ? wargaColors.dangerRed : wargaColors.primaryGreen}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {!rejected && <Text style={styles.approvedNomor}>{suratNomorOf(r)}</Text>}
            <View style={[styles.statusPill, rejected ? styles.statusPillRejected : styles.statusPillApproved]}>
              <Text style={[styles.statusPillText, { color: rejected ? wargaColors.dangerRed : wargaColors.primaryGreen }]}>
                {rejected ? 'DITOLAK' : 'DISETUJUI'}
              </Text>
            </View>
          </View>
          <Text style={styles.approvedTitle}>{r.suratType}</Text>
          <Text style={[styles.approvedMeta, rejected && { color: wargaColors.dangerRed }]}>
            {rejected ? 'Ditolak' : 'Disetujui'} {formatDateShort(r.updatedAt ?? r.createdAt)}
            {r.applicantName ? ` · a.n. ${r.applicantName}` : ''}
          </Text>
        </View>
        {suratIsApproved(r) && (
          <Pressable onPress={() => downloadPdf(r)} hitSlop={8} style={styles.dlBtn} disabled={downloading === r.id}>
            {downloading === r.id ? (
              <ActivityIndicator size="small" color={wargaColors.primaryGreen} />
            ) : (
              <Icon name="download-outline" size={20} color={wargaColors.primaryGreen} />
            )}
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Layanan Surat" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
      >
        <WargaSuratHeroCard jenisCount={SURAT_CATALOG.length} pendingCount={pendingCount} approvedCount={approvedCount} onAddTap={openCustom} />
        <View style={{ height: 16 }} />
        <WargaSuratSegmentToggle selected={segment} pendingBadge={activeRequests.length} approvedBadge={historyRequests.length} onChanged={setSegment} />
        <View style={{ height: 20 }} />

        {segment === 0 ? (
          <>
            <Text style={[wargaText.sectionTitle, { marginBottom: 12 }]}>Jenis Surat</Text>
            {SURAT_CATALOG.map((item) => (
              <WargaSuratTypeCard key={item.suratTypeKey} item={item} onTap={() => openForm(item)} />
            ))}
            {!loading && activeRequests.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 12 }}>
                  <Text style={wargaText.sectionTitle}>Permohonan Saya</Text>
                  {pendingCount > 0 && (
                    <View style={styles.menungguBadge}>
                      <Text style={styles.menungguText}>{pendingCount} MENUNGGU</Text>
                    </View>
                  )}
                </View>
                {activeRequests.map((r) => (
                  <WargaSuratRequestCard key={r.id} request={r} rtNumber={rt.rtNumber} />
                ))}
              </>
            )}

            {!loading && archivedRequests.length > 0 && (
              <>
                <View style={styles.arsipHeaderRow}>
                  <Icon name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.arsipHeader}>Arsip Surat</Text>
                </View>
                {groupByYearMonth(archivedRequests, (r) => r.createdAt).map((g) => (
                  <View key={g.key}>
                    <Text style={styles.monthHeader}>{g.label}</Text>
                    {g.items.map((r) => (
                      <WargaSuratRequestCard key={r.id} request={r} rtNumber={rt.rtNumber} />
                    ))}
                  </View>
                ))}
              </>
            )}
          </>
        ) : loading ? null : historyRequests.length === 0 ? (
          <WargaCard>
            <Text style={wargaText.greeting}>
              Belum ada riwayat surat. Surat yang tanggal pengajuannya sudah lewat (disetujui maupun
              ditolak) akan muncul di sini.
            </Text>
          </WargaCard>
        ) : (
          nestYearMonth(historyRequests).map((y) => {
            const yOpen = openYears.has(y.year);
            return (
              <View key={y.year} style={{ marginBottom: 10 }}>
                <Pressable style={styles.yearHeader} onPress={() => toggleNum(setOpenYears, y.year)}>
                  <Icon name="calendar" size={16} color={colors.textSecondary} />
                  <Text style={styles.yearText}>{y.year}</Text>
                  <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeText}>{y.count} surat</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Icon name={yOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                </Pressable>
                {yOpen &&
                  y.months.map((mg) => {
                    const mOpen = openMonths.has(mg.key);
                    return (
                      <View key={mg.key} style={styles.monthBlock}>
                        <Pressable style={styles.monthRow} onPress={() => toggleStr(setOpenMonths, mg.key)}>
                          <Icon name={mOpen ? 'chevron-down' : 'chevron-forward'} size={16} color={colors.textSecondary} />
                          <Text style={styles.monthName}>{BULAN[mg.month - 1]}</Text>
                          <View style={styles.yearBadge}>
                            <Text style={styles.yearBadgeText}>{mg.items.length}</Text>
                          </View>
                        </Pressable>
                        {mOpen && mg.items.map(renderHistoryCard)}
                      </View>
                    );
                  })}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={detailReq != null} transparent animationType="slide" onRequestClose={() => setDetailReq(null)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDetailReq(null)} />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {detailReq && (() => {
              const rejected = suratIsRejected(detailReq);
              return (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.detailHeader}>
                  <View style={[styles.approvedIcon, rejected && { backgroundColor: '#FEE2E2' }]}>
                    <Icon name={suratItemByTypeKey(detailReq.suratType)?.icon ?? 'document-text-outline'} size={20} color={rejected ? wargaColors.dangerRed : wargaColors.primaryGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>{detailReq.suratType}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      {rejected ? (
                        <View style={styles.badgeRejected}><Text style={styles.badgeRejectedText}>DITOLAK</Text></View>
                      ) : (
                        <>
                          <View style={styles.badgeApproved}><Text style={styles.badgeApprovedText}>DISETUJUI</Text></View>
                          <Text style={styles.detailNomor}>{suratNomorOf(detailReq)}</Text>
                        </>
                      )}
                    </View>
                  </View>
                  <Pressable onPress={() => setDetailReq(null)} hitSlop={8} style={styles.closeBtn}>
                    <Icon name="close-circle-outline" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {/* Status */}
                <View style={[styles.statusBox, rejected && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <Icon name={rejected ? 'close-circle' : 'checkmark-circle'} size={22} color={rejected ? wargaColors.dangerRed : wargaColors.primaryGreen} />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.statusTitle}>{rejected ? 'Surat Ditolak' : 'Surat Disetujui'}</Text>
                    <Text style={styles.statusSub}>
                      {rejected ? 'Ditolak' : 'Disetujui'} {formatDate(detailReq.updatedAt ?? detailReq.createdAt)}
                    </Text>
                    {rejected && (
                      <Text style={[styles.statusSub, { marginTop: 2 }]}>
                        Permohonan tidak disetujui Ketua RT. Silakan ajukan ulang bila diperlukan.
                      </Text>
                    )}
                  </View>
                </View>

                {/* Timeline */}
                <View style={styles.detailCard}>
                  <View style={styles.detailSectionRow}>
                    <Icon name="time-outline" size={16} color="#185FA5" />
                    <Text style={styles.detailSectionTitle}>Timeline</Text>
                  </View>
                  <TimelineItem color="#3B82F6" label="Diajukan" date={formatDate(detailReq.createdAt)} />
                  <TimelineItem
                    color={rejected ? wargaColors.dangerRed : wargaColors.primaryGreen}
                    label={rejected ? 'Ditolak' : 'Disetujui'}
                    date={formatDate(detailReq.updatedAt ?? detailReq.createdAt)}
                    last
                  />
                </View>

                {/* Verifikasi digital (hanya surat disetujui) */}
                {!rejected && (
                  <View style={styles.verifyBox}>
                    <View style={styles.verifyIcon}>
                      <Icon name="qr-code" size={20} color={wargaColors.primaryGreen} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.verifyTitle}>Terverifikasi Digital</Text>
                      <Text style={styles.verifySub}>Surat ini ditandatangani secara digital oleh Ketua RT {rt.rtNumber}.</Text>
                      <Text style={styles.verifyId}>ID: {suratNomorOf(detailReq)}-DSV</Text>
                    </View>
                  </View>
                )}

                {/* Data pemohon */}
                <View style={styles.detailSectionRow}>
                  <Icon name="person-outline" size={16} color="#185FA5" />
                  <Text style={styles.detailSectionTitle}>Data Orang dalam Surat</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.dataName}>{suratPersonName(detailReq, profile.fullName)}</Text>
                  <Text style={styles.dataSub}>
                    {[detailReq.gender, detailReq.religion].filter(Boolean).join(' • ') || '—'}
                  </Text>
                  <View style={styles.dataGrid}>
                    <DataCell label="NIK" value={detailReq.nik} />
                    <DataCell label="Tempat/Tgl Lahir" value={ttlOf(detailReq)} />
                    <DataCell label="Status Pernikahan" value={detailReq.maritalStatus} />
                    <DataCell label="Pekerjaan" value={detailReq.occupation} />
                  </View>
                  <DataCell label="Alamat" value={detailReq.submitterAddress ?? profile.address ?? rt.address} full />
                </View>

                {/* Keperluan */}
                <View style={styles.detailSectionRow}>
                  <Icon name="document-text-outline" size={16} color="#185FA5" />
                  <Text style={styles.detailSectionTitle}>Keperluan</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.keperluanText}>{detailReq.purpose || '—'}</Text>
                </View>

                {suratIsApproved(detailReq) && (
                  <Pressable
                    style={styles.detailDlBtn}
                    onPress={() => downloadPdf(detailReq)}
                    disabled={downloading === detailReq.id}
                  >
                    {downloading === detailReq.id ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Icon name="download-outline" size={18} color="#fff" />
                        <Text style={styles.detailDlText}>Unduh PDF</Text>
                      </>
                    )}
                  </Pressable>
                )}
                <View style={{ height: 16 }} />
              </ScrollView>
              );
            })()}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Notifikasi sukses — overlay mengambang (bukan bagian daftar) */}
      <Modal visible={submittedType != null} transparent animationType="fade" onRequestClose={() => setSubmittedType(null)}>
        <Pressable style={styles.successBackdrop} onPress={() => setSubmittedType(null)}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Icon name="checkmark-circle" size={30} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Permohonan Terkirim!</Text>
            <Text style={styles.successSub}>
              {submittedType} berhasil diajukan. Estimasi 2 hari kerja.
            </Text>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );

  function ttlOf(r: SuratRequest): string | null {
    if (!r.birthPlace && !r.birthDate) return null;
    return `${r.birthPlace ?? '-'}, ${r.birthDate ?? '-'}`;
  }
}

function TimelineItem({ color, label, date, last }: { color: string; label: string; date: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ alignItems: 'center', marginRight: 10 }}>
        <View style={[tlStyles.dot, { backgroundColor: color }]} />
        {!last && <View style={tlStyles.line} />}
      </View>
      <View style={{ paddingBottom: last ? 0 : 12 }}>
        <Text style={tlStyles.label}>{label}</Text>
        <Text style={tlStyles.date}>{date}</Text>
      </View>
    </View>
  );
}

function DataCell({ label, value, full }: { label: string; value: string | null; full?: boolean }) {
  return (
    <View style={{ width: full ? '100%' : '50%', marginTop: 10 }}>
      <Text style={tlStyles.cellLabel}>{label.toUpperCase()}</Text>
      <Text style={tlStyles.cellValue}>{value && value.trim() !== '' ? value : '—'}</Text>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  line: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#111' },
  date: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  cellLabel: { fontSize: 10, fontWeight: '600', color: '#9CA3AF', letterSpacing: 0.3 },
  cellValue: { fontSize: 13, fontWeight: '600', color: '#111', marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  successBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  successCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  successIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: wargaColors.primaryGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  successSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  menungguBadge: { paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#FEF3C7', borderRadius: 20 },
  menungguText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: wargaColors.lightGreen,
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 7,
  },
  addBtnText: { color: wargaColors.primaryGreen, fontWeight: '600', fontSize: 12 },
  arsipHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 4 },
  arsipHeader: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  monthHeader: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  yearText: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  yearBadge: { backgroundColor: wargaColors.lightGreen, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  yearBadgeText: { fontSize: 11, fontWeight: '600', color: wargaColors.primaryGreen },
  monthBlock: { marginLeft: 10, marginBottom: 4 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 6 },
  monthName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  approvedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: wargaColors.primaryGreen,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  approvedIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: wargaColors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvedNomor: { fontSize: 11, color: colors.textSecondary },
  approvedTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 1 },
  approvedMeta: { fontSize: 12, color: wargaColors.primaryGreen, marginTop: 2 },
  dlBtn: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: wargaColors.lightGreen },
  expiredBadge: { backgroundColor: '#FEE2E2', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  expiredBadgeText: { fontSize: 8, fontWeight: '700', color: '#B91C1C', letterSpacing: 0.3 },
  statusPill: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 1 },
  statusPillApproved: { backgroundColor: wargaColors.lightGreen },
  statusPillRejected: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.3 },
  emptyLine: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic', marginBottom: 8 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: wargaColors.bgColor, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 8, maxHeight: '88%' },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  detailTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  detailNomor: { fontSize: 11, color: colors.textSecondary },
  badgeApproved: { backgroundColor: wargaColors.lightGreen, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeApprovedText: { fontSize: 9, fontWeight: '700', color: wargaColors.primaryGreen, letterSpacing: 0.3 },
  badgeRejected: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  badgeRejectedText: { fontSize: 9, fontWeight: '700', color: wargaColors.dangerRed, letterSpacing: 0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: wargaColors.lightGreen, borderRadius: 14, padding: 14, marginBottom: 14 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#14532D' },
  statusSub: { fontSize: 12, color: '#166534', marginTop: 1 },
  detailCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 14 },
  detailSectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  detailSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  verifyBox: { flexDirection: 'row', gap: 12, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 14, padding: 14, marginBottom: 14 },
  verifyIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  verifyTitle: { fontSize: 13, fontWeight: '700', color: '#14532D' },
  verifySub: { fontSize: 12, color: '#166534', marginTop: 2, lineHeight: 16 },
  verifyId: { fontSize: 11, color: '#059669', marginTop: 3, fontWeight: '600' },
  dataName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  dataSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  keperluanText: { fontSize: 13, color: colors.textPrimary },
  detailDlBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: wargaColors.primaryGreen, borderRadius: 14, paddingVertical: 14, marginTop: 4 },
  detailDlText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
