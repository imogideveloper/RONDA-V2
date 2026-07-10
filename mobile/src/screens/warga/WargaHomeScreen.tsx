// Port dari lib/pages/warga/warga_home_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { useToast } from '../../components/Toast';
import type { RootStackParamList } from '../../navigation/types';
import {
  WargaAksiCepatGrid,
  WargaBerandaHeader,
  WargaDaruratBanner,
  WargaHomeStatsRow,
  WargaPapanInfoHeader,
  WargaPapanInfoStrip,
  WargaSectionHeader,
  WargaTotalTagihanCard,
  type PapanStripProps,
} from '../../components/warga/BerandaWidgets';
import { wargaHomeLoader } from '../../services/wargaHomeLoader';
import { WargaHomeData, emptyWargaHomeData } from '../../types/wargaHomeData';
import {
  awaitingVerification,
  bulanTertunggak,
  paidCount,
  totalKontribusi,
  totalTagihan,
} from '../../types/wargaHomeData';
import {
  Profile,
  RtUnit,
  iuranIsUnpaid,
  iuranPaymentMethodLabel,
  rtDisplayLabel,
  suratStatusLabel,
} from '../../types/models';
import { formatRupiah } from '../../config/theme';
import { greetingByTime, formatDateShort, daysLateFromPeriodKey } from '../../lib/date';
import { announcementActive, billActive, suratActive } from '../../lib/papanInfo';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onNavigateTab: (i: number) => void;
  onRtSwitched: () => void;
}

export function WargaHomeScreen({ profile, rt, onNavigateTab, onRtSwitched }: Props) {
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [data, setData] = useState<WargaHomeData>(emptyWargaHomeData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const openBayarIuran = useCallback(() => {
    navigation.navigate('WargaTagihanIuran', {
      profile,
      rt,
      onDone: () => {
        wargaHomeLoader.invalidate();
        load(true);
        toast.success('Bukti pembayaran terkirim! Menunggu verifikasi Bendahara.');
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, profile, rt]);

  const load = useCallback(
    async (force = false) => {
      try {
        const d = await wargaHomeLoader.load(rt.id, profile.id, force);
        setData(d);
      } catch {
        toast.error('Gagal memuat beranda');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [rt.id, profile.id, toast],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  const unpaid = data.bills.filter(iuranIsUnpaid);
  const awaiting = awaitingVerification(data);
  const daysLate = maxDaysLate(unpaid);

  const strips = buildPapanStrips();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        <WargaBerandaHeader
          greetingLine={`${greetingByTime()} 👋`}
          fullName={profile.fullName}
          roleRtLine={`Warga · ${rtDisplayLabel(rt)}`}
          avatarUrl={profile.avatarUrl}
          notifCount={data.announcements.filter((a) => a.isPinned).length}
          onNotifTap={() => onNavigateTab(2)}
        />

        <View style={{ height: 16 }} />

        <WargaTotalTagihanCard
          total={totalTagihan(data)}
          bulanTertunggak={bulanTertunggak(data)}
          daysLate={daysLate > 0 ? daysLate : null}
          onTap={openBayarIuran}
        />

        <View style={{ height: 12 }} />
        <WargaHomeStatsRow
          saldoKas={data.kas.saldo}
          totalKontribusi={totalKontribusi(data)}
          paidCount={paidCount(data)}
          kasMasukBulanIni={data.kas.totalMasuk}
          isLoading={loading}
          onSaldoTap={() => navigation.navigate('WargaRiwayatTransaksi', { profile, rt })}
          onKontribusiTap={() => navigation.navigate('WargaKontribusiSaya', { profile, rt })}
        />

        <View style={{ height: 24 }} />
        <WargaSectionHeader title="Aksi cepat" showSparkle />
        <View style={{ height: 14 }} />
        <WargaAksiCepatGrid
          tagihBadgeCount={bulanTertunggak(data)}
          onTagihIuran={openBayarIuran}
          onSuratRt={() => navigation.navigate('WargaLayananSurat', { profile, rt })}
          onInfo={() => onNavigateTab(2)}
          onLayanan={() => navigation.navigate('WargaLayananSurat', { profile, rt })}
        />

        <View style={{ height: 12 }} />
        <WargaDaruratBanner onTap={() => navigation.navigate('WargaKontakDarurat', { profile, rt })} />

        <View style={{ height: 24 }} />
        <WargaPapanInfoHeader stripCount={strips.length} onLihatSemua={() => onNavigateTab(2)} />
        <View style={{ height: 12 }} />

        {strips.length === 0 ? (
          <Text style={styles.emptyPapan}>
            Belum ada aktivitas. Cek tab Info untuk pengumuman RT.
          </Text>
        ) : (
          strips.map((s, i) => <WargaPapanInfoStrip key={i} {...s} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );

  function buildPapanStrips(): PapanStripProps[] {
    const out: PapanStripProps[] = [];

    for (const bill of awaiting) {
      out.push({
        accentColor: '#F59E0B',
        icon: 'time-outline',
        iconBg: wargaColors.accentYellow,
        iconColor: '#EA580C',
        badge: 'MENUNGGU',
        badgeBg: '#FFF3E0',
        badgeFg: '#EA580C',
        metaRight: formatDateShort(bill.submittedAt ?? new Date()),
        title: `${bill.periodLabel} — Menunggu Verifikasi`,
        subtitle: `${iuranPaymentMethodLabel(bill)} · ${formatRupiah(bill.amount)}`,
      });
    }

    for (const bill of unpaid.filter(billActive)) {
      out.push({
        accentColor: '#F97316',
        icon: 'card-outline',
        iconBg: wargaColors.lightRed,
        iconColor: wargaColors.dangerRed,
        badge: 'TAGIHAN',
        badgeBg: '#FFF3E0',
        badgeFg: '#EA580C',
        metaRight: formatDateShort(new Date()),
        title: `${bill.periodLabel} — Belum lunas`,
        subtitle: `Segera bayar · ${formatRupiah(bill.amount)}`,
      });
    }

    for (const s of data.mySuratRequests.filter(suratActive)) {
      out.push({
        accentColor: wargaColors.primaryGreen,
        icon: 'home-outline',
        iconBg: wargaColors.accentBlue,
        iconColor: '#185FA5',
        badge: 'SURAT',
        badgeBg: wargaColors.lightGreen,
        badgeFg: wargaColors.primaryGreen,
        metaRight: suratStatusLabel(s),
        title: s.suratType,
        subtitle: s.purpose.length > 0 ? s.purpose : 'Menunggu persetujuan RT',
      });
    }

    for (const a of data.announcements.filter(announcementActive)) {
      out.push({
        accentColor: '#185FA5',
        icon: 'megaphone-outline',
        iconBg: wargaColors.accentBlue,
        iconColor: '#185FA5',
        badge: a.isPinned ? 'PENTING' : 'INFO',
        badgeBg: a.isPinned ? wargaColors.accentYellow : wargaColors.lightGreen,
        badgeFg: a.isPinned ? '#BA7517' : wargaColors.primaryGreen,
        metaRight: formatDateShort(a.createdAt),
        title: a.title,
        subtitle: a.content.length > 48 ? `${a.content.slice(0, 48)}…` : a.content,
      });
    }

    return out;
  }
}

function maxDaysLate(unpaid: { periodKey: string }[]): number {
  let max = 0;
  for (const r of unpaid) {
    const d = daysLateFromPeriodKey(r.periodKey);
    if (d > max) max = d;
  }
  return max;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  emptyPapan: { color: colors.textSecondary, fontSize: 13, paddingVertical: 12 },
});
