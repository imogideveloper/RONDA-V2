// Setting RT untuk Ketua RT: alamat, rekening bank, kop surat, tanda tangan, QRIS.
import React, { useRef, useState } from 'react';
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
import { SignaturePad, SignaturePadRef } from '../../components/warga/SignaturePad';
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
  const [kelurahan, setKelurahan] = useState(initialRt.kelurahan ?? '');
  const [kecamatan, setKecamatan] = useState(initialRt.kecamatan ?? '');
  const [kota, setKota] = useState(initialRt.kota ?? '');
  const [bankName, setBankName] = useState(initialRt.bankName ?? '');
  const [bankAccountName, setBankAccountName] = useState(initialRt.bankAccountName ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(initialRt.bankAccountNumber ?? '');
  const [kopLocal, setKopLocal] = useState<PickedImage | null>(null);
  const [sigLocal, setSigLocal] = useState<PickedImage | null>(null);
  const [qrisLocal, setQrisLocal] = useState<PickedImage | null>(null);
  const [kopRemoved, setKopRemoved] = useState(false);
  const [sigRemoved, setSigRemoved] = useState(false);
  const [qrisRemoved, setQrisRemoved] = useState(false);
  const sigPadRef = useRef<SignaturePadRef>(null);
  const [saving, setSaving] = useState(false);

  const pick = async (setter: (f: PickedImage) => void) => {
    const file = await storageService.pickImageFromGallery();
    if (file) setter(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      let kopUrl = kopRemoved ? null : rt.kopSuratUrl;
      let sigUrl = sigRemoved ? null : rt.signatureUrl;
      let qrisUrl = qrisRemoved ? null : rt.qrisUrl;
      if (kopLocal) kopUrl = await storageService.uploadRtAsset(rt.id, 'kop', kopLocal);
      if (qrisLocal) qrisUrl = await storageService.uploadRtAsset(rt.id, 'qris', qrisLocal);

      // Tanda tangan: dari upload gambar, atau dari gambar-tangan (papan).
      if (sigLocal) {
        sigUrl = await storageService.uploadRtAsset(rt.id, 'signature', sigLocal);
      } else {
        const drawn = await sigPadRef.current?.getPngDataUrl();
        if (drawn) {
          sigUrl = await storageService.uploadRtAsset(rt.id, 'signature', {
            uri: drawn,
            fileName: 'signature.png',
            mimeType: 'image/png',
          });
        }
      }

      const clean = (s: string) => (s.trim() === '' ? null : s.trim());
      const updated = await rtService.updateRtSettings(rt.id, {
        address: clean(address),
        kelurahan: clean(kelurahan),
        kecamatan: clean(kecamatan),
        kota: clean(kota),
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
      setKopRemoved(false);
      setSigRemoved(false);
      setQrisRemoved(false);
      sigPadRef.current?.clear();
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
              placeholder="Contoh: Jl. Melati No. 1, RT 01 RW 02"
              placeholderTextColor={colors.textHint}
              multiline
            />
            <Text style={styles.label}>Kelurahan / Desa</Text>
            <TextInput style={styles.input} value={kelurahan} onChangeText={setKelurahan} placeholder="Contoh: Sukamaju" placeholderTextColor={colors.textHint} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Kecamatan</Text>
                <TextInput style={styles.input} value={kecamatan} onChangeText={setKecamatan} placeholder="Contoh: Cilodong" placeholderTextColor={colors.textHint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Kota / Kabupaten</Text>
                <TextInput style={styles.input} value={kota} onChangeText={setKota} placeholder="Contoh: Depok" placeholderTextColor={colors.textHint} />
              </View>
            </View>
          </WargaCard>

          {/* Kop Surat */}
          <ImageField
            title="Kop Surat"
            hint="Gambar kop (logo + header) untuk surat pengantar."
            currentUrl={kopRemoved ? null : rt.kopSuratUrl}
            local={kopLocal}
            aspectRatio={3}
            onPick={() => { setKopRemoved(false); pick(setKopLocal); }}
            onClear={() => setKopLocal(null)}
            onRemove={() => { setKopLocal(null); setKopRemoved(true); }}
          />

          {/* Tanda Tangan Digital — gambar langsung / upload */}
          <WargaCard style={{ marginBottom: 16 }}>
            <Text style={wargaText.sectionTitle}>Tanda Tangan Digital</Text>
            <Text style={styles.hint}>Gambar tanda tangan langsung di kotak (jari/mouse), atau upload gambar.</Text>
            {sigLocal ? (
              <>
                <View style={[styles.preview, { aspectRatio: 2.4 }]}>
                  <Image source={{ uri: sigLocal.uri }} style={styles.previewImg} resizeMode="contain" />
                </View>
                <View style={styles.imgActions}>
                  <Pressable onPress={() => pick(setSigLocal)} hitSlop={6} style={styles.imgAction}>
                    <Icon name="cloud-upload-outline" size={16} color={wargaColors.primaryGreen} />
                    <Text style={styles.imgActionText}>Ganti gambar</Text>
                  </Pressable>
                  <Pressable onPress={() => setSigLocal(null)} hitSlop={6} style={styles.imgAction}>
                    <Icon name="create-outline" size={16} color={wargaColors.primaryGreen} />
                    <Text style={styles.imgActionText}>Gambar tangan</Text>
                  </Pressable>
                </View>
                <Text style={styles.pendingNote}>Gambar baru akan diunggah saat disimpan.</Text>
              </>
            ) : (
              <>
                <SignaturePad ref={sigPadRef} />
                <View style={styles.imgActions}>
                  <Pressable onPress={() => sigPadRef.current?.clear()} hitSlop={6} style={styles.imgAction}>
                    <Icon name="refresh" size={16} color={wargaColors.primaryGreen} />
                    <Text style={styles.imgActionText}>Bersihkan</Text>
                  </Pressable>
                  <Pressable onPress={() => pick(setSigLocal)} hitSlop={6} style={styles.imgAction}>
                    <Icon name="cloud-upload-outline" size={16} color={wargaColors.primaryGreen} />
                    <Text style={styles.imgActionText}>Upload gambar</Text>
                  </Pressable>
                </View>
                {!sigRemoved && rt.signatureUrl && (
                  <>
                    <Text style={styles.pendingNote}>Tanda tangan tersimpan (dipakai jika kotak dikosongkan):</Text>
                    <View style={[styles.preview, { aspectRatio: 2.4, marginTop: 6 }]}>
                      <Image source={{ uri: rt.signatureUrl }} style={styles.previewImg} resizeMode="contain" />
                    </View>
                    <Pressable onPress={() => setSigRemoved(true)} hitSlop={6} style={[styles.imgAction, { marginTop: 8 }]}>
                      <Icon name="close-circle-outline" size={16} color={wargaColors.dangerRed} />
                      <Text style={[styles.imgActionText, { color: wargaColors.dangerRed }]}>Hapus tanda tangan tersimpan</Text>
                    </Pressable>
                  </>
                )}
                {sigRemoved && (
                  <Text style={styles.pendingNote}>Tanda tangan akan dihapus saat disimpan.</Text>
                )}
              </>
            )}
          </WargaCard>

          {/* Pembayaran Iuran — Rekening Bank + QRIS (jadi satu) */}
          <WargaCard style={{ marginBottom: 16 }}>
            <Text style={wargaText.sectionTitle}>Pembayaran Iuran</Text>
            <Text style={styles.hint}>Rekening bank & QRIS untuk pembayaran iuran warga.</Text>
            <Text style={styles.label}>Nama Bank</Text>
            <TextInput style={styles.input} value={bankName} onChangeText={setBankName} placeholder="Contoh: BCA / BRI / Mandiri" placeholderTextColor={colors.textHint} />
            <Text style={styles.label}>Nama Pemilik Rekening</Text>
            <TextInput style={styles.input} value={bankAccountName} onChangeText={setBankAccountName} placeholder="Nama sesuai buku tabungan" placeholderTextColor={colors.textHint} />
            <Text style={styles.label}>Nomor Rekening</Text>
            <TextInput style={styles.input} value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="Contoh: 1234567890" placeholderTextColor={colors.textHint} keyboardType="number-pad" />
            <View style={styles.cardDivider} />
            <ImageField
              bare
              title="Gambar QRIS"
              hint="Kode QRIS untuk pembayaran iuran warga."
              currentUrl={qrisRemoved ? null : rt.qrisUrl}
              local={qrisLocal}
              aspectRatio={1}
              onPick={() => { setQrisRemoved(false); pick(setQrisLocal); }}
              onClear={() => setQrisLocal(null)}
              onRemove={() => { setQrisLocal(null); setQrisRemoved(true); }}
            />
          </WargaCard>

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
  onRemove,
  bare,
}: {
  title: string;
  hint: string;
  currentUrl: string | null;
  local: PickedImage | null;
  aspectRatio: number;
  onPick: () => void;
  onClear: () => void;
  onRemove?: () => void;
  bare?: boolean;
}) {
  const uri = local?.uri ?? currentUrl ?? undefined;
  const Wrapper: any = bare ? View : WargaCard;
  const wrapperStyle = bare ? { marginTop: 4 } : { marginBottom: 16 };
  return (
    <Wrapper style={wrapperStyle}>
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
        {local ? (
          <Pressable onPress={onClear} hitSlop={6} style={styles.imgAction}>
            <Icon name="close-circle-outline" size={16} color={wargaColors.dangerRed} />
            <Text style={[styles.imgActionText, { color: wargaColors.dangerRed }]}>Batal</Text>
          </Pressable>
        ) : (
          uri != null &&
          onRemove && (
            <Pressable onPress={onRemove} hitSlop={6} style={styles.imgAction}>
              <Icon name="close-circle-outline" size={16} color={wargaColors.dangerRed} />
              <Text style={[styles.imgActionText, { color: wargaColors.dangerRed }]}>Hapus</Text>
            </Pressable>
          )
        )}
      </View>
      {local && <Text style={styles.pendingNote}>Gambar baru akan diunggah saat disimpan.</Text>}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4, marginBottom: 8 },
  cardDivider: { height: 1, backgroundColor: colors.border, marginTop: 16, marginBottom: 8 },
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
