// Gerbang warga baru: menunggu persetujuan Ketua RT sebelum bisa memakai app.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { colors, wargaColors } from '../config/theme';
import { PrimaryButton } from '../components/Card';
import { Profile, RtUnit, rtDisplayLabel } from '../types/models';

export function PendingApprovalScreen({
  profile,
  rt,
  onRefresh,
  onLogout,
}: {
  profile: Profile;
  rt: RtUnit | null;
  onRefresh: () => Promise<void> | void;
  onLogout: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="time-outline" size={44} color="#D97706" />
        </View>
        <Text style={styles.title}>Menunggu Persetujuan</Text>
        <Text style={styles.sub}>
          Halo {profile.fullName}, pendaftaranmu ke{' '}
          <Text style={styles.bold}>{rt ? rtDisplayLabel(rt) : 'RT'}{rt?.name ? ` · ${rt.name}` : ''}</Text>{' '}
          sedang menunggu persetujuan Ketua RT.
        </Text>
        <Text style={styles.hint}>
          Kamu akan bisa masuk dan memakai aplikasi setelah disetujui. Coba periksa lagi beberapa saat.
        </Text>

        <View style={{ height: 28 }} />
        <PrimaryButton label={checking ? 'Memeriksa…' : 'Periksa Status'} onPress={check} loading={checking} />
        <Text style={styles.logout} onPress={onLogout}>
          Keluar
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 12 },
  bold: { fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textHint, textAlign: 'center', lineHeight: 18, marginTop: 12 },
  logout: { color: wargaColors.dangerRed, fontWeight: '600', marginTop: 18, padding: 10 },
});
