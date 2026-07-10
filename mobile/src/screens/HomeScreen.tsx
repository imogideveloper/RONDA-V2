// Port dari lib/pages/role_home_router.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../config/theme';
import { PrimaryButton } from '../components/Card';
import { useToast } from '../components/Toast';
import { authService } from '../services/authService';
import { rtService } from '../services/rtService';
import { wargaDirectoryService } from '../services/wargaDirectoryService';
import { Profile, RtUnit, profileHasRt, profileIsWarga } from '../types/models';
import { WargaMainShell } from './warga/WargaMainShell';
import { PengurusMainShell } from './pengurus/PengurusMainShell';
import { OnboardingScreen } from './onboarding/OnboardingScreen';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rt, setRt] = useState<RtUnit | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let p = await authService.getProfile();
    let autoJoined = false;
    if (p != null && !profileHasRt(p)) {
      autoJoined = await wargaDirectoryService.tryAutoJoinRt();
      if (autoJoined) p = await authService.getProfile();
    }
    let unit: RtUnit | null = null;
    if (p?.rtId != null) unit = await rtService.getMyRt();
    setProfile(p);
    setRt(unit);
    setLoading(false);
    if (autoJoined && unit != null) {
      toast.success(`Anda terhubung ke ${unit.name} (data import RT)`);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const logout = useCallback(async () => {
    await authService.logout();
    navigation.replace('Login');
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
        <Text style={styles.loadingText}>Memuat RT Anda...</Text>
      </View>
    );
  }

  if (profile == null) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <Text style={styles.errTitle}>Profil tidak ditemukan</Text>
        {authService.lastProfileError ? (
          <Text style={styles.errDetail}>{authService.lastProfileError}</Text>
        ) : null}
        <View style={{ height: 20 }} />
        <PrimaryButton label="Coba Lagi" onPress={load} />
        <Text style={styles.linkBtn} onPress={logout}>
          Kembali ke Login
        </Text>
      </View>
    );
  }

  // Belum punya RT → Onboarding (buat / gabung RT).
  if (!profileHasRt(profile) || rt == null) {
    return <OnboardingScreen profile={profile} onDone={load} onLogout={logout} />;
  }

  if (profileIsWarga(profile)) {
    return <WargaMainShell profile={profile} rt={rt} onLogout={logout} onChanged={load} />;
  }

  // Pengurus (Ketua RT / Bendahara).
  return <PengurusMainShell profile={profile} rt={rt} onLogout={logout} onChanged={load} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { color: colors.textSecondary, marginTop: 20 },
  errTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 16 },
  errDetail: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  linkBtn: { color: colors.emerald, fontSize: 14, fontWeight: '600', marginTop: 16, padding: 8 },
});
