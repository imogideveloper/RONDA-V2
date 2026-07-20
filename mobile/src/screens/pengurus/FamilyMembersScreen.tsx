// Ketua RT / Bendahara mengelola anggota keluarga seorang warga (kepala keluarga).
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '../../components/Icon';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { PrimaryButton } from '../../components/Card';
import { DateField } from '../../components/DateField';
import { useToast } from '../../components/Toast';
import { confirmDialog } from '../../lib/dialog';
import * as DocumentPicker from 'expo-document-picker';
import { ocrKk } from '../../lib/kkOcr';
import { extractPdfLines } from '../../lib/pdfText';
import { parseKkMembers, parseKkAddress } from '../../lib/kkParser';
import { familyService, FamilyMemberInput } from '../../services/familyService';
import { rtService } from '../../services/rtService';
import { FamilyMember } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMembers'>;

const RELATIONS = ['Istri', 'Suami', 'Anak', 'Orang Tua', 'Saudara', 'Lainnya'];

export default function FamilyMembersScreen({ route }: Props) {
  const { rt, headId, headName } = route.params;
  const toast = useToast();
  const [list, setList] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FamilyMember | null | 'new'>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrMsg, setOcrMsg] = useState('');
  const [drafts, setDrafts] = useState<FamilyMemberInput[] | null>(null);
  const [headAddress, setHeadAddress] = useState('');

  const load = useCallback(async () => {
    try {
      setList(await familyService.listForHead(headId));
      // Tampilkan alamat kepala keluarga yang tersimpan (dari KK sebelumnya), bila ada.
      const members = await rtService.getRtMembers().catch(() => []);
      const head = members.find((m) => m.id === headId);
      if (head?.address) setHeadAddress(head.address);
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [headId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const scanKk = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      const isPdf =
        (asset.mimeType ?? '').includes('pdf') || (asset.name ?? '').toLowerCase().endsWith('.pdf');
      setOcrBusy(true);

      // PDF: coba baca teks langsung (akurat). Kalau tak ada teks (scan/foto) -> OCR.
      let text = '';
      if (isPdf) {
        setOcrMsg('Membaca teks PDF…');
        try {
          text = await extractPdfLines(asset.uri);
        } catch {
          text = '';
        }
      }
      if (!/\d{16}/.test(text)) {
        setOcrMsg('Memuat OCR…');
        text = await ocrKk(asset.uri, isPdf, (p) => setOcrMsg(`Membaca KK… ${Math.round(p * 100)}%`));
      }
      // Alamat dari header KK -> simpan ke profil kepala keluarga (best-effort).
      const address = parseKkAddress(text);
      if (address) {
        try {
          await familyService.setMemberAddress(headId, address);
          setHeadAddress(address);
          toast.success(`Alamat KK tersimpan: ${address}`);
        } catch {
          // abaikan bila gagal simpan alamat
        }
      }

      const members = parseKkMembers(text);
      if (members.length === 0) {
        if (!address) toast.error('Tidak terdeteksi data dari KK. Coba foto lebih jelas, atau input manual.');
        return;
      }
      setDrafts(members);
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setOcrBusy(false);
      setOcrMsg('');
    }
  };

  const saveDrafts = async (members: FamilyMemberInput[]) => {
    const valid = members.filter((m) => m.name.trim() !== '');
    try {
      for (const m of valid) await familyService.addMember(rt.id, headId, m);
      setDrafts(null);
      await load();
      toast.success(`${valid.length} anggota keluarga ditambahkan`);
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    }
  };

  const remove = (m: FamilyMember) =>
    confirmDialog('Hapus anggota?', `Hapus ${m.name} dari daftar keluarga?`, async () => {
      try {
        await familyService.deleteMember(m.id);
        await load();
        toast.success('Anggota dihapus');
      } catch (e: any) {
        toast.error(String(e?.message ?? e));
      }
    }, 'Hapus');

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Anggota Keluarga" />
      <View style={styles.headBox}>
        <Text style={styles.headLabel}>KEPALA KELUARGA</Text>
        <Text style={styles.headName}>{headName}</Text>
        {headAddress !== '' && (
          <View style={styles.headAddrRow}>
            <Icon name="home-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.headAddr}>{headAddress}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.emerald} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {list.length === 0 ? (
            <Text style={styles.empty}>Belum ada anggota keluarga. Tambah dengan tombol di bawah.</Text>
          ) : (
            list.map((m) => (
              <View key={m.id} style={styles.card}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{m.name ? m.name[0].toUpperCase() : '?'}</Text></View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.name}>{m.name}</Text>
                  <Text style={styles.sub}>{[m.relation, m.nik].filter(Boolean).join(' · ') || '—'}</Text>
                </View>
                <Pressable onPress={() => setEditing(m)} hitSlop={8} style={styles.iconBtn}>
                  <Icon name="create-outline" size={18} color={colors.emerald} />
                </Pressable>
                <Pressable onPress={() => remove(m)} hitSlop={8} style={styles.iconBtn}>
                  <Icon name="remove-circle-outline" size={20} color={wargaColors.dangerRed} />
                </Pressable>
              </View>
            ))
          )}
          <View style={{ height: 16 }} />
          <Pressable onPress={ocrBusy ? undefined : scanKk} style={[styles.scanBtn, ocrBusy && { opacity: 0.7 }]}>
            {ocrBusy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Icon name="camera" size={18} color="#fff" />
            )}
            <Text style={styles.scanText}>{ocrBusy ? (ocrMsg || 'Memproses…') : 'Scan KK (Foto / PDF)'}</Text>
          </Pressable>
          <View style={styles.scanNote}>
            <Text style={styles.scanPoint}>
              • Paling akurat: <Text style={styles.scanHintBold}>KK digital (PDF asli dari Dukcapil)</Text> — anggota keluarga terisi otomatis.
            </Text>
            <Text style={styles.scanPoint}>• Foto/scan gambar dibaca via OCR — hasilnya bisa meleset.</Text>
            <Text style={styles.scanPoint}>
              • Selalu <Text style={styles.scanHintBold}>periksa & rapikan</Text> sebelum simpan.
            </Text>
            <Text style={styles.scanPoint}>• Butuh koneksi internet.</Text>
          </View>
          <View style={{ height: 12 }} />
          <Pressable onPress={() => setEditing('new')} style={styles.addBtn}>
            <Icon name="add-circle-outline" size={20} color={wargaColors.primaryGreen} />
            <Text style={styles.addText}>Tambah Manual</Text>
          </Pressable>
        </ScrollView>
      )}

      {drafts && (
        <KkReviewModal
          initial={drafts}
          onCancel={() => setDrafts(null)}
          onSave={saveDrafts}
        />
      )}

      {editing !== null && (
        <MemberFormModal
          rtId={rt.id}
          headId={headId}
          member={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
            toast.success('Data keluarga disimpan');
          }}
        />
      )}
    </SafeAreaView>
  );
}

function MemberFormModal({
  rtId,
  headId,
  member,
  onClose,
  onSaved,
}: {
  rtId: string;
  headId: string;
  member: FamilyMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(member?.name ?? '');
  const [relation, setRelation] = useState(member?.relation ?? 'Anak');
  const [nik, setNik] = useState(member?.nik ?? '');
  const [birthPlace, setBirthPlace] = useState(member?.birthPlace ?? '');
  const [birthDate, setBirthDate] = useState(member?.birthDate ?? '');
  const [gender, setGender] = useState(member?.gender ?? '');
  const [religion, setReligion] = useState(member?.religion ?? '');
  const [maritalStatus, setMaritalStatus] = useState(member?.maritalStatus ?? '');
  const [occupation, setOccupation] = useState(member?.occupation ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (name.trim() === '') {
      toast.error('Nama wajib diisi');
      return;
    }
    setSaving(true);
    const input: FamilyMemberInput = { name, relation, nik, birthPlace, birthDate, gender, religion, maritalStatus, occupation };
    try {
      if (member) await familyService.updateMember(member.id, input);
      else await familyService.addMember(rtId, headId, input);
      onSaved();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.sheetTitle}>{member ? 'Edit Anggota' : 'Tambah Anggota'}</Text>

              <Text style={styles.label}>Nama lengkap</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama lengkap" placeholderTextColor={colors.textHint} />

              <Text style={styles.label}>Hubungan</Text>
              <View style={styles.chips}>
                {RELATIONS.map((r) => (
                  <Pressable key={r} onPress={() => setRelation(r)} style={[styles.chip, relation === r && styles.chipActive]}>
                    <Text style={[styles.chipText, relation === r && { color: '#fff' }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>NIK</Text>
              <TextInput style={styles.input} value={nik} onChangeText={setNik} keyboardType="number-pad" placeholder="16 digit NIK" placeholderTextColor={colors.textHint} />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tempat Lahir</Text>
                  <TextInput style={styles.input} value={birthPlace} onChangeText={setBirthPlace} placeholder="Bogor" placeholderTextColor={colors.textHint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Tanggal Lahir</Text>
                  <DateField value={birthDate} onChange={setBirthDate} placeholder="12 Mei 2012" />
                </View>
              </View>

              <Text style={styles.label}>Jenis Kelamin</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['Laki-laki', 'Perempuan'].map((g) => (
                  <Pressable key={g} onPress={() => setGender(g)} style={[styles.genderBtn, gender === g && styles.genderBtnActive]}>
                    <Text style={[styles.chipText, gender === g && { color: '#fff' }]}>{g}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Agama</Text>
                  <TextInput style={styles.input} value={religion} onChangeText={setReligion} placeholder="Islam" placeholderTextColor={colors.textHint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Status</Text>
                  <TextInput style={styles.input} value={maritalStatus} onChangeText={setMaritalStatus} placeholder="Belum Kawin" placeholderTextColor={colors.textHint} />
                </View>
              </View>

              <Text style={styles.label}>Pekerjaan</Text>
              <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Pelajar / Wiraswasta" placeholderTextColor={colors.textHint} />

              <View style={{ height: 18 }} />
              <PrimaryButton label={saving ? 'Menyimpan…' : 'Simpan'} onPress={save} loading={saving} />
              <View style={{ height: 12 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function KkReviewModal({
  initial,
  onCancel,
  onSave,
}: {
  initial: FamilyMemberInput[];
  onCancel: () => void;
  onSave: (m: FamilyMemberInput[]) => Promise<void> | void;
}) {
  const [rows, setRows] = useState<FamilyMemberInput[]>(initial);
  const [saving, setSaving] = useState(false);
  const setRow = (i: number, patch: Partial<FamilyMemberInput>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i));
  const validCount = rows.filter((r) => r.name.trim() !== '').length;
  const submit = async () => {
    setSaving(true);
    await onSave(rows);
    setSaving(false);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>Hasil Scan KK</Text>
          <Text style={styles.reviewHint}>
            Periksa & rapikan (OCR sering meleset). Hapus baris yang salah.
          </Text>
          <ScrollView style={{ maxHeight: 430 }} keyboardShouldPersistTaps="handled">
            {rows.map((r, i) => (
              <View key={i} style={styles.reviewRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.input}
                    value={r.name}
                    onChangeText={(t) => setRow(i, { name: t })}
                    placeholder="Nama anggota"
                    placeholderTextColor={colors.textHint}
                  />
                  <View style={[styles.chips, { marginTop: 8 }]}>
                    {RELATIONS.map((rel) => (
                      <Pressable
                        key={rel}
                        onPress={() => setRow(i, { relation: rel })}
                        style={[styles.chip, r.relation === rel && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, r.relation === rel && { color: '#fff' }]}>{rel}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {r.nik ? <Text style={styles.reviewNik}>NIK: {r.nik}</Text> : null}
                </View>
                <Pressable onPress={() => removeRow(i)} hitSlop={8} style={{ padding: 6 }}>
                  <Icon name="remove-circle-outline" size={22} color={wargaColors.dangerRed} />
                </Pressable>
              </View>
            ))}
            <View style={{ height: 8 }} />
          </ScrollView>
          <View style={{ height: 12 }} />
          <PrimaryButton
            label={saving ? 'Menyimpan…' : `Simpan ${validCount} Anggota`}
            onPress={submit}
            loading={saving}
            disabled={validCount === 0}
          />
          <View style={{ height: 8 }} />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  headBox: { paddingHorizontal: 20, paddingBottom: 8 },
  headLabel: { fontSize: 10, fontWeight: '700', color: colors.textHint, letterSpacing: 0.4 },
  headName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  headAddrRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 6 },
  headAddr: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  empty: { color: colors.textSecondary, textAlign: 'center', paddingVertical: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.emerald, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  iconBtn: { padding: 6 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: wargaColors.primaryGreen, borderStyle: 'dashed',
  },
  addText: { fontSize: 14, fontWeight: '600', color: wargaColors.primaryGreen },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 13, borderRadius: 14, backgroundColor: wargaColors.primaryGreen,
  },
  scanText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scanNote: { marginTop: 10, gap: 4 },
  scanPoint: { fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  scanHintBold: { fontWeight: '700', color: colors.textPrimary },
  reviewHint: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  reviewRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  reviewNik: { fontSize: 11, color: colors.textHint, marginTop: 6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  label: { fontSize: 13, color: colors.textSecondary, marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: wargaColors.primaryGreen, borderColor: wargaColors.primaryGreen },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  genderBtn: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  genderBtnActive: { backgroundColor: wargaColors.primaryGreen, borderColor: wargaColors.primaryGreen },
});
