// Pengajuan "Surat Lainnya" (di luar 5 katalog): pilih jenis (dropdown) atau
// ketik sendiri, lalu lanjut ke form + preview yang sama seperti surat katalog.
import React, { useState } from 'react';
import {
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
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { PrimaryButton } from '../../components/Card';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { SuratItem } from '../../lib/suratCatalog';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaSuratCustom'>;

// Jenis surat di luar katalog + pilihan keperluan masing-masing.
const SURAT_LAINNYA: { jenis: string; keperluanOptions: string[] }[] = [
  { jenis: 'Surat Keterangan Kehilangan', keperluanOptions: ['Penggantian KTP', 'Penggantian STNK/BPKB', 'Dokumen penting hilang', 'Keperluan lainnya'] },
  { jenis: 'Surat Keterangan Kelahiran', keperluanOptions: ['Pengurusan akta kelahiran', 'Administrasi kependudukan', 'Keperluan lainnya'] },
  { jenis: 'Surat Keterangan Kematian', keperluanOptions: ['Pengurusan akta kematian', 'Administrasi keluarga/warisan', 'Klaim asuransi/BPJS', 'Keperluan lainnya'] },
  { jenis: 'Surat Keterangan Pindah Domisili', keperluanOptions: ['Pindah karena pekerjaan', 'Pindah ikut keluarga', 'Administrasi kependudukan', 'Keperluan lainnya'] },
  { jenis: 'Surat Keterangan Belum Menikah', keperluanOptions: ['Persyaratan pernikahan', 'Administrasi / melamar kerja', 'Keperluan lainnya'] },
  { jenis: 'Surat Keterangan Ahli Waris', keperluanOptions: ['Pengurusan warisan', 'Administrasi bank/aset', 'Keperluan lainnya'] },
  { jenis: 'Surat Keterangan Penghasilan', keperluanOptions: ['Pengajuan kredit/pinjaman', 'Beasiswa / sekolah', 'Bantuan sosial', 'Keperluan lainnya'] },
  { jenis: 'Surat Izin Keramaian / Acara', keperluanOptions: ['Hajatan / pernikahan', 'Acara keagamaan', 'Kegiatan warga', 'Keperluan lainnya'] },
  { jenis: 'Surat Pengantar KTP / KK', keperluanOptions: ['Pembuatan KTP baru', 'Perubahan data KK', 'Keperluan lainnya'] },
];

const GENERIC_KEPERLUAN = ['Keperluan administrasi', 'Pengurusan dokumen', 'Keperluan lainnya'];
const CUSTOM_OPTION = 'Lainnya (ketik sendiri)';
const OPTIONS = SURAT_LAINNYA.map((s) => s.jenis);

export default function WargaSuratCustomScreen({ route, navigation }: Props) {
  const { profile, rt, onSubmitted } = route.params;
  const toast = useToast();
  const [jenis, setJenis] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [open, setOpen] = useState(false);

  const pickJenis = (opt: string) => {
    if (opt === CUSTOM_OPTION) {
      setCustomMode(true);
      setJenis('');
    } else {
      setCustomMode(false);
      setJenis(opt);
    }
    setOpen(false);
  };

  const lanjut = () => {
    const name = jenis.trim();
    if (name === '') return toast.error('Pilih atau tulis jenis surat dulu');
    const match = SURAT_LAINNYA.find((s) => s.jenis === name);
    const suratItem: SuratItem = {
      title: name,
      sla: '3 hari kerja',
      description: 'Permohonan surat sesuai kebutuhan warga.',
      icon: 'document-text-outline',
      iconColor: '#185FA5',
      iconBg: wargaColors.accentBlue,
      accentColor: '#3B82F6',
      suratTypeKey: name,
      isPopular: false,
      keperluanOptions: match ? match.keperluanOptions : GENERIC_KEPERLUAN,
    };
    navigation.replace('WargaSuratForm', { profile, rt, suratItem, onSubmitted });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Ajukan Surat Lainnya" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <WargaCard style={{ marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.iconWrap}>
              <Icon name="document-text-outline" size={22} color={wargaColors.primaryGreen} />
            </View>
            <Text style={[wargaText.greeting, { flex: 1, fontSize: 13 }]}>
              Pilih jenis surat yang belum ada di daftar utama, lalu lanjut isi data & preview.
            </Text>
          </WargaCard>

          <Text style={styles.label}>Jenis / Nama Surat</Text>
          <View style={[styles.selectWrap, open && { zIndex: 100 }]}>
            <Pressable style={[styles.dropdown, open && styles.dropdownOpen]} onPress={() => setOpen((o) => !o)}>
              <Icon name="document-text-outline" size={18} color={wargaColors.primaryGreen} />
              <Text
                style={[styles.dropdownText, jenis === '' && !customMode && { color: colors.textHint }]}
                numberOfLines={1}
              >
                {customMode ? CUSTOM_OPTION : jenis === '' ? 'Pilih jenis surat…' : jenis}
              </Text>
              <Icon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
            </Pressable>
            {open && (
              <View style={styles.menu}>
                <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                  {OPTIONS.map((opt) => {
                    const selected = !customMode && jenis === opt;
                    return (
                      <Pressable key={opt} style={[styles.optionRow, selected && styles.optionRowActive]} onPress={() => pickJenis(opt)}>
                        <Text style={[styles.optionText, selected && { color: wargaColors.primaryGreen, fontWeight: '600' }]}>{opt}</Text>
                        {selected && <Icon name="checkmark" size={16} color={wargaColors.primaryGreen} />}
                      </Pressable>
                    );
                  })}
                  <Pressable style={styles.optionRow} onPress={() => pickJenis(CUSTOM_OPTION)}>
                    <Icon name="create-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.optionText, { color: colors.textSecondary }]}>{CUSTOM_OPTION}</Text>
                  </Pressable>
                </ScrollView>
              </View>
            )}
          </View>
          {customMode && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={jenis}
              onChangeText={setJenis}
              placeholder="Tulis nama surat…"
              placeholderTextColor={colors.textHint}
              autoFocus
            />
          )}

          <View style={{ height: 24 }} />
          <PrimaryButton label="Lanjut Isi Data" onPress={lanjut} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: wargaColors.lightGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 14, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectWrap: { position: 'relative' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownOpen: { borderColor: wargaColors.primaryGreen },
  dropdownText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  menu: {
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    zIndex: 200,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  optionRowActive: { backgroundColor: wargaColors.lightGreen },
  optionText: { flex: 1, fontSize: 14, color: colors.textPrimary },
});
