// Port dari lib/pages/onboarding/onboarding_page.dart
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmDialog } from '../../lib/dialog';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, softShadow, wargaColors } from '../../config/theme';
import { WargaCard } from '../../components/warga/wargaUi';
import { Profile } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  profile: Profile;
  onDone: () => void;
  onLogout: () => void;
}

export function OnboardingScreen({ profile, onDone, onLogout }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const confirmLogout = () =>
    confirmDialog('Keluar dari akun?', 'Anda akan kembali ke halaman login.', onLogout, 'Keluar');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.illustration}>
          <Icon name="people-circle" size={100} color={colors.emerald} />
        </View>
        <Text style={styles.hello}>Halo, {profile.fullName.split(' ')[0]}!</Text>
        <Text style={styles.sub}>Pilih cara bergabung dengan RT Anda</Text>

        {profile.approvalStatus === 'rejected' && (
          <View style={styles.rejectedBanner}>
            <Icon name="close-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.rejectedText}>Pendaftaran ditolak — silakan coba mendaftar lagi.</Text>
          </View>
        )}

        <View style={{ height: 32 }} />

        <OptionCard
          icon="add-circle-outline"
          title="Buat RT Baru"
          desc="Anda otomatis jadi Ketua RT"
          onPress={() => navigation.navigate('CreateRt', { onSuccess: onDone })}
        />
        <View style={{ height: 14 }} />
        <OptionCard
          icon="people-outline"
          title="Gabung RT"
          desc="Pakai kode undangan jika belum di-import Ketua RT"
          onPress={() => navigation.navigate('JoinRt', { onSuccess: onDone })}
        />

        <View style={{ height: 24 }} />
        <WargaCard style={{ backgroundColor: colors.emeraldMuted, borderColor: colors.emeraldSoft }}>
          <Text style={styles.infoText}>
            Warga yang sudah di-import Ketua RT akan otomatis masuk RT saat login (nomor HP sama).
            Jika belum di-import, gunakan kode undangan.
          </Text>
        </WargaCard>

        <View style={{ height: 24 }} />
        <Pressable onPress={confirmLogout} style={styles.logout}>
          <Icon name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function OptionCard({
  icon,
  title,
  desc,
  onPress,
}: {
  icon: IconName;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && { opacity: 0.9 }]}>
      <View style={styles.optionIcon}>
        <Icon name={icon} size={28} color={colors.emerald} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionDesc}>{desc}</Text>
      </View>
      <Icon name="chevron-forward" size={16} color={colors.textHint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { padding: 24 },
  illustration: { alignItems: 'center', marginTop: 16 },
  hello: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginTop: 24 },
  sub: { fontSize: 15, color: colors.textSecondary, marginTop: 8, lineHeight: 22 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 18,
    ...softShadow,
  },
  optionIcon: { padding: 12, backgroundColor: colors.emeraldSoft, borderRadius: 12 },
  optionTitle: { fontWeight: '700', fontSize: 16, color: colors.textPrimary },
  optionDesc: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  infoText: { fontSize: 13, color: colors.emeraldDark, lineHeight: 20 },
  rejectedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  rejectedText: { flex: 1, fontSize: 13, color: colors.danger, fontWeight: '600', lineHeight: 18 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.danger },
  logoutText: { color: colors.danger, fontWeight: '600', fontSize: 15 },
});
