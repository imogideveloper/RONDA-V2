// Port dari lib/pages/warga/warga_riwayat_transaksi_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, formatRupiah } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import {
  WargaKasTransactionCard,
  WargaMonthExpansionTile,
  WargaPageSummaryDarkCard,
  WargaYearExpansionTile,
} from '../../components/warga/DetailWidgets';
import { rtService } from '../../services/rtService';
import { KasSummary, KasTransaction, emptyKasSummary } from '../../types/models';
import { groupKasKeluarByYearMonth, monthLabel } from '../../lib/period';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaRiwayatTransaksi'>;

export default function WargaRiwayatTransaksiScreen({ route }: Props) {
  const { rt } = route.params;
  const [kas, setKas] = useState<KasSummary>(emptyKasSummary());
  const [txs, setTxs] = useState<KasTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [k, t] = await Promise.all([
      rtService.getKasSummary(rt.id),
      rtService.getKasTransactions(rt.id, 200),
    ]);
    setKas(k);
    setTxs(t);
    setLoading(false);
    setRefreshing(false);
  }, [rt.id]);

  useEffect(() => {
    load();
  }, [load]);

  const yearGroups = groupKasKeluarByYearMonth(txs);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Riwayat Transaksi RT" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.emerald} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          <WargaPageSummaryDarkCard saldo={kas.saldo} totalKeluar={kas.totalKeluar} />
          <Text style={styles.note}>
            Pengeluaran dicatat Ketua RT & Bendahara. Ketuk tahun → bulan → detail transaksi.
          </Text>
          {yearGroups.length === 0 ? (
            <Text style={styles.empty}>Belum ada pengeluaran kas RT.</Text>
          ) : (
            yearGroups.map((yg) => {
              const yearTotal = yg.months.reduce((s, m) => s + m.totalAmount, 0);
              return (
                <WargaYearExpansionTile
                  key={yg.year}
                  year={yg.year}
                  monthCount={yg.months.length}
                  trailingAmount={`- ${formatRupiah(yearTotal)}`}
                  trailingColor={colors.danger}
                >
                  {yg.months.map((mg) => (
                    <WargaMonthExpansionTile
                      key={mg.month}
                      monthTitle={monthLabel(mg.month)}
                      itemCount={mg.items.length}
                      trailingAmount={`- ${formatRupiah(mg.totalAmount)}`}
                      trailingColor={colors.danger}
                    >
                      {mg.items.map((tx) => (
                        <WargaKasTransactionCard key={tx.id} tx={tx} />
                      ))}
                    </WargaMonthExpansionTile>
                  ))}
                </WargaYearExpansionTile>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  note: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginTop: 8, marginBottom: 16 },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 24 },
});
