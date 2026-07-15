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
import * as DocumentPicker from 'expo-document-picker';
import { extractPdfText } from '../../lib/pdfText';
import { colors, formatRupiah, radius, wargaColors } from '../../config/theme';
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

// "50000" -> "50.000" (titik ribuan) untuk tampilan input nominal.
function groupThousands(digits: string): string {
  const n = (digits || '').replace(/\D/g, '');
  return n === '' ? '' : n.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const IURAN_CUSTOM = 'Lainnya (ketik sendiri)';
const IURAN_PRESETS = ['Keamanan', 'Kebersihan', 'Kas RT', 'Sampah', 'Air Bersih', 'Penerangan Jalan', 'Sosial'];
const IURAN_OPTIONS = [...IURAN_PRESETS, IURAN_CUSTOM];

export default function RtSettingsScreen({ route }: Props) {
  const { profile, rt: initialRt, onSaved } = route.params;
  const toast = useToast();
  const navigation = useNavigation();
  const isKetua = profileIsKetua(profile);

  const [rt, setRt] = useState<RtUnit>(initialRt);
  const [address, setAddress] = useState(initialRt.address ?? '');
  const [parsingPdf, setParsingPdf] = useState(false);
  const [kelurahan, setKelurahan] = useState(initialRt.kelurahan ?? '');
  const [kecamatan, setKecamatan] = useState(initialRt.kecamatan ?? '');
  const [kota, setKota] = useState(initialRt.kota ?? '');
  // Komponen iuran (mis. Keamanan, Kebersihan) — pilih dari dropdown / ketik sendiri.
  type CompDraft = { name: string; amount: string; custom?: boolean };
  const [components, setComponents] = useState<CompDraft[]>(
    initialRt.iuranComponents.length > 0
      ? initialRt.iuranComponents.map((c) => ({
          name: c.name,
          amount: String(c.amount),
          custom: !IURAN_PRESETS.includes(c.name),
        }))
      : [
          { name: 'Keamanan', amount: '50000' },
          { name: 'Kebersihan', amount: '50000' },
        ],
  );
  const [openComp, setOpenComp] = useState<number | null>(null);
  const totalIuran = components.reduce((s, c) => s + (parseInt(c.amount, 10) || 0), 0);
  const setComp = (i: number, patch: Partial<CompDraft>) =>
    setComponents((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const addComp = () => setComponents((prev) => [...prev, { name: '', amount: '' }]);
  const removeComp = (i: number) => setComponents((prev) => prev.filter((_, idx) => idx !== i));
  const pickComp = (i: number, opt: string) => {
    if (opt === IURAN_CUSTOM) setComp(i, { name: '', custom: true });
    else setComp(i, { name: opt, custom: false });
    setOpenComp(null);
  };
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

  const pickAddressPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
      if (result.canceled || result.assets.length === 0) return;
      setParsingPdf(true);
      const text = await extractPdfText(result.assets[0].uri);
      if (text.trim() === '') {
        toast.error('PDF tidak berisi teks yang bisa dibaca (mungkin hasil scan).');
        return;
      }
      setAddress(text.trim());
      toast.success('Alamat terbaca dari PDF. Cek & rapikan bila perlu, lalu Simpan.');
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setParsingPdf(false);
    }
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
      const validComps = components
        .map((c) => ({ name: c.name.trim(), amount: parseInt(c.amount, 10) || 0 }))
        .filter((c) => c.name !== '' && c.amount > 0);
      const iuranTotal = validComps.reduce((s, c) => s + c.amount, 0);
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
        iuran_components: validComps,
        iuran_amount: iuranTotal > 0 ? iuranTotal : 50000,
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
            <Pressable onPress={parsingPdf ? undefined : pickAddressPdf} style={styles.pdfBtn}>
              <Icon
                name={parsingPdf ? 'hourglass-outline' : 'cloud-upload-outline'}
                size={18}
                color={wargaColors.primaryGreen}
              />
              <Text style={styles.pdfBtnText}>
                {parsingPdf ? 'Membaca PDF…' : 'Isi alamat dari PDF'}
              </Text>
            </Pressable>
            <Text style={styles.hint}>
              Upload PDF (teks asli, bukan hasil scan) berisi alamat — teksnya otomatis mengisi kolom
              di atas. Periksa/rapikan lalu Simpan.
            </Text>
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

          {/* Iuran bulanan — multi komponen */}
          <WargaCard style={[{ marginBottom: 16 }, openComp !== null && { zIndex: 100, position: 'relative' }]}>
            <Text style={wargaText.sectionTitle}>Iuran Bulanan</Text>
            <Text style={styles.hint}>
              Rincian iuran per warga tiap bulan. Bisa tambah komponen (mis. Keamanan, Kebersihan,
              Kas RT). Total otomatis dijumlahkan.
            </Text>

            {components.map((c, i) => (
              <View key={i} style={[styles.compRow, openComp === i && { zIndex: 50 }]}>
                <View style={{ flex: 1, position: 'relative' }}>
                  <Pressable
                    style={[styles.compDropdown, openComp === i && styles.compDropdownOpen]}
                    onPress={() => setOpenComp(openComp === i ? null : i)}
                  >
                    <Text
                      style={[styles.compDropdownText, c.name === '' && !c.custom && { color: colors.textHint }]}
                      numberOfLines={1}
                    >
                      {c.custom ? IURAN_CUSTOM : c.name === '' ? 'Pilih komponen…' : c.name}
                    </Text>
                    <Icon name={openComp === i ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
                  </Pressable>
                  {openComp === i && (
                    <View style={styles.compMenu}>
                      {IURAN_OPTIONS.map((opt) => (
                        <Pressable key={opt} style={styles.compOption} onPress={() => pickComp(i, opt)}>
                          <Text style={styles.compOptionText}>{opt}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                  {c.custom && (
                    <TextInput
                      style={[styles.input, { marginTop: 8 }]}
                      value={c.name}
                      onChangeText={(t) => setComp(i, { name: t })}
                      placeholder="Ketik nama komponen"
                      placeholderTextColor={colors.textHint}
                    />
                  )}
                </View>
                <View style={styles.amountBox}>
                  <Text style={styles.amountPrefix}>Rp</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={groupThousands(c.amount)}
                    onChangeText={(t) => setComp(i, { amount: t.replace(/\D/g, '').slice(0, 7) })}
                    placeholder="0"
                    placeholderTextColor={colors.textHint}
                    keyboardType="number-pad"
                  />
                </View>
                <Pressable onPress={() => removeComp(i)} hitSlop={8} style={styles.compRemove}>
                  <Icon name="remove-circle-outline" size={22} color={wargaColors.dangerRed} />
                </Pressable>
              </View>
            ))}

            <Pressable onPress={addComp} style={styles.addComp}>
              <Icon name="add-circle-outline" size={18} color={wargaColors.primaryGreen} />
              <Text style={styles.addCompText}>Tambah komponen iuran</Text>
            </Pressable>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total per bulan</Text>
              <Text style={styles.totalValue}>{formatRupiah(totalIuran)}</Text>
            </View>
            <Text style={styles.hint}>
              Perubahan berlaku untuk tagihan yang belum dibayar & bulan berikutnya (yang sudah lunas
              tidak berubah).
            </Text>
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
  compRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 10 },
  compRemove: { padding: 2, marginTop: 11 },
  compDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  compDropdownOpen: { borderColor: wargaColors.primaryGreen },
  compDropdownText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  compMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 4,
    zIndex: 200,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  compOption: { paddingHorizontal: 14, paddingVertical: 11 },
  compOptionText: { fontSize: 14, color: colors.textPrimary },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 118,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  amountPrefix: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  amountInput: { flex: 1, fontSize: 15, color: colors.textPrimary, padding: 0 },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: wargaColors.primaryGreen,
    borderStyle: 'dashed',
  },
  pdfBtnText: { fontSize: 13, fontWeight: '600', color: wargaColors.primaryGreen },
  addComp: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12, paddingVertical: 4 },
  addCompText: { fontSize: 13, fontWeight: '600', color: wargaColors.primaryGreen },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  totalValue: { fontSize: 16, fontWeight: '800', color: wargaColors.primaryGreen },
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
