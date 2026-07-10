// Port dari lib/pages/warga/warga_profil_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaSectionHeader } from '../../components/warga/BerandaWidgets';
import {
  WargaAccessRow,
  WargaInfoRow,
  WargaMembershipCard,
  WargaMenuTile,
  WargaPageHeader,
  WargaProfileHeaderCard,
} from '../../components/warga/DashboardWidgets';
import { EditProfileModal } from '../../components/warga/EditProfileModal';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useToast } from '../../components/Toast';
import { authService } from '../../services/authService';
import { rtMembershipService } from '../../services/rtMembershipService';
import { wargaHomeLoader } from '../../services/wargaHomeLoader';
import { RtMembership, membershipDisplayLabel, membershipLocationLine } from '../../types/membership';
import { Profile, RtUnit, profileRoleLabel, rtDisplayLabel } from '../../types/models';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onLogout: () => void;
  onProfileUpdated?: () => void;
}

export function WargaProfilScreen({ profile: initialProfile, rt, onLogout, onProfileUpdated }: Props) {
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [memberships, setMemberships] = useState<RtMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    const list = await rtMembershipService.listMyMemberships();
    setMemberships(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  const onSaved = async () => {
    const updated = await authService.getProfile();
    if (updated) {
      setProfile(updated);
      onProfileUpdated?.();
      toast.success('Profil diperbarui');
    }
  };

  const switchRt = async (m: RtMembership) => {
    if (m.isActive) return;
    try {
      await rtMembershipService.switchActiveRt(m.rtId);
      wargaHomeLoader.invalidate();
      onProfileUpdated?.();
      toast.success(`Beralih ke ${membershipDisplayLabel(m)}. Data iuran & info diperbarui.`);
    } catch (e: any) {
      toast.error(String(e?.message ?? 'Gagal beralih RT'));
    }
  };

  const showHelp = () =>
    Alert.alert(
      'Panduan Warga',
      '• Beranda: ringkasan iuran, pengumuman, aksi cepat.\n' +
        '• Iuran: bayar tagihan bulanan (demo QRIS).\n' +
        '• Info: baca pengumuman RT.\n' +
        '• Profil: kelola keanggotaan RT & ajukan surat.\n\n' +
        'Punya rumah di 2 RT? Gunakan "Gabung RT Lain" dengan kode undangan Ketua RT.',
    );

  const confirmLogout = () =>
    Alert.alert('Keluar?', 'Anda akan keluar dari aplikasi.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: onLogout },
    ]);

  const parseKelurahan = () => {
    const addr = rt.address ?? rt.name;
    return addr.includes('-') ? addr.split('-')[0].trim() : rt.name;
  };

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

        <View style={{ height: 24 }} />
        <WargaSectionHeader
          title="Keanggotaan RT"
          trailing="+ Gabung RT Lain"
          onTrailingTap={() =>
            navigation.navigate('JoinRt', {
              additionalMembership: true,
              onSuccess: () => {
                loadMemberships();
                onProfileUpdated?.();
              },
            })
          }
        />
        <View style={{ height: 10 }} />

        {loading ? null : memberships.length === 0 ? (
          <WargaMembershipCard displayLabel={rtDisplayLabel(rt)} subtitle={`${rt.name} · Warga`} isActive />
        ) : (
          memberships.map((m) => (
            <WargaMembershipCard
              key={m.rtId}
              displayLabel={membershipDisplayLabel(m)}
              subtitle={`${membershipLocationLine(m)} · Warga`}
              isActive={m.isActive}
              onTap={() => switchRt(m)}
            />
          ))
        )}
        <Text style={styles.italic}>Iuran dihitung terpisah untuk setiap RT</Text>

        <WargaCard style={{ marginBottom: 12 }}>
          <Text style={wargaText.sectionTitle}>Cara kerja role di RONDA</Text>
          <View style={{ height: 12 }} />
          <RoleRow icon="shield" color={wargaColors.primaryGreen} title="Ketua RT" desc="Membuat RT & verifikasi warga." />
          <RoleRow icon="wallet" color="#BA7517" title="Bendahara" desc="Ditunjuk Ketua RT, kelola kas." />
          <RoleRow icon="person" color="#185FA5" title="Warga" desc="Gabung pakai kode. Bisa di beberapa RT." />
        </WargaCard>

        <WargaCard style={{ marginBottom: 12 }}>
          <Text style={wargaText.sectionTitle}>Akses Anda sebagai Warga</Text>
          <View style={{ height: 4 }} />
          <WargaAccessRow label="Kelola Iuran" active={false} />
          <WargaAccessRow label="Kelola Kas RT" active={false} />
          <WargaAccessRow label="Buat Pengumuman" active={false} />
          <WargaAccessRow label="Kelola Data Warga" active={false} />
          <WargaAccessRow label="Lihat Laporan Kas" active={false} />
          <WargaAccessRow label="Request Surat" active />
        </WargaCard>

        <WargaCard style={{ marginBottom: 16 }}>
          <Text style={wargaText.sectionTitle}>Informasi RT</Text>
          <View style={{ height: 8 }} />
          <WargaInfoRow label="RT / RW" value={rtDisplayLabel(rt)} />
          <WargaInfoRow label="Kelurahan" value={parseKelurahan()} />
          <WargaInfoRow label="Kecamatan" value={rt.address ?? '-'} />
          <WargaInfoRow label="Kota" value={rt.name} />
          <WargaInfoRow label="Jumlah Warga" value={`${rt.memberCount} orang`} />
        </WargaCard>

        <WargaMenuTile
          icon="document-text"
          iconBg={wargaColors.accentLime}
          iconColor="#3B6D11"
          title="Surat Pengantar"
          subtitle="Ajukan & cek status surat"
          onTap={() => navigation.navigate('WargaLayananSurat', { profile, rt })}
        />
        <WargaMenuTile
          icon="help-circle"
          iconBg={wargaColors.accentBlue}
          iconColor="#185FA5"
          title="Bantuan"
          subtitle="FAQ dan panduan penggunaan"
          onTap={showHelp}
        />

        <View style={{ height: 20 }} />
        <Pressable onPress={confirmLogout} style={styles.logout}>
          <Ionicons name="log-out-outline" size={20} color={wargaColors.dangerRed} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
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

function RoleRow({
  icon,
  color,
  title,
  desc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
      <View style={[styles.roleIcon, { backgroundColor: color + '1F' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.roleTitle}>{title}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12, lineHeight: 17 }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  italic: { fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  roleIcon: { padding: 6, borderRadius: 8, alignSelf: 'flex-start' },
  roleTitle: { fontWeight: '600', fontSize: 13, color: colors.textPrimary },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: wargaColors.dangerRed,
  },
  logoutText: { color: wargaColors.dangerRed, fontWeight: '600', fontSize: 15 },
});
