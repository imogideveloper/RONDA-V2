// Port dari lib/pages/tabs/home_tab.dart + ketua_rt_home_view.dart + bendahara_home_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import {
  WargaAksiCepatGrid,
  WargaBerandaHeader,
  WargaHomeStatsRow,
  WargaSectionHeader,
} from '../../components/warga/BerandaWidgets';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaMenuTile } from '../../components/warga/DashboardWidgets';
import {
  KasHeroCard,
  KetuaQuickActionGrid,
  WargaEmptyState,
  WargaPengumumanFeedCard,
} from '../../components/warga/PengurusWidgets';
import { announcementReadService } from '../../services/announcementReadService';
import { rtService } from '../../services/rtService';
import {
  Announcement,
  KasSummary,
  Profile,
  RtUnit,
  emptyKasSummary,
  iuranIsPaid,
  profileIsKetua,
  rtDisplayLabel,
  suratIsPending,
} from '../../types/models';
import { greetingByTime, honorificName } from '../../lib/date';
import type { RootStackParamList } from '../../navigation/types';
import type { OfficerTabNav } from './PengurusMainShell';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onNavigateTab: OfficerTabNav;
}

export function PengurusHomeScreen({ profile, rt, onNavigateTab }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [kas, setKas] = useState<KasSummary>(emptyKasSummary());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [belumBayar, setBelumBayar] = useState(0);
  const [suratPending, setSuratPending] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isKetua = profileIsKetua(profile);

  const load = useCallback(async () => {
    const [k, ann, bills] = await Promise.all([
      rtService.getKasSummary(rt.id),
      rtService.getAnnouncements(rt.id),
      rtService.getIuranRecords(rt.id),
    ]);
    setKas(k);
    setAnnouncements(ann);
    setBelumBayar(bills.filter((b) => !iuranIsPaid(b)).length);
    if (isKetua) {
      const surat = await rtService.getSuratRequests(rt.id, true);
      setSuratPending(surat.filter(suratIsPending).length);
    }
    setUnread(await announcementReadService.unreadCount(rt.id, ann));
    setLoading(false);
    setRefreshing(false);
  }, [rt.id, isKetua]);

  useEffect(() => {
    load();
  }, [load]);

  const latest = announcements.length > 0 ? announcements[0] : null;

  const openAnnouncement = async (a: Announcement) => {
    await announcementReadService.markRead(rt.id, a.id);
    setUnread(await announcementReadService.unreadCount(rt.id, announcements));
    navigation.navigate('AnnouncementDetail', { announcement: a });
  };

  const openCreateInfo = () => {
    navigation.navigate('CreateAnnouncement', { rtId: rt.id, onCreated: load });
  };
  const openApproveSurat = () => {
    navigation.navigate('SuratPengantar', { profile, rt });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
      >
        <WargaBerandaHeader
          greetingLine={`${greetingByTime()} 👋`}
          fullName={isKetua ? honorificName(profile.fullName) : profile.fullName}
          roleRtLine={`${isKetua ? 'Ketua RT' : 'Bendahara'} • ${rtDisplayLabel(rt)}`}
          avatarUrl={profile.avatarUrl}
          notifCount={unread}
          onNotifTap={() => onNavigateTab(3)}
        />
        <View style={{ height: 16 }} />

        {isKetua && (
          <>
            <KasHeroCard saldo={kas.saldo} onTap={() => onNavigateTab(2)} />
            <View style={{ height: 12 }} />
          </>
        )}

        <WargaHomeStatsRow
          saldoKas={kas.saldo}
          totalKontribusi={kas.totalMasuk}
          paidCount={0}
          kasMasukBulanIni={kas.totalMasuk}
          isLoading={loading}
          onSaldoTap={() => onNavigateTab(2)}
          onKontribusiTap={() => onNavigateTab(2)}
        />

        <View style={{ height: 24 }} />
        <WargaSectionHeader title="Aksi Cepat" showSparkle />
        <View style={{ height: 12 }} />

        {isKetua ? (
          <KetuaQuickActionGrid
            tagihCount={belumBayar}
            verifikasiCount={belumBayar}
            suratPendingCount={suratPending}
            onTagih={() => onNavigateTab(1, 'tagih')}
            onVerifikasi={() => onNavigateTab(1, 'verifikasi')}
            onApproveSurat={openApproveSurat}
            onBuatInfo={openCreateInfo}
          />
        ) : (
          <WargaAksiCepatGrid
            tagihBadgeCount={belumBayar}
            onTagihIuran={() => onNavigateTab(1)}
            onSuratRt={openApproveSurat}
            onInfo={() => onNavigateTab(3)}
            onLayanan={() => onNavigateTab(2)}
          />
        )}

        <View style={{ height: 24 }} />
        <WargaSectionHeader title="Pengumuman Terbaru" trailing="Lihat Semua >" onTrailingTap={() => onNavigateTab(3)} />
        <View style={{ height: 10 }} />
        {latest == null ? (
          <WargaEmptyState icon="megaphone-outline" message="Belum ada pengumuman. Buat lewat tab Info." />
        ) : (
          <WargaPengumumanFeedCard item={latest} onTap={() => openAnnouncement(latest)} />
        )}

        {isKetua ? (
          <>
            <View style={{ height: 16 }} />
            <WargaSectionHeader title="Menu lainnya" />
            <View style={{ height: 10 }} />
            <WargaMenuTile
              icon="cash"
              iconBg={wargaColors.lightGreen}
              iconColor={wargaColors.primaryGreen}
              title="Kelola Iuran"
              subtitle={belumBayar > 0 ? `${belumBayar} tagihan belum lunas` : 'Semua warga lunas'}
              onTap={() => onNavigateTab(1)}
            />
            <WargaMenuTile
              icon="remove-circle-outline"
              iconBg={wargaColors.accentYellow}
              iconColor="#BA7517"
              title="Tambah Pengeluaran"
              subtitle="Catat pengeluaran kas RT"
              onTap={() => onNavigateTab(2)}
            />
          </>
        ) : (
          belumBayar > 0 && (
            <>
              <View style={{ height: 16 }} />
              <WargaCard>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon name="information-circle-outline" size={22} color={wargaColors.primaryGreen} />
                  <Text style={[wargaText.greeting, { fontSize: 13, flex: 1, marginLeft: 10 }]}>
                    {belumBayar} tagihan warga belum lunas bulan ini.
                  </Text>
                </View>
              </WargaCard>
            </>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
});
