// Port dari lib/pages/warga/warga_kontak_darurat_page.dart
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaEmergencyBannerCard } from '../../components/warga/DetailWidgets';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { Profile, profileIsBendahara, profileIsKetua, rtDisplayLabel } from '../../types/models';
import type { IconName } from '../../components/Icon';
import { normalizePhoneForWhatsApp, openWhatsAppPhone } from '../../lib/whatsapp';
import type { RootStackParamList } from '../../navigation/types';

interface EmergencyContact {
  key: string;
  name: string;
  role: string;
  phone: string;
  icon: IconName;
  color: string;
}

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

  const call = async (phone: string) => {
    if (phone.replace(/\D/g, '').length < 9) {
      toast.error('Nomor belum diisi');
      return;
    }
    await Linking.openURL(`tel:+${normalizePhoneForWhatsApp(phone)}`);
  };

  const wa = async (phone: string) => {
    const ok = await openWhatsAppPhone(phone);
    if (!ok) toast.error('Tidak dapat membuka WhatsApp');
  };

  // Kontak darurat: pakai nomor yang diatur Ketua (Pengaturan RT → Kontak
  // Darurat); jika kosong, fallback ke nomor profil pengurus.
  const contacts = useMemo<EmergencyContact[]>(() => {
    const ketua = pengurus.find(profileIsKetua);
    const bendahara = pengurus.find(profileIsBendahara);
    const clean = (s?: string | null) => (s && s.trim() !== '' ? s.trim() : '');
    const out: EmergencyContact[] = [];

    const ketuaPhone = clean(rt.emergencyKetuaPhone) || clean(ketua?.phone);
    if (ketuaPhone) {
      out.push({ key: 'ketua', name: ketua?.fullName ?? 'Ketua RT', role: 'Ketua RT', phone: ketuaPhone, icon: 'person', color: wargaColors.primaryGreen });
    }
    const bendaharaPhone = clean(rt.emergencyBendaharaPhone) || clean(bendahara?.phone);
    if (bendaharaPhone) {
      out.push({ key: 'bendahara', name: bendahara?.fullName ?? 'Bendahara RT', role: 'Bendahara', phone: bendaharaPhone, icon: 'wallet', color: '#2563EB' });
    }
    const secPhone = clean(rt.emergencySecurityPhone);
    if (secPhone) {
      out.push({ key: 'security', name: clean(rt.emergencySecurityName) || 'Security / Satpam', role: 'Keamanan', phone: secPhone, icon: 'shield', color: '#DC2626' });
    }
    return out;
  }, [pengurus, rt]);

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
          <Text style={wargaText.sectionTitle}>Kontak Darurat</Text>
          <View style={{ height: 12 }} />
          {contacts.length === 0 ? (
            <WargaCard>
              <Text style={wargaText.greeting}>
                Belum ada kontak darurat. Ketua RT dapat mengisinya di Pengaturan RT → Kontak Darurat.
              </Text>
            </WargaCard>
          ) : (
            contacts.map((c) => (
              <ContactCard key={c.key} contact={c} onCall={() => call(c.phone)} onWhatsApp={() => wa(c.phone)} />
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

function ContactCard({
  contact,
  onCall,
  onWhatsApp,
}: {
  contact: EmergencyContact;
  onCall: () => void;
  onWhatsApp: () => void;
}) {
  return (
    <View style={styles.contactCard}>
      <View style={[styles.contactIcon, { backgroundColor: contact.color + '1A' }]}>
        <Icon name={contact.icon} size={20} color={contact.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.contactName} numberOfLines={1}>{contact.name}</Text>
        <Text style={styles.contactRole}>{contact.role} · {contact.phone}</Text>
      </View>
      <Pressable onPress={onCall} hitSlop={6} style={[styles.contactBtn, { backgroundColor: wargaColors.lightGreen }]}>
        <Icon name="call" size={18} color={wargaColors.primaryGreen} />
      </Pressable>
      <Pressable onPress={onWhatsApp} hitSlop={6} style={[styles.contactBtn, { backgroundColor: '#DCFCE7' }]}>
        <Icon name="logo-whatsapp" size={18} color="#25D366" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, marginBottom: 10, gap: 8 },
  contactIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  contactName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  contactRole: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  contactBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
