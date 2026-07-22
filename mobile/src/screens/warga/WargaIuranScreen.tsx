// Port dari lib/pages/warga/warga_iuran_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { useToast } from '../../components/Toast';
import {
  WargaIuranDownloadCard,
  WargaIuranHeroSection,
  WargaIuranHistoryCard,
  WargaIuranQrisCard,
  WargaIuranSection,
  WargaIuranTotalsCard,
  WargaIuranVirtualAccountCard,
} from '../../components/warga/IuranWidgets';
import { rtService } from '../../services/rtService';
import { wargaHomeLoader } from '../../services/wargaHomeLoader';
import {
  IuranRecord,
  iuranIsPaid,
  iuranIsUnpaid,
  iuranPaymentMethodLabel,
  profileIsBendahara,
  profileIsKetua,
  rtDisplayLabel,
} from '../../types/models';
import { iuranPeriodTitle, monthLabel } from '../../lib/period';
import { buildIuranReceiptHtml } from '../../lib/iuranReceiptHtml';
import { exportHtmlAsPdf } from '../../lib/suratPdf';
import { groupByYearMonth, dateFromPeriodKey } from '../../lib/papanInfo';
import { Profile, RtUnit } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';
import { Text } from 'react-native';

const DEFAULT_AMOUNT = 50000;

interface Props {
  profile: Profile;
  rt: RtUnit;
  onRtSwitched?: () => void;
}

export function WargaIuranScreen({ profile, rt }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const [bills, setBills] = useState<IuranRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggleGroup = (key: string) => setExpanded((s) => ({ ...s, [key]: !s[key] }));

  const load = useCallback(async () => {
    try {
      await rtService.ensureMyIuran(DEFAULT_AMOUNT).catch(() => undefined);
      const list = await rtService.getIuranRecords(rt.id, profile.id);
      setBills(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rt.id, profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const current = bills.length > 0 ? bills[0] : null;
  const payAmount = current?.amount ?? DEFAULT_AMOUNT;
  const paidBills = bills.filter(iuranIsPaid);
  const unpaidBills = bills.filter((b) => !iuranIsPaid(b));
  const paidTotal = paidBills.reduce((s, b) => s + b.amount, 0);
  const unpaidTotal = unpaidBills.reduce((s, b) => s + b.amount, 0);
  const canPay = current != null && iuranIsUnpaid(current);
  const lastPaidLabel = paidBills.length > 0 ? iuranPeriodTitle(paidBills[0]) : '—';

  const vaNumber = `0089-01-005-${rt.rtNumber.replace(/\D/g, '').padStart(3, '0')}-510`;

  const shortDate = (d: Date | null): string =>
    d ? `${d.getDate()} ${monthLabel(d.getMonth() + 1)} ${d.getFullYear()}` : '—';

  const downloadReceipt = async () => {
    if (paidBills.length === 0 || downloading) return;
    setDownloading(true);
    try {
      const pengurus = await rtService.getRtPengurus(rt.id).catch(() => []);
      const ketua = pengurus.find(profileIsKetua);
      const bendahara = pengurus.find(profileIsBendahara);
      // Urutkan periode lunas dari terlama ke terbaru untuk rekap.
      const ordered = [...paidBills].sort((a, b) => a.periodKey.localeCompare(b.periodKey));
      const html = buildIuranReceiptHtml({
        rt,
        wargaName: profile.fullName,
        wargaPhone: profile.phone,
        rows: ordered.map((b) => ({
          periodLabel: iuranPeriodTitle(b),
          paidDateLabel: shortDate(b.paidAt),
          method: iuranPaymentMethodLabel(b),
          amount: b.amount,
        })),
        total: paidTotal,
        ketuaName: ketua?.fullName ?? '',
        bendaharaName: bendahara?.fullName ?? '',
        signatureUrl: rt.signatureUrl,
      });
      await exportHtmlAsPdf(html, 'Simpan / Bagikan Bukti Iuran', 'Bukti-Pembayaran-Iuran.pdf');
    } catch (e: any) {
      toast.error('Gagal membuat bukti pembayaran');
    } finally {
      setDownloading(false);
    }
  };

  const openBayar = () => {
    navigation.navigate('WargaTagihanIuran', {
      profile,
      rt,
      onDone: () => {
        wargaHomeLoader.invalidate();
        load();
        toast.success('Bukti pembayaran terkirim. Menunggu verifikasi.');
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <WargaIuranHeroSection currentBill={current} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.emerald}
          />
        }
      >
        <WargaIuranSection title="Metode Pembayaran">
          <WargaIuranQrisCard
            rtLabel={`${rtDisplayLabel(rt)} · ${rt.name}`}
            amount={payAmount}
            onScan={canPay ? openBayar : () => toast.success('Tidak ada tagihan aktif')}
          />
          <View style={{ height: 12 }} />
          <WargaIuranVirtualAccountCard
            rtNumber={rt.rtNumber}
            accountNumber={vaNumber}
            accountName={`a.n. RT ${rt.rtNumber} Kas Iuran`}
          />
        </WargaIuranSection>

        <View style={{ height: 32 }} />

        <WargaIuranSection
          title="Riwayat Pembayaran"
          trailing={paidBills.length > 0 ? `${paidBills.length} bulan lunas` : null}
        >
          {loading ? null : bills.length === 0 ? (
            <WargaCard>
              <Text style={[wargaText.greeting, { textAlign: 'center', paddingVertical: 12 }]}>
                Belum ada riwayat. Tarik ke bawah untuk memuat ulang.
              </Text>
            </WargaCard>
          ) : (
            <>
              {groupByYearMonth(bills, (b) => dateFromPeriodKey(b.periodKey)).map((g) => {
                const open = !!expanded[g.key];
                return (
                  <View key={g.key}>
                    <Pressable style={styles.monthHeaderRow} onPress={() => toggleGroup(g.key)}>
                      <Text style={styles.monthHeader}>{g.label}</Text>
                      <View style={styles.monthHeaderRight}>
                        {g.items.length > 1 && <Text style={styles.monthCount}>{g.items.length} pembayaran</Text>}
                        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
                      </View>
                    </Pressable>
                    {open && g.items.map((b) => (
                      <WargaIuranHistoryCard key={b.id} record={b} components={rt.iuranComponents} onPay={iuranIsUnpaid(b) ? openBayar : undefined} />
                    ))}
                  </View>
                );
              })}
              <View style={{ height: 12 }} />
              <WargaIuranTotalsCard
                paidTotal={paidTotal}
                paidMonths={paidBills.length}
                unpaidTotal={unpaidTotal}
                unpaidMonths={unpaidBills.length}
              />
              <View style={{ height: 12 }} />
              <WargaIuranDownloadCard
                lastPaidLabel={downloading ? 'Menyiapkan PDF…' : lastPaidLabel}
                onTap={paidBills.length > 0 ? downloadReceipt : undefined}
              />
            </>
          )}
        </WargaIuranSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  monthHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  monthHeader: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase' },
  monthHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  monthCount: { fontSize: 11, color: colors.textHint, fontWeight: '600' },
});
