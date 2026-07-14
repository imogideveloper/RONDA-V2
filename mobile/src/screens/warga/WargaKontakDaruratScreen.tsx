// Port dari lib/pages/warga/warga_kontak_darurat_page.dart
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import {
  WargaEmergencyBannerCard,
  WargaPengurusContactCard,
} from '../../components/warga/DetailWidgets';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { Profile, rtDisplayLabel } from '../../types/models';
import { normalizePhoneForWhatsApp, openWhatsAppPhone } from '../../lib/whatsapp';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaKontakDarurat'>;

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Contoh jadwal ronda: 3 hari Minggu mendatang (placeholder sampai fitur atur ronda dibuat).
function upcomingRonda(): { label: string; sub: string }[] {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const add = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + add);
  const out: { label: string; sub: string }[] = [];
  for (let i = 0; i < 3; i++) {
    out.push({
      label: `Minggu, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`,
      sub: '22.00 - 04.00 · Kelompok Ronda',
    });
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export default function WargaKontakDaruratScreen({ route }: Props) {
  const { rt } = route.params;
  const toast = useToast();
  const [pengurus, setPengurus] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    let list = await rtService.getRtPengurus(rt.id);
    const ketua = await rtService.getKetuaProfile(rt.id);
    if (ketua && !list.some((p) => p.id === ketua.id)) list = [ketua, ...list];
    setPengurus(list);
    setLoading(false);
    setRefreshing(false);
  }, [rt.id]);

  useEffect(() => {
    load();
  }, [load]);

  const call = async (p: Profile) => {
    if (p.phone.replace(/\D/g, '').length < 9) {
      toast.error('Nomor pengurus belum diisi');
      return;
    }
    await Linking.openURL(`tel:+${normalizePhoneForWhatsApp(p.phone)}`);
  };

  const wa = async (p: Profile) => {
    const ok = await openWhatsAppPhone(p.phone);
    if (!ok) toast.error('Tidak dapat membuka WhatsApp');
  };

  const addr = rt.address?.trim();
  const loc = addr && addr.length > 0 ? addr : rt.name;
  const rtLine = `${rtDisplayLabel(rt)} — ${loc}`;
  const ronda = useMemo(() => upcomingRonda(), []);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Kontak Darurat" />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.emerald} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          <WargaEmergencyBannerCard rtLine={rtLine} />
          <View style={{ height: 24 }} />
          <Text style={wargaText.sectionTitle}>Pengurus RT</Text>
          <View style={{ height: 12 }} />
          {pengurus.length === 0 ? (
            <WargaCard>
              <Text style={wargaText.greeting}>
                Belum ada data Ketua RT / Bendahara. Hubungi pengurus melalui kantor RT.
              </Text>
            </WargaCard>
          ) : (
            pengurus.map((p) => (
              <WargaPengurusContactCard key={p.id} profile={p} rt={rt} onCall={() => call(p)} onWhatsApp={() => wa(p)} />
            ))
          )}

          <View style={{ height: 24 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={wargaText.sectionTitle}>Jadwal Ronda Anda</Text>
            <View style={styles.contohBadge}>
              <Text style={styles.contohText}>CONTOH</Text>
            </View>
          </View>
          <View style={{ height: 12 }} />
          {ronda.map((r, i) => (
            <View key={i} style={styles.rondaCard}>
              <View style={styles.rondaIcon}>
                <Icon name="shield-outline" size={20} color="#5B21B6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rondaLabel}>{r.label}</Text>
                <Text style={styles.rondaSub}>{r.sub}</Text>
              </View>
              <Icon name="calendar-outline" size={20} color={colors.textSecondary} />
            </View>
          ))}
          <Text style={styles.rondaNote}>
            Jadwal contoh. Pengaturan jadwal ronda oleh Ketua RT akan tersedia pada pembaruan berikutnya.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  contohBadge: { backgroundColor: '#EDE9FE', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  contohText: { fontSize: 9, fontWeight: '700', color: '#5B21B6', letterSpacing: 0.3 },
  rondaCard: {
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
  rondaIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  rondaLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rondaSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  rondaNote: { fontSize: 11, color: colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
});
