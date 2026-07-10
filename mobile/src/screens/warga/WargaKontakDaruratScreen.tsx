// Port dari lib/pages/warga/warga_kontak_darurat_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
