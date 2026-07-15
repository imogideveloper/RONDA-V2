// Port dari lib/pages/warga/warga_iuran_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { useToast } from '../../components/Toast';
import {
  WargaIuranDownloadCard,
  WargaIuranEwalletTile,
  WargaIuranHeroSection,
  WargaIuranHistoryCard,
  WargaIuranQrisCard,
  WargaIuranSection,
  WargaIuranTotalsCard,
  WargaIuranVirtualAccountCard,
} from '../../components/warga/IuranWidgets';
import { rtService } from '../../services/rtService';
import { wargaHomeLoader } from '../../services/wargaHomeLoader';
import { IuranRecord, iuranIsPaid, iuranIsUnpaid, rtDisplayLabel } from '../../types/models';
import { iuranPeriodTitle } from '../../lib/period';
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
  const phoneDigits = profile.phone.replace(/\D/g, '');
  const ewalletPhone = phoneDigits.length >= 10 ? phoneDigits : '081234567891';

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
          <View style={{ height: 12 }} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <WargaIuranEwalletTile label="OVO" phone={ewalletPhone} icon="wallet-outline" color="#5B21B6" />
            <WargaIuranEwalletTile label="GOPAY" phone={ewalletPhone} icon="card-outline" color="#0D9488" />
            <WargaIuranEwalletTile label="DANA" phone={ewalletPhone} icon="phone-portrait-outline" color="#2563EB" />
          </View>
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
              {groupByYearMonth(bills, (b) => dateFromPeriodKey(b.periodKey)).map((g) => (
                <View key={g.key}>
                  <Text style={styles.monthHeader}>{g.label}</Text>
                  {g.items.map((b) => (
                    <WargaIuranHistoryCard key={b.id} record={b} components={rt.iuranComponents} onPay={iuranIsUnpaid(b) ? openBayar : undefined} />
                  ))}
                </View>
              ))}
              <View style={{ height: 12 }} />
              <WargaIuranTotalsCard
                paidTotal={paidTotal}
                paidMonths={paidBills.length}
                unpaidTotal={unpaidTotal}
                unpaidMonths={unpaidBills.length}
              />
              <View style={{ height: 12 }} />
              <WargaIuranDownloadCard
                lastPaidLabel={lastPaidLabel}
                onTap={paidBills.length > 0 ? () => toast.success('Unduh bukti — segera hadir') : undefined}
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
  monthHeader: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginTop: 10, marginBottom: 8, textTransform: 'uppercase' },
});
