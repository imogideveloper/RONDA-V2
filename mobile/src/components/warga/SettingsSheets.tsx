// Bottom sheet Pengaturan: Notifikasi & Privasi/Keamanan (untuk WargaProfilScreen).
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, type IconName } from '../Icon';
import { colors, wargaColors } from '../../config/theme';
import { PrimaryButton } from '../Card';
import { useToast } from '../Toast';
import { loadPrefs, savePrefs } from '../../lib/prefsStore';
import { authService } from '../../services/authService';

// ── Notifikasi ───────────────────────────────────────────────────────
export interface NotifPrefs {
  pengumuman: boolean;
  iuran: boolean;
  surat: boolean;
  kegiatan: boolean;
}
const NOTIF_DEFAULT: NotifPrefs = { pengumuman: true, iuran: true, surat: true, kegiatan: true };
const notifKey = (userId: string) => `@ronda/notif/${userId}`;

export function countNotifActive(p: NotifPrefs): number {
  return [p.pengumuman, p.iuran, p.surat, p.kegiatan].filter(Boolean).length;
}
export async function loadNotifPrefs(userId: string): Promise<NotifPrefs> {
  return loadPrefs(notifKey(userId), NOTIF_DEFAULT);
}

const NOTIF_ITEMS: { key: keyof NotifPrefs; icon: IconName; title: string; sub: string }[] = [
  { key: 'pengumuman', icon: 'megaphone-outline', title: 'Pengumuman RT', sub: 'Info & papan pengumuman baru' },
  { key: 'iuran', icon: 'wallet-outline', title: 'Tagihan & Iuran', sub: 'Pengingat tagihan dan status bayar' },
  { key: 'surat', icon: 'document-text-outline', title: 'Status Surat', sub: 'Update pengajuan surat Anda' },
  { key: 'kegiatan', icon: 'calendar-outline', title: 'Kegiatan & Kerja Bakti', sub: 'Jadwal kegiatan RT' },
];

export function NotifikasiSheet({
  visible,
  userId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onSaved?: (p: NotifPrefs) => void;
}) {
  const [prefs, setPrefs] = useState<NotifPrefs>(NOTIF_DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    loadNotifPrefs(userId).then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, [visible, userId]);

  const toggle = async (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await savePrefs(notifKey(userId), next);
    onSaved?.(next);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Notifikasi" subtitle="Pilih notifikasi yang ingin Anda terima">
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ paddingVertical: 24 }} />
      ) : (
        NOTIF_ITEMS.map((it) => (
          <View key={it.key} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: wargaColors.lightGreen }]}>
              <Icon name={it.icon} size={18} color={wargaColors.primaryGreen} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>{it.title}</Text>
              <Text style={styles.rowSub}>{it.sub}</Text>
            </View>
            <Switch
              value={prefs[it.key]}
              onValueChange={() => toggle(it.key)}
              trackColor={{ true: wargaColors.primaryGreen, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        ))
      )}
      <Text style={styles.note}>Preferensi disimpan di perangkat ini.</Text>
    </Sheet>
  );
}

// ── Privasi & Keamanan ───────────────────────────────────────────────
export interface PrivacyPrefs {
  showPhone: boolean;
  showOnline: boolean;
}
const PRIVACY_DEFAULT: PrivacyPrefs = { showPhone: true, showOnline: true };
const privacyKey = (userId: string) => `@ronda/privacy/${userId}`;
export async function loadPrivacyPrefs(userId: string): Promise<PrivacyPrefs> {
  return loadPrefs(privacyKey(userId), PRIVACY_DEFAULT);
}

const PRIVACY_ITEMS: { key: keyof PrivacyPrefs; icon: IconName; title: string; sub: string }[] = [
  { key: 'showPhone', icon: 'call-outline', title: 'Tampilkan Nomor HP', sub: 'Pengurus tetap bisa menghubungi Anda' },
  { key: 'showOnline', icon: 'ellipse-outline', title: 'Tampilkan Status Online', sub: 'Tanda hijau di profil Anda' },
];

export function PrivasiSheet({
  visible,
  userId,
  onClose,
}: {
  visible: boolean;
  userId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [prefs, setPrefs] = useState<PrivacyPrefs>(PRIVACY_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setPwOpen(false);
    setPw1('');
    setPw2('');
    loadPrivacyPrefs(userId).then((p) => {
      setPrefs(p);
      setLoading(false);
    });
  }, [visible, userId]);

  const toggle = async (key: keyof PrivacyPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await savePrefs(privacyKey(userId), next);
  };

  const changePassword = async () => {
    if (pw1.length < 6) return toast.error('Kata sandi minimal 6 karakter');
    if (pw1 !== pw2) return toast.error('Konfirmasi kata sandi tidak cocok');
    setSaving(true);
    try {
      await authService.changePassword(pw1);
      toast.success('Kata sandi berhasil diubah');
      setPwOpen(false);
      setPw1('');
      setPw2('');
    } catch (e: any) {
      toast.error(String(e?.message ?? 'Gagal mengubah kata sandi'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Privasi & Keamanan" subtitle="Kelola keamanan akun Anda">
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ paddingVertical: 24 }} />
      ) : (
        <>
          {PRIVACY_ITEMS.map((it) => (
            <View key={it.key} style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: wargaColors.accentBlue }]}>
                <Icon name={it.icon} size={18} color="#185FA5" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rowTitle}>{it.title}</Text>
                <Text style={styles.rowSub}>{it.sub}</Text>
              </View>
              <Switch
                value={prefs[it.key]}
                onValueChange={() => toggle(it.key)}
                trackColor={{ true: wargaColors.primaryGreen, false: colors.border }}
                thumbColor="#fff"
              />
            </View>
          ))}

          <Pressable style={styles.row} onPress={() => setPwOpen((v) => !v)}>
            <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="lock-closed-outline" size={18} color={wargaColors.dangerRed} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.rowTitle}>Ubah Kata Sandi</Text>
              <Text style={styles.rowSub}>Perbarui kata sandi login Anda</Text>
            </View>
            <Icon name={pwOpen ? 'chevron-up' : 'chevron-forward'} size={18} color={colors.textSecondary} />
          </Pressable>

          {pwOpen && (
            <View style={styles.pwBox}>
              <TextInput
                style={styles.input}
                value={pw1}
                onChangeText={setPw1}
                placeholder="Kata sandi baru (min. 6 karakter)"
                placeholderTextColor={colors.textHint}
                secureTextEntry
              />
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                value={pw2}
                onChangeText={setPw2}
                placeholder="Ulangi kata sandi baru"
                placeholderTextColor={colors.textHint}
                secureTextEntry
              />
              <View style={{ height: 12 }} />
              <PrimaryButton label={saving ? 'Menyimpan…' : 'Simpan Kata Sandi'} onPress={changePassword} loading={saving} />
            </View>
          )}
          <Text style={styles.note}>Preferensi privasi disimpan di perangkat ini.</Text>
        </>
      )}
    </Sheet>
  );
}

// ── Kerangka bottom sheet ────────────────────────────────────────────
function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <View style={styles.head}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                <Icon name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  pwBox: { backgroundColor: colors.background, borderRadius: 14, padding: 14, marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface },
  note: { fontSize: 11, color: colors.textHint, textAlign: 'center', marginTop: 14 },
});
