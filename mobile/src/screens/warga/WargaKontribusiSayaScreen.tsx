// Port dari lib/pages/warga/warga_kontribusi_saya_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import {
  WargaKontribusiHeroCard,
  WargaPaidIuranCard,
  WargaYearExpansionTile,
} from '../../components/warga/DetailWidgets';
import { rtService } from '../../services/rtService';
import { IuranRecord, iuranIsPaid } from '../../types/models';
import { groupIuranByYearMonth } from '../../lib/period';
import type { RootStackParamList } from '../../navigation/types';
import { Text } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaKontribusiSaya'>;

export default function WargaKontribusiSayaScreen({ route }: Props) {
  const { profile, rt } = route.params;
  const [paid, setPaid] = useState<IuranRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const all = await rtService.getIuranRecords(rt.id, profile.id);
    setPaid(all.filter(iuranIsPaid));
    setLoading(false);
    setRefreshing(false);
  }, [rt.id, profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const total = paid.reduce((s, b) => s + b.amount, 0);
  const yearGroups = groupIuranByYearMonth(paid);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Kontribusi Saya" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.emerald} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          <WargaKontribusiHeroCard total={total} bulanCount={paid.length} />
          <View style={{ height: 20 }} />
          {yearGroups.length === 0 ? (
            <WargaCard>
              <Text style={wargaText.greeting}>
                Belum ada iuran yang lunas. Setelah Bendahara memverifikasi pembayaran, riwayat akan
                muncul di sini.
              </Text>
            </WargaCard>
          ) : (
            yearGroups.map((yg) => {
              const yearTotal = yg.months.reduce((s, m) => s + m.totalAmount, 0);
              return (
                <WargaYearExpansionTile
                  key={yg.year}
                  year={yg.year}
                  monthCount={yg.months.length}
                  trailingAmount={formatRupiah(yearTotal)}
                  trailingColor={wargaColors.primaryGreen}
                  accentBadge
                  defaultOpen
                >
                  {yg.months.flatMap((mg) => mg.items).map((rec) => (
                    <WargaPaidIuranCard key={rec.id} record={rec} />
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
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
});
