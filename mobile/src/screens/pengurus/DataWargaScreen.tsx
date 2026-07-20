// Port dari lib/pages/warga/data_warga_page.dart
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, StatusChip, wargaText } from '../../components/warga/wargaUi';
import { PrimaryButton } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { wargaDirectoryService } from '../../services/wargaDirectoryService';
import { exportHtmlAsPdf } from '../../lib/suratPdf';
import { extractPdfLines } from '../../lib/pdfText';
import { buildWargaTemplateHtml, parseWargaFromPdfText } from '../../lib/wargaImportPdf';
import {
  WargaDirectoryEntry,
  directoryIsBendahara,
  directoryIsWarga,
  directoryIsPendingApproval,
  directoryRoleLabel,
} from '../../types/directory';
import { profileIsKetua } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DataWarga'>;

export default function DataWargaScreen({ route, navigation }: Props) {
  const { profile, rt } = route.params;
  const toast = useToast();
  const isKetua = profileIsKetua(profile);
  const [all, setAll] = useState<WargaDirectoryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<WargaDirectoryEntry | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await wargaDirectoryService.getDirectory(rt.id);
      setAll(list);
    } catch (e: any) {
      toast.error(`Gagal memuat: ${String(e?.message ?? e)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rt.id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (q === '') return all;
    return all.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.email?.toLowerCase().includes(q) ?? false),
    );
  }, [all, query]);

  const pendingCount = all.filter((e) => e.isPendingImport).length;

  const downloadTemplate = async () => {
    setMenuOpen(false);
    try {
      // Isi PDF dengan data warga terdaftar + baris kosong untuk tambah baru.
      const rows = all.map((e) => ({
        full_name: e.fullName,
        phone: e.phone,
        email: e.email ?? '',
        blok_rumah: e.blokRumah ?? '',
      }));
      await exportHtmlAsPdf(buildWargaTemplateHtml(rows), 'Data Warga RT', 'Data-Warga-RT.pdf');
    } catch (e: any) {
      toast.error(`Gagal membuat PDF: ${String(e?.message ?? e)}`);
    }
  };

  const approveWarga = async (m: WargaDirectoryEntry) => {
    try {
      await rtService.approveWarga(m.id);
      await load();
      toast.success(`${m.fullName} disetujui bergabung`);
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    }
  };

  const rejectWarga = async (m: WargaDirectoryEntry) => {
    try {
      await rtService.rejectWarga(m.id);
      await load();
      toast.success(`${m.fullName} ditolak`);
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    }
  };

  const importPdf = async () => {
    setMenuOpen(false);
    if (Platform.OS !== 'web') {
      toast.error('Import PDF saat ini tersedia di web. Di HP gunakan versi web dulu.');
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', '*/*'] });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    try {
      const text = await extractPdfLines(asset.uri);
      const rows = parseWargaFromPdfText(text);
      if (rows.length === 0) {
        toast.error('Tidak ada data terbaca. Pastikan PDF berupa teks (bukan foto) & tiap baris memuat No. HP.');
        return;
      }
      const stats = await wargaDirectoryService.importFromRows(rows as unknown as Array<Record<string, string>>);
      await load();
      toast.success(`Import PDF: ${stats.inserted} baru, ${stats.updated} diperbarui, ${stats.skipped} dilewati`);
    } catch (e: any) {
      toast.error(`Gagal impor PDF: ${String(e?.message ?? e)}`);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.appbarRow}>
        <WargaAppBarInline title="Data Warga" />
        {isKetua && (
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.menuBtn}>
            <Icon name="ellipsis-vertical" size={20} color={colors.emerald} />
          </Pressable>
        )}
      </View>

      {isKetua && pendingCount > 0 && (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingText}>
            {pendingCount} warga di-import menunggu daftar app. Saat login dengan nomor yang sama,
            mereka otomatis masuk RT tanpa kode undangan.
          </Text>
        </View>
      )}

      <View style={styles.searchWrap}>
        <Icon name="search" size={20} color={colors.emerald} />
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama atau nomor HP..."
          placeholderTextColor={colors.textHint}
        />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.emerald} size="large" /></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}><Text style={{ color: colors.textSecondary }}>Tidak ada warga ditemukan</Text></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          {filtered.map((m) => {
            const chipColor = m.isPendingImport
              ? colors.warning
              : m.isKetua
                ? colors.emeraldDark
                : directoryIsBendahara(m)
                  ? '#3B82F6'
                  : colors.emerald;
            const editable = isKetua && m.id !== profile.id;
            const pendingApproval = isKetua && directoryIsPendingApproval(m);

            // Warga baru menunggu persetujuan → kartu khusus dengan tombol Approve/Tolak.
            if (pendingApproval) {
              return (
                <WargaCard key={m.id} style={[styles.pendingCard]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {m.avatarUrl ? (
                      <Image source={{ uri: m.avatarUrl }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{m.fullName ? m.fullName[0].toUpperCase() : '?'}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{m.fullName}</Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{m.phone}</Text>
                    </View>
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>BARU DAFTAR</Text>
                    </View>
                  </View>
                  <View style={styles.approveRow}>
                    <Pressable style={[styles.appBtn, styles.rejectBtn]} onPress={() => rejectWarga(m)}>
                      <Icon name="close-circle-outline" size={18} color={wargaColors.dangerRed} />
                      <Text style={styles.rejectText}>Tolak</Text>
                    </Pressable>
                    <Pressable style={[styles.appBtn, styles.approveBtn]} onPress={() => approveWarga(m)}>
                      <Icon name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.approveText}>Setujui</Text>
                    </Pressable>
                  </View>
                </WargaCard>
              );
            }

            return (
              <WargaCard key={m.id} style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', padding: 14 }}>
                {m.avatarUrl ? (
                  <Image source={{ uri: m.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{m.fullName ? m.fullName[0].toUpperCase() : '?'}</Text>
                  </View>
                )}
                <Pressable
                  onPress={editable ? () => setEditing(m) : undefined}
                  disabled={!editable}
                  style={{ flex: 1, marginLeft: 12 }}
                >
                  <Text style={{ fontWeight: '600', color: colors.textPrimary }}>{m.fullName}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>{m.phone}</Text>
                  {m.blokRumah ? <Text style={{ fontSize: 12, color: colors.textHint }}>{m.blokRumah}</Text> : null}
                </Pressable>
                <StatusChip label={directoryRoleLabel(m)} color={chipColor} />
                {isKetua && !m.isPendingImport && (
                  <Pressable
                    onPress={() => navigation.navigate('FamilyMembers', { rt, headId: m.id, headName: m.fullName })}
                    hitSlop={6}
                    style={{ padding: 6, marginLeft: 4 }}
                  >
                    <Icon name="people-outline" size={20} color="#3B82F6" />
                  </Pressable>
                )}
                {editable && (
                  <Pressable onPress={() => setEditing(m)} hitSlop={6} style={{ padding: 6 }}>
                    <Icon name="create-outline" size={18} color={colors.emerald} />
                  </Pressable>
                )}
              </WargaCard>
            );
          })}
        </ScrollView>
      )}

      {/* Menu template/import */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Pressable style={styles.menuItem} onPress={downloadTemplate}>
              <Icon name="download-outline" size={20} color={colors.emerald} />
              <Text style={styles.menuText}>Unduh data warga (PDF)</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={importPdf}>
              <Icon name="cloud-upload-outline" size={20} color={colors.emerald} />
              <Text style={styles.menuText}>Import data warga (PDF)</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {editing && (
        <EditEntryModal
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            toast.success('Data warga diperbarui');
          }}
        />
      )}
    </SafeAreaView>
  );
}

function WargaAppBarInline({ title }: { title: string }) {
  return (
    <View style={{ flex: 1 }}>
      <WargaAppBar title={title} />
    </View>
  );
}

function EditEntryModal({
  entry,
  onClose,
  onSaved,
}: {
  entry: WargaDirectoryEntry;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(entry.fullName);
  const [phone, setPhone] = useState(entry.phone.replace('+62', ''));
  const [email, setEmail] = useState(entry.email ?? '');
  const [blok, setBlok] = useState(entry.blokRumah ?? '');
  const [role, setRole] = useState(entry.role);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      if (entry.isPendingImport) {
        await wargaDirectoryService.updateRegistryEntry({ id: entry.id, fullName: name.trim(), phone: phone.trim(), email: email.trim(), blokRumah: blok.trim() });
      } else {
        await wargaDirectoryService.updateMemberName(entry.id, name.trim());
        if (role === 'bendahara' && directoryIsWarga(entry)) await rtService.appointBendahara(entry.id);
        else if (role === 'warga' && directoryIsBendahara(entry)) await rtService.revokeBendahara(entry.id);
      }
      onSaved();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      await wargaDirectoryService.deleteRegistryEntry(entry.id);
      onSaved();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.editBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.editSheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>{entry.fullName}</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 16 }}>
              {entry.isPendingImport ? 'Belum punya akun — akan auto gabung saat login' : directoryRoleLabel(entry)}
            </Text>
            <Text style={styles.eLabel}>Nama lengkap</Text>
            <TextInput style={styles.eInput} value={name} onChangeText={setName} />
            <Text style={styles.eLabel}>Nomor HP</Text>
            <TextInput style={styles.eInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            {entry.isPendingImport && (
              <>
                <Text style={styles.eLabel}>Email (opsional)</Text>
                <TextInput style={styles.eInput} value={email} onChangeText={setEmail} autoCapitalize="none" />
                <Text style={styles.eLabel}>Blok / rumah (opsional)</Text>
                <TextInput style={styles.eInput} value={blok} onChangeText={setBlok} />
              </>
            )}
            {!entry.isPendingImport && !entry.isKetua && (
              <>
                <Text style={styles.eLabel}>Peran di RT</Text>
                <View style={styles.roleToggle}>
                  <Pressable onPress={() => setRole('warga')} style={[styles.roleBtn, role !== 'bendahara' && styles.roleActive]}>
                    <Text style={[styles.roleText, role !== 'bendahara' && { color: colors.emerald }]}>Warga</Text>
                  </Pressable>
                  <Pressable onPress={() => setRole('bendahara')} style={[styles.roleBtn, role === 'bendahara' && styles.roleActive]}>
                    <Text style={[styles.roleText, role === 'bendahara' && { color: colors.emerald }]}>Bendahara</Text>
                  </Pressable>
                </View>
              </>
            )}
            <View style={{ height: 20 }} />
            <PrimaryButton label={saving ? 'Menyimpan...' : 'Simpan'} onPress={save} loading={saving} />
            {entry.isPendingImport && (
              <Pressable onPress={remove} style={styles.deleteBtn}>
                <Text style={{ color: colors.danger, fontWeight: '600' }}>Hapus dari daftar</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  appbarRow: { flexDirection: 'row', alignItems: 'center' },
  menuBtn: { padding: 10, marginRight: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  pendingBanner: { marginHorizontal: 16, marginTop: 4, padding: 12, backgroundColor: colors.emeraldMuted, borderRadius: 12 },
  pendingText: { fontSize: 12, color: colors.emeraldDark, lineHeight: 17 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, paddingHorizontal: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md },
  search: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.emeraldSoft },
  avatarText: { color: colors.emerald, fontWeight: '700' },
  pendingCard: { marginBottom: 10, padding: 14, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  newBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#FEF3C7' },
  newBadgeText: { fontSize: 9, fontWeight: '700', color: '#B45309', letterSpacing: 0.3 },
  approveRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  appBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 42, borderRadius: 10 },
  rejectBtn: { borderWidth: 1, borderColor: wargaColors.dangerRed },
  rejectText: { color: wargaColors.dangerRed, fontWeight: '700' },
  approveBtn: { backgroundColor: wargaColors.primaryGreen },
  approveText: { color: '#fff', fontWeight: '700' },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', paddingTop: 60, paddingRight: 12, alignItems: 'flex-end' },
  menu: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 6, minWidth: 220, ...{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  menuText: { fontSize: 14, color: colors.textPrimary },
  editBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  editSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  eLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
  eInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  roleToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  roleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  roleActive: { backgroundColor: '#fff' },
  roleText: { fontWeight: '600', color: colors.textSecondary },
  deleteBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
});
