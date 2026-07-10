// Port dari lib/pages/warga/warga_layanan_surat_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { SuratRequest, suratIsApproved, suratIsPending, suratIsRejected } from '../../types/models';
import { SURAT_CATALOG, SuratItem, suratItemByTypeKey } from '../../lib/suratCatalog';
import { suratActive, groupByYearMonth } from '../../lib/papanInfo';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaLayananSurat'>;

export default function WargaLayananSuratScreen({ route }: Props) {
  const { profile, rt, initialSuratType } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const [requests, setRequests] = useState<SuratRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [segment, setSegment] = useState(0);

  const load = useCallback(async () => {
    try {
      const list = await rtService.getSuratRequests(rt.id);
      setRequests(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rt.id]);

  const openForm = useCallback(
    (item: SuratItem) => {
      navigation.navigate('WargaSuratForm', {
        profile,
        rt,
        suratItem: item,
        onSubmitted: () => {
          setSegment(0);
          load();
          toast.success('Permohonan surat terkirim');
        },
      });
    },
    [navigation, profile, rt, load, toast],
  );

  const openCustom = useCallback(() => {
    navigation.navigate('WargaSuratCustom', {
      profile,
      rt,
      onSubmitted: () => {
        setSegment(0);
        load();
        toast.success('Permohonan surat terkirim');
      },
    });
  }, [navigation, profile, rt, load, toast]);

  useEffect(() => {
    load();
  }, [load]);

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

  const pendingCount = requests.filter(suratIsPending).length;
  const approvedCount = requests.filter(suratIsApproved).length;
  const activeRequests = requests.filter((r) => !suratIsApproved(r) && suratActive(r));
  const approvedRequests = requests.filter(suratIsApproved);
  const archivedRequests = requests.filter((r) => !suratActive(r));

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Layanan Surat" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
      >
        <WargaSuratHeroCard jenisCount={SURAT_CATALOG.length} pendingCount={pendingCount} approvedCount={approvedCount} />
        <View style={{ height: 16 }} />
        <WargaSuratSegmentToggle selected={segment} pendingBadge={activeRequests.length} approvedBadge={approvedCount} onChanged={setSegment} />
        <View style={{ height: 20 }} />

        {segment === 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={[wargaText.sectionTitle, { flex: 1 }]}>Jenis Surat</Text>
              <Pressable style={styles.addBtn} onPress={openCustom}>
                <Icon name="add" size={16} color={wargaColors.primaryGreen} />
                <Text style={styles.addBtnText}>Surat Lainnya</Text>
              </Pressable>
            </View>
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
                  <WargaSuratRequestCard
                    key={r.id}
                    request={r}
                    rtNumber={rt.rtNumber}
                    onReapply={
                      suratIsRejected(r)
                        ? () => {
                            const item = suratItemByTypeKey(r.suratType) ?? SURAT_CATALOG.find((c) => c.title === r.suratType) ?? SURAT_CATALOG[0];
                            openForm(item);
                          }
                        : undefined
                    }
                  />
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
        ) : loading ? null : approvedRequests.length === 0 ? (
          <WargaCard>
            <Text style={wargaText.greeting}>
              Belum ada surat yang disetujui. Setelah Ketua RT menyetujui permohonan, surat akan
              muncul di sini.
            </Text>
          </WargaCard>
        ) : (
          approvedRequests.map((r) => <WargaSuratRequestCard key={r.id} request={r} rtNumber={rt.rtNumber} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
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
});
