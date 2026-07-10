// Port dari lib/pages/warga/warga_tagihan_iuran_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { PrimaryButton } from '../../components/Card';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { useToast } from '../../components/Toast';
import {
  WargaMenungguVerifikasiCard,
  WargaPaymentMethodTile,
  WargaTagihanBillTile,
  WargaTagihanHeroCard,
  WargaTagihanPayBar,
  WargaUploadBuktiBox,
} from '../../components/warga/TagihanWidgets';
import { rtService } from '../../services/rtService';
import { storageService, PickedImage } from '../../services/storageService';
import { IuranRecord, iuranIsAwaiting, iuranIsPending, rtDisplayLabel } from '../../types/models';
import { groupIuranByYearMonth, iuranPeriodTitle, maxDaysLate } from '../../lib/period';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaTagihanIuran'>;
type Step = 'list' | 'confirm' | 'methods' | 'paymentDetail' | 'success';
type PayMethod = 'qris' | 'transfer' | 'cash';
const DEFAULT_AMOUNT = 50000;

export default function WargaTagihanIuranScreen({ route, navigation }: Props) {
  const { profile, rt, onDone } = route.params;
  const toast = useToast();

  const [bills, setBills] = useState<IuranRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('list');
  const [method, setMethod] = useState<PayMethod | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [proof, setProof] = useState<PickedImage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await rtService.ensureMyIuran(DEFAULT_AMOUNT);
    } catch {
      // abaikan
    }
    const list = await rtService.getIuranRecords(rt.id, profile.id);
    setBills(list);
    setOpenYears(new Set(groupIuranByYearMonth(list.filter(iuranIsPending)).map((g) => g.year)));
    setLoading(false);
  }, [rt.id, profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = bills.filter(iuranIsPending);
  const awaiting = bills.filter(iuranIsAwaiting);
  const selected = pending.filter((b) => selectedIds.has(b.id));
  const totalUnpaid = pending.reduce((s, b) => s + b.amount, 0);
  const selectedTotal = selected.reduce((s, b) => s + b.amount, 0);
  const daysLate = maxDaysLate(pending);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      prev.size === pending.length ? new Set() : new Set(pending.map((b) => b.id)),
    );

  const pickProof = async () => {
    const file = await storageService.pickImageFromGallery();
    if (file) setProof(file);
  };

  const submitPayments = async () => {
    if (selected.length === 0 || method == null) return;
    setSubmitting(true);
    try {
      for (let i = 0; i < selected.length; i++) {
        const bill = selected[i];
        let proofUrl: string | undefined;
        if (proof && i === 0) {
          proofUrl = await storageService.uploadIuranPaymentProof(rt.id, profile.id, proof);
        }
        await rtService.submitIuranPayment(bill.id, method, proofUrl);
      }
      setStep('success');
    } catch (e: any) {
      const msg =
        String(e?.message ?? e).includes('row-level security') ||
        String(e?.message ?? e).includes('Storage')
          ? 'Gagal upload bukti. Cek konfigurasi Storage di Supabase.'
          : 'Gagal mengirim bukti pembayaran.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const finish = () => {
    onDone?.();
    navigation.goBack();
  };

  const goBack = () => {
    if (step === 'list') navigation.goBack();
    else if (step === 'success') finish();
    else if (step === 'paymentDetail') setStep('methods');
    else if (step === 'methods') setStep('confirm');
    else setStep('list');
  };

  const title =
    step === 'methods' ? 'Metode Pembayaran' : step === 'success' ? 'Selesai' : 'Tagihan Iuran';

  const Hero = () => (
    <WargaTagihanHeroCard total={totalUnpaid} bulanTertunggak={pending.length} daysLate={daysLate} />
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.appbar}>
        <Pressable onPress={goBack} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
        </Pressable>
        <Text style={[wargaText.sectionTitle, { flex: 1, textAlign: 'center' }]}>{title}</Text>
        <View style={{ width: 34 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.emerald} size="large" />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: step === 'list' && selectedIds.size > 0 ? 20 : 24 },
            ]}
          >
            {step === 'list' && (
              <ListStep
                Hero={Hero}
                awaiting={awaiting}
                pending={pending}
                selectedIds={selectedIds}
                expandedId={expandedId}
                openYears={openYears}
                onToggleYear={(y) =>
                  setOpenYears((prev) => {
                    const next = new Set(prev);
                    if (next.has(y)) next.delete(y);
                    else next.add(y);
                    return next;
                  })
                }
                onSelect={toggleSelect}
                onExpand={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                onToggleAll={toggleSelectAll}
              />
            )}

            {step === 'confirm' && (
              <View>
                <Hero />
                <View style={{ height: 20 }} />
                <Text style={wargaText.sectionTitle}>Konfirmasi Pembayaran</Text>
                <Text style={[wargaText.greeting, { marginTop: 6, marginBottom: 16 }]}>
                  Anda akan membayar tagihan berikut:
                </Text>
                {selected.map((b) => (
                  <WargaCard key={b.id} radius={14} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[wargaText.sectionTitle, { fontSize: 15 }]}>{iuranPeriodTitle(b)}</Text>
                      <Text style={[wargaText.greeting, { fontSize: 12 }]}>Keamanan + Kebersihan</Text>
                    </View>
                    <Text style={styles.bold}>{formatRupiah(b.amount)}</Text>
                  </WargaCard>
                ))}
                <WargaCard radius={14} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[wargaText.greeting, { fontWeight: '600' }]}>Total Pembayaran</Text>
                  <Text style={[styles.bold, { fontSize: 16 }]}>{formatRupiah(selectedTotal)}</Text>
                </WargaCard>
                <View style={{ height: 24 }} />
                <PrimaryButton label="Pilih Metode Pembayaran" onPress={() => setStep('methods')} />
              </View>
            )}

            {step === 'methods' && (
              <View>
                <Hero />
                <View style={{ height: 20 }} />
                <Text style={wargaText.sectionTitle}>Metode Pembayaran</Text>
                <Text style={[wargaText.greeting, { marginBottom: 16 }]}>
                  {formatRupiah(selectedTotal)} — {selected.length} tagihan
                </Text>
                <WargaPaymentMethodTile
                  icon="qr-code" iconBg={wargaColors.lightGreen} iconColor={wargaColors.primaryGreen}
                  title="QRIS" subtitle="Scan QR — semua e-wallet & bank"
                  onTap={() => { setMethod('qris'); setStep('paymentDetail'); }}
                />
                <WargaPaymentMethodTile
                  icon="business" iconBg={wargaColors.accentBlue} iconColor="#185FA5"
                  title="Transfer Bank" subtitle="Transfer via ATM/mobile banking BRI"
                  onTap={() => { setMethod('transfer'); setStep('paymentDetail'); }}
                />
                <WargaPaymentMethodTile
                  icon="cash" iconBg={wargaColors.accentYellow} iconColor="#BA7517"
                  title="Bayar Tunai" subtitle="Serahkan ke Bendahara RT"
                  onTap={() => { setMethod('cash'); setStep('paymentDetail'); }}
                />
              </View>
            )}

            {step === 'paymentDetail' && (
              <View>
                <Hero />
                <View style={{ height: 16 }} />
                <PaymentDetail method={method ?? 'qris'} rtLabel={rtDisplayLabel(rt)} rtName={rt.name} total={selectedTotal} />
                <View style={{ height: 20 }} />
                <Text style={wargaText.sectionTitle}>Upload Bukti Pembayaran</Text>
                <Text style={[wargaText.greeting, { fontSize: 12, marginBottom: 10 }]}>
                  Upload screenshot/foto bukti transfer atau tanda terima
                </Text>
                <WargaUploadBuktiBox onTap={pickProof} imageUri={proof?.uri} />
                <View style={{ height: 20 }} />
                <PrimaryButton
                  label={submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran'}
                  onPress={submitPayments}
                  loading={submitting}
                  disabled={proof == null}
                />
              </View>
            )}

            {step === 'success' && (
              <View>
                <Hero />
                <View style={{ height: 32, alignItems: 'center' }} />
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={48} color={wargaColors.primaryGreen} />
                </View>
                <Text style={[wargaText.sectionTitle, { fontSize: 22, textAlign: 'center', marginTop: 16 }]}>
                  Bukti Terkirim!
                </Text>
                <Text style={[wargaText.greeting, { textAlign: 'center', marginTop: 8, lineHeight: 22 }]}>
                  Bukti pembayaran sedang diverifikasi Bendahara RT. Setelah disetujui, status tagihan
                  berubah menjadi lunas dan tampil di Papan info Beranda.
                </Text>
                <View style={{ height: 20 }} />
                <WargaCard>
                  <Text style={wargaText.labelCaps}>RINGKASAN</Text>
                  <View style={{ height: 12 }} />
                  <SummaryRow label="Metode" value={(method ?? 'qris').toUpperCase()} />
                  <SummaryRow label="Jumlah Tagihan" value={`${selected.length} periode`} />
                  <SummaryRow label="Total" value={formatRupiah(selectedTotal)} />
                </WargaCard>
                <View style={{ height: 24 }} />
                <PrimaryButton label="Kembali ke Beranda" onPress={finish} />
              </View>
            )}
          </ScrollView>

          {step === 'list' && selectedIds.size > 0 && (
            <WargaTagihanPayBar count={selectedIds.size} total={selectedTotal} onPay={() => setStep('confirm')} />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function ListStep({
  Hero, awaiting, pending, selectedIds, expandedId, openYears, onToggleYear, onSelect, onExpand, onToggleAll,
}: {
  Hero: React.FC;
  awaiting: IuranRecord[];
  pending: IuranRecord[];
  selectedIds: Set<string>;
  expandedId: string | null;
  openYears: Set<number>;
  onToggleYear: (y: number) => void;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onToggleAll: () => void;
}) {
  const yearGroups = groupIuranByYearMonth(pending);
  return (
    <View>
      <Hero />
      {awaiting.length > 0 && (
        <>
          <View style={{ height: 20 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Ionicons name="time-outline" size={18} color="#EA580C" />
            <Text style={[wargaText.sectionTitle, { color: '#EA580C' }]}>Menunggu Verifikasi</Text>
          </View>
          {awaiting.map((b) => <WargaMenungguVerifikasiCard key={b.id} bill={b} />)}
        </>
      )}
      <View style={{ height: 20 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={[wargaText.sectionTitle, { flex: 1 }]}>Belum Dibayar</Text>
        {pending.length > 0 && (
          <Pressable onPress={onToggleAll} style={styles.pilihSemua}>
            <Text style={styles.pilihSemuaText}>Pilih Semua</Text>
          </Pressable>
        )}
      </View>
      {pending.length === 0 ? (
        <Text style={[wargaText.greeting, { textAlign: 'center', paddingVertical: 24 }]}>
          {awaiting.length > 0 ? 'Semua tagihan sedang diverifikasi Bendahara.' : 'Tidak ada tagihan belum dibayar.'}
        </Text>
      ) : (
        yearGroups.map((yg) => {
          const bills = yg.months.flatMap((m) => m.items);
          const selectedCount = bills.filter((b) => selectedIds.has(b.id)).length;
          const yearTotal = yg.months.reduce((s, m) => s + m.totalAmount, 0);
          const open = openYears.has(yg.year);
          return (
            <View key={yg.year}>
              <Pressable onPress={() => onToggleYear(yg.year)} style={styles.yearHead}>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textPrimary} />
                <Text style={styles.yearText}>{yg.year}</Text>
                <View style={styles.yearBadge}>
                  <Text style={styles.yearBadgeText}>{bills.length} tagihan</Text>
                </View>
                {selectedCount > 0 && (
                  <View style={styles.yearBadgeGreen}>
                    <Text style={styles.yearBadgeGreenText}>{selectedCount} dipilih</Text>
                  </View>
                )}
                <Text style={styles.yearTotal}>{formatRupiah(yearTotal)}</Text>
              </Pressable>
              {open &&
                bills.map((b) => (
                  <WargaTagihanBillTile
                    key={b.id}
                    bill={b}
                    selected={selectedIds.has(b.id)}
                    expanded={expandedId === b.id}
                    onToggleSelect={() => onSelect(b.id)}
                    onToggleExpand={() => onExpand(b.id)}
                  />
                ))}
            </View>
          );
        })
      )}
    </View>
  );
}

function PaymentDetail({ method, rtLabel, rtName, total }: { method: PayMethod; rtLabel: string; rtName: string; total: number }) {
  if (method === 'qris') {
    return (
      <WargaCard>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.qrBox}>
            <Ionicons name="qr-code" size={120} color={wargaColors.primaryGreen} />
          </View>
          <Text style={[wargaText.sectionTitle, { fontSize: 14, marginTop: 12 }]}>{rtLabel}</Text>
          <Text style={wargaText.greeting}>{formatRupiah(total)}</Text>
          <Text style={[wargaText.greeting, { fontSize: 12, textAlign: 'center', marginTop: 12 }]}>
            Scan QR lalu upload bukti pembayaran di bawah.
          </Text>
        </View>
      </WargaCard>
    );
  }
  if (method === 'transfer') {
    return (
      <WargaCard>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.trfIcon}>
            <Ionicons name="card" size={22} color="#185FA5" />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={[wargaText.sectionTitle, { fontSize: 14 }]}>Transfer Bank BRI</Text>
            <Text style={wargaText.greeting}>{rtName} Kas Iuran</Text>
          </View>
        </View>
        <View style={styles.rekBox}>
          <Text style={wargaText.labelCaps}>NOMOR REKENING</Text>
          <Text style={styles.rekNumber}>0089 0100 5003 510</Text>
        </View>
      </WargaCard>
    );
  }
  return (
    <View style={[styles.cashCard]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="cash" size={28} color="#BA7517" />
        <Text style={[wargaText.sectionTitle, { color: '#92400E', marginLeft: 10 }]}>Pembayaran Tunai</Text>
      </View>
      <Text style={[wargaText.greeting, { marginTop: 8, lineHeight: 20 }]}>
        Serahkan uang tunai ke Bendahara RT dan minta tanda terima. Upload foto tanda terima sebagai bukti.
      </Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={[wargaText.greeting, { flex: 1 }]}>{label}</Text>
      <Text style={{ fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  bold: { fontWeight: '700', color: colors.textPrimary },
  pilihSemua: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: wargaColors.dangerRed },
  pilihSemuaText: { fontSize: 12, fontWeight: '600', color: wargaColors.dangerRed },
  yearHead: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF5F5', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA',
  },
  yearText: { fontWeight: '700', color: colors.textPrimary },
  yearBadge: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: wargaColors.lightRed, borderRadius: 8 },
  yearBadgeText: { fontSize: 10, fontWeight: '600', color: wargaColors.dangerRed },
  yearBadgeGreen: { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: wargaColors.lightGreen, borderRadius: 8 },
  yearBadgeGreenText: { fontSize: 10, fontWeight: '600', color: wargaColors.primaryGreen },
  yearTotal: { flex: 1, textAlign: 'right', fontWeight: '700', color: wargaColors.dangerRed },
  successIcon: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: wargaColors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  qrBox: { width: 160, height: 160, backgroundColor: wargaColors.lightGreen, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  trfIcon: { padding: 8, backgroundColor: wargaColors.accentBlue, borderRadius: 10 },
  rekBox: { marginTop: 14, padding: 14, backgroundColor: colors.background, borderRadius: 12 },
  rekNumber: { fontSize: 18, fontWeight: '700', letterSpacing: 1.2, marginTop: 6, color: colors.textPrimary },
  cashCard: { padding: 16, borderRadius: 14, backgroundColor: '#FFFBEB', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FDE68A' },
});
