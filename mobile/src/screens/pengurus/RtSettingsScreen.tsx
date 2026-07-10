// Setting RT untuk Ketua RT: alamat, rekening bank, kop surat, tanda tangan, QRIS.
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
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
import { useNavigation } from '@react-navigation/native';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { PrimaryButton } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { storageService, PickedImage, RtAssetKind } from '../../services/storageService';
import { profileIsKetua, RtUnit } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RtSettings'>;

export default function RtSettingsScreen({ route }: Props) {
  const { profile, rt: initialRt, onSaved } = route.params;
  const toast = useToast();
  const navigation = useNavigation();
  const isKetua = profileIsKetua(profile);

  const [rt, setRt] = useState<RtUnit>(initialRt);
  const [address, setAddress] = useState(initialRt.address ?? '');
  const [bankName, setBankName] = useState(initialRt.bankName ?? '');
  const [bankAccountName, setBankAccountName] = useState(initialRt.bankAccountName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(initialRt.bankAccountNumber ?? '');
  const [kopLocal, setKopLocal] = useState<PickedImage | null>(null);
  const [sigLocal, setSigLocal] = useState<PickedImage | null>(null);
  const [qrisLocal, setQrisLocal] = useState<PickedImage | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async (setter: (f: PickedImage) => void) => {
    const file = await storageService.pickImageFromGallery();
    if (file) setter(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      const uploads: Array<[RtAssetKind, PickedImage | null, keyof RtUnit]> = [
        ['kop', kopLocal, 'kopSuratUrl'],
        ['signature', sigLocal, 'signatureUrl'],
        ['qris', qrisLocal, 'qrisUrl'],
      ];
      let kopUrl = rt.kopSuratUrl;
      let sigUrl = rt.signatureUrl;
      let qrisUrl = rt.qrisUrl;
      for (const [kind, file] of uploads) {
        if (!file) continue;
        const url = await storageService.uploadRtAsset(rt.id, kind, file);
        if (kind === 'kop') kopUrl = url;
        else if (kind === 'signature') sigUrl = url;
        else qrisUrl = url;
      }

      const clean = (s: string) => (s.trim() === '' ? null : s.trim());
      const updated = await rtService.updateRtSettings(rt.id, {
        address: clean(address),
        kop_surat_url: kopUrl,
        signature_url: sigUrl,
        qris_url: qrisUrl,
        bank_name: clean(bankName),
        bank_account_name: clean(bankAccountName),
        bank_account_number: clean(bankAccountNumber),
      });
      setRt(updated);
      setKopLocal(null);
      setSigLocal(null);
      setQrisLocal(null);
      onSaved?.(updated);
      toast.success('Setting RT disimpan');
      navigation.goBack();
    } catch (e: any) {
      toast.error(`Gagal menyimpan: ${String(e?.message ?? e)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isKetua) {
    return (
      <SafeAreaView edges={['top']} style={styles.safe}>
        <WargaAppBar title="Pengaturan RT" />
        <View style={styles.center}>
          <Icon name="lock-closed-outline" size={40} color={colors.textSecondary} />
          <Text style={[wargaText.greeting, { marginTop: 12, textAlign: 'center' }]}>
            Hanya Ketua RT yang dapat mengubah pengaturan RT.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Pengaturan RT" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Alamat RT */}
          <WargaCard style={{ marginBottom: 16 }}>
            <Text style={wargaText.sectionTitle}>Alamat Profil RT</Text>
            <Text style={styles.hint}>Dipakai pada kop / surat pengantar.</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={address}
              onChangeText={setAddress}
              placeholder="Contoh: Jl. Melati No. 1, RT 01 RW 02, Kel. Cipayung"
              placeholderTextColor={colors.textHint}
              multiline
            />
          </WargaCard>

          {/* Rekening Bank */}
          <WargaCard style={{ marginBottom: 16 }}>
            <Text style={wargaText.sectionTitle}>Rekening Bank</Text>
            <Text style={styles.hint}>Untuk pembayaran iuran via transfer.</Text>
            <Text style={styles.label}>Nama Bank</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="Contoh: BCA / BRI / Mandiri"
              placeholderTextColor={colors.textHint}
            />
            <Text style={styles.label}>Nama Pemilik Rekening</Text>
            <TextInput
              style={styles.input}
              value={bankAccountName}
              onChangeText={setBankAccountName}
              placeholder="Nama sesuai buku tabungan"
              placeholderTextColor={colors.textHint}
            />
            <Text style={styles.label}>Nomor Rekening</Text>
            <TextInput
              style={styles.input}
              value={bankAccountNumber}
              onChangeText={setBankAccountNumber}
              placeholder="Contoh: 1234567890"
              placeholderTextColor={colors.textHint}
              keyboardType="number-pad"
            />
          </WargaCard>

          {/* Kop Surat */}
          <ImageField
            title="Kop Surat"
            hint="Gambar kop (logo + header) untuk surat pengantar."
            currentUrl={rt.kopSuratUrl}
            local={kopLocal}
            aspectRatio={3}
            onPick={() => pick(setKopLocal)}
            onClear={() => setKopLocal(null)}
          />

          {/* Tanda Tangan Digital */}
          <ImageField
            title="Tanda Tangan Digital"
            hint="Gambar tanda tangan Ketua RT (latar transparan/putih)."
            currentUrl={rt.signatureUrl}
            local={sigLocal}
            aspectRatio={2.4}
            onPick={() => pick(setSigLocal)}
            onClear={() => setSigLocal(null)}
          />

          {/* QRIS */}
          <ImageField
            title="Gambar QRIS"
            hint="Kode QRIS untuk pembayaran iuran warga."
            currentUrl={rt.qrisUrl}
            local={qrisLocal}
            aspectRatio={1}
            onPick={() => pick(setQrisLocal)}
            onClear={() => setQrisLocal(null)}
          />

          <View style={{ height: 8 }} />
          <PrimaryButton label="Simpan Pengaturan" onPress={save} loading={saving} />
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ImageField({
  title,
  hint,
  currentUrl,
  local,
  aspectRatio,
  onPick,
  onClear,
}: {
  title: string;
  hint: string;
  currentUrl: string | null;
  local: PickedImage | null;
  aspectRatio: number;
  onPick: () => void;
  onClear: () => void;
}) {
  const uri = local?.uri ?? currentUrl ?? undefined;
  return (
    <WargaCard style={{ marginBottom: 16 }}>
      <Text style={wargaText.sectionTitle}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      <Pressable onPress={onPick} style={[styles.preview, { aspectRatio }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.previewImg} resizeMode="contain" />
        ) : (
          <View style={styles.previewEmpty}>
            <Icon name="image-outline" size={28} color={colors.textSecondary} />
            <Text style={styles.previewEmptyText}>Ketuk untuk pilih gambar</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.imgActions}>
        <Pressable onPress={onPick} hitSlop={6} style={styles.imgAction}>
          <Icon name="cloud-upload-outline" size={16} color={wargaColors.primaryGreen} />
          <Text style={styles.imgActionText}>{uri ? 'Ganti' : 'Pilih'} gambar</Text>
        </Pressable>
        {local && (
          <Pressable onPress={onClear} hitSlop={6} style={styles.imgAction}>
            <Icon name="close-circle-outline" size={16} color={wargaColors.dangerRed} />
            <Text style={[styles.imgActionText, { color: wargaColors.dangerRed }]}>Batal</Text>
          </Pressable>
        )}
      </View>
      {local && <Text style={styles.pendingNote}>Gambar baru akan diunggah saat disimpan.</Text>}
    </WargaCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  label: { fontSize: 13, color: colors.textSecondary, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  preview: {
    marginTop: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  previewImg: { width: '100%', height: '100%' },
  previewEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  previewEmptyText: { fontSize: 12, color: colors.textSecondary },
  imgActions: { flexDirection: 'row', gap: 20, marginTop: 10 },
  imgAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  imgActionText: { fontSize: 13, fontWeight: '600', color: wargaColors.primaryGreen },
  pendingNote: { fontSize: 11, color: colors.textSecondary, marginTop: 8, fontStyle: 'italic' },
});
