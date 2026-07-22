// Port dari lib/pages/warga/warga_profil_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirmDialog } from '../../lib/dialog';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaSectionHeader } from '../../components/warga/BerandaWidgets';
import {
  WargaMembershipCard,
  WargaMenuTile,
  WargaProfileAvatar,
} from '../../components/warga/DashboardWidgets';
import { rtService } from '../../services/rtService';
import { SURAT_CATALOG } from '../../lib/suratCatalog';
import { EditProfileModal } from '../../components/warga/EditProfileModal';
import {
  NotifikasiSheet,
  PrivasiSheet,
  countNotifActive,
  loadNotifPrefs,
} from '../../components/warga/SettingsSheets';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useToast } from '../../components/Toast';
import { authService } from '../../services/authService';
import { rtMembershipService } from '../../services/rtMembershipService';
import { wargaHomeLoader } from '../../services/wargaHomeLoader';
import { RtMembership, membershipDisplayLabel, membershipLocationLine } from '../../types/membership';
import { Profile, RtUnit, iuranIsPaid, rtDisplayLabel } from '../../types/models';

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
  const [kontribusi, setKontribusi] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [privasiOpen, setPrivasiOpen] = useState(false);
  const [notifActive, setNotifActive] = useState(4);

  const loadMemberships = useCallback(async () => {
    setLoading(true);
    const list = await rtMembershipService.listMyMemberships();
    setMemberships(list);
    setLoading(false);
    try {
      const bills = await rtService.getIuranRecords(rt.id, profile.id);
      setKontribusi(bills.filter(iuranIsPaid).reduce((s, b) => s + b.amount, 0));
    } catch {
      // abaikan
    }
  }, [rt.id, profile.id]);

  useEffect(() => {
    loadMemberships();
  }, [loadMemberships]);

  useEffect(() => {
    loadNotifPrefs(profile.id).then((p) => setNotifActive(countNotifActive(p)));
  }, [profile.id]);

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

  const confirmLogout = () =>
    confirmDialog('Keluar?', 'Anda akan keluar dari aplikasi.', onLogout, 'Keluar');

  const waPhone = profile.phone.length > 0 ? profile.phone : 'Belum diisi';

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Kartu profil */}
        <View style={styles.headerCard}>
          <View style={styles.headerBand} />
          <View style={{ marginTop: -44 }}>
            <WargaProfileAvatar
              imageUrl={profile.avatarUrl}
              fullName={profile.fullName}
              radius={44}
              showCameraBadge
              onTap={() => setEditing(true)}
            />
          </View>
          <Text style={styles.headerName}>{profile.fullName}</Text>
          <View style={styles.roleBadge}>
            <Icon name="person" size={12} color={wargaColors.primaryGreen} />
            <Text style={styles.roleBadgeText}>Warga</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.headerSub}>{rtDisplayLabel(rt)} · {rt.name}</Text>
        </View>

        {/* 3 stat tiles */}
        <View style={styles.statRow}>
          <StatTile icon="home" color="#185FA5" value={rtDisplayLabel(rt)} label="RT / RW" />
          <StatTile icon="card" color={wargaColors.primaryGreen} value={formatRupiah(kontribusi)} label="KONTRIBUSI" />
          <StatTile icon="document-text" color="#5B21B6" value={`${SURAT_CATALOG.length} jenis`} label="SURAT" />
        </View>

        {/* Informasi */}
        <Text style={styles.sectionLabel}>Informasi</Text>
        <WargaMenuTile
          icon="notifications-outline"
          iconBg={wargaColors.lightGreen}
          iconColor={wargaColors.primaryGreen}
          title="Notifikasi"
          subtitle={notifActive === 0 ? 'Nonaktif' : `${notifActive} dari 4 aktif`}
          onTap={() => setNotifOpen(true)}
        />
        <WargaMenuTile
          icon="shield-outline"
          iconBg={wargaColors.accentBlue}
          iconColor="#185FA5"
          title="Privasi & Keamanan"
          subtitle="Kelola keamanan akun"
          onTap={() => setPrivasiOpen(true)}
        />
        <WargaMenuTile
          icon="home-outline"
          iconBg={wargaColors.accentYellow}
          iconColor="#BA7517"
          title="Alamat"
          subtitle={rt.address ?? rt.name}
          onTap={() => setEditing(true)}
        />
        <WargaMenuTile
          icon="call"
          iconBg={wargaColors.lightGreen}
          iconColor={wargaColors.primaryGreen}
          title="WhatsApp"
          subtitle={waPhone}
          onTap={() => setEditing(true)}
        />
        <WargaMenuTile
          icon="document-text"
          iconBg="#F3E8FF"
          iconColor="#5B21B6"
          title="Surat Keterangan"
          subtitle={`${SURAT_CATALOG.length} jenis tersedia`}
          onTap={() => navigation.navigate('WargaLayananSurat', { profile, rt })}
        />

        {/* Keanggotaan RT (multi-RT) */}
        <View style={{ height: 12 }} />
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

        <View style={{ height: 20 }} />
        <Pressable onPress={confirmLogout} style={styles.logout}>
          <Icon name="log-out-outline" size={20} color={wargaColors.dangerRed} />
          <Text style={styles.logoutText}>Keluar</Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        visible={editing}
        userId={profile.id}
        initialName={profile.fullName}
        initialPhone={profile.phone}
        initialAvatarUrl={profile.avatarUrl}
        initialNik={profile.nik}
        initialBirthPlace={profile.birthPlace}
        initialBirthDate={profile.birthDate}
        initialOccupation={profile.occupation}
        initialGender={profile.gender}
        initialReligion={profile.religion}
        initialMaritalStatus={profile.maritalStatus}
        onClose={() => setEditing(false)}
        onSaved={onSaved}
      />

      <NotifikasiSheet
        visible={notifOpen}
        userId={profile.id}
        onClose={() => setNotifOpen(false)}
        onSaved={(p) => setNotifActive(countNotifActive(p))}
      />
      <PrivasiSheet visible={privasiOpen} userId={profile.id} onClose={() => setPrivasiOpen(false)} />
    </SafeAreaView>
  );
}

function StatTile({ icon, color, value, label }: { icon: IconName; color: string; value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <View style={[styles.statIcon, { backgroundColor: color + '1F' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  italic: { fontSize: 12, fontStyle: 'italic', color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingBottom: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerBand: { height: 68, alignSelf: 'stretch', backgroundColor: '#DBEAFE' },
  headerName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: wargaColors.lightGreen,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
  },
  roleBadgeText: { fontSize: 12, fontWeight: '600', color: wargaColors.primaryGreen },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: wargaColors.primaryGreen, marginLeft: 2 },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 8 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2, letterSpacing: 0.3 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
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
