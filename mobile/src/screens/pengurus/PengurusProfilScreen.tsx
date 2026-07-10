// Port dari lib/pages/tabs/profil_tab.dart
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { alertDialog, confirmDialog } from '../../lib/dialog';
import { Icon, type IconName } from '../../components/Icon';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import {
  WargaInfoRow,
  WargaMenuTile,
  WargaPageHeader,
  WargaProfileHeaderCard,
} from '../../components/warga/DashboardWidgets';
import { EditProfileModal } from '../../components/warga/EditProfileModal';
import { useToast } from '../../components/Toast';
import { authService } from '../../services/authService';
import { Profile, RtUnit, profileIsBendahara, profileIsKetua, profileRoleLabel, rtDisplayLabel } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onLogout: () => void;
  onProfileUpdated?: () => void;
}

export function PengurusProfilScreen({ profile: initialProfile, rt, onLogout, onProfileUpdated }: Props) {
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [editing, setEditing] = useState(false);
  const canManage = profileIsKetua(profile) || profileIsBendahara(profile);

  const onSaved = async () => {
    const updated = await authService.getProfile();
    if (updated) {
      setProfile(updated);
      onProfileUpdated?.();
      toast.success('Profil diperbarui');
    }
  };

  const showHelp = () =>
    alertDialog(
      'Panduan RT OS',
      '• Beranda: ringkasan kas & pengumuman.\n' +
        '• Iuran: kelola tagihan warga.\n' +
        '• Kas: catat pemasukan & pengeluaran.\n' +
        '• Info: buat & kelola pengumuman.\n' +
        '• Profil: edit data & kelola warga.',
    );

  const confirmLogout = () =>
    confirmDialog('Keluar?', 'Anda akan keluar dari aplikasi.', onLogout, 'Keluar');

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WargaPageHeader title="Profil" subtitle="Ketuk foto untuk ubah profil & unggah foto" />
        <View style={{ height: 16 }} />

        <WargaProfileHeaderCard
          fullName={profile.fullName}
          phone={profile.phone.length > 0 ? profile.phone : '-'}
          roleLabel={profileRoleLabel(profile)}
          avatarUrl={profile.avatarUrl}
          onEditProfile={() => setEditing(true)}
        />
        <View style={{ height: 16 }} />

        <WargaCard style={{ marginBottom: 16 }}>
          <Text style={wargaText.sectionTitle}>RT Anda</Text>
          <View style={{ height: 8 }} />
          <WargaInfoRow label="Nama" value={rt.name} />
          <WargaInfoRow label="RT / RW" value={rtDisplayLabel(rt)} />
          {rt.address != null && <WargaInfoRow label="Alamat" value={rt.address} />}
          {profileIsKetua(profile) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              <Text style={{ flex: 1, fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>
                Kode undangan: {rt.inviteCode}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={async () => {
                  await Clipboard.setStringAsync(rt.inviteCode);
                  toast.success('Kode disalin');
                }}
              >
                <Icon name="copy-outline" size={20} color={wargaColors.primaryGreen} />
              </Pressable>
            </View>
          )}
        </WargaCard>

        {canManage && (
          <WargaMenuTile
            icon="people"
            iconBg={wargaColors.lightGreen}
            iconColor={wargaColors.primaryGreen}
            title="Data Warga"
            subtitle="Direktori & kelola bendahara"
            onTap={() => navigation.navigate('DataWarga', { profile, rt })}
          />
        )}
        {profileIsKetua(profile) && (
          <WargaMenuTile
            icon="construct-outline"
            iconBg={wargaColors.accentBlue}
            iconColor="#185FA5"
            title="Pengaturan RT"
            subtitle="Alamat, rekening, kop surat, tanda tangan, QRIS"
            onTap={() => navigation.navigate('RtSettings', { profile, rt })}
          />
        )}
        <WargaMenuTile
          icon="document-text"
          iconBg={wargaColors.accentLime}
          iconColor="#3B6D11"
          title="Surat Pengantar"
          subtitle="Kelola permohonan surat warga"
          onTap={() => navigation.navigate('SuratPengantar', { profile, rt })}
        />
        <WargaMenuTile
          icon="help-circle"
          iconBg={wargaColors.accentBlue}
          iconColor="#185FA5"
          title="Bantuan"
          subtitle="Panduan singkat RT OS"
          onTap={showHelp}
        />

        <View style={{ height: 20 }} />
        <Pressable onPress={confirmLogout} style={styles.logout}>
          <Icon name="log-out-outline" size={20} color={wargaColors.dangerRed} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
        <Text style={styles.version}>RT OS Indonesia v1.0</Text>
      </ScrollView>

      <EditProfileModal
        visible={editing}
        userId={profile.id}
        initialName={profile.fullName}
        initialPhone={profile.phone}
        initialAvatarUrl={profile.avatarUrl}
        onClose={() => setEditing(false)}
        onSaved={onSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: wargaColors.dangerRed },
  logoutText: { color: wargaColors.dangerRed, fontWeight: '600', fontSize: 15 },
  version: { textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: 16 },
});
