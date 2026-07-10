// Pengajuan "Surat Lainnya" (custom) untuk warga — jenis & keperluan diketik bebas.
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
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
import { rtService } from '../../services/rtService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaSuratCustom'>;

export default function WargaSuratCustomScreen({ route, navigation }: Props) {
  const { rt, onSubmitted } = route.params;
  const toast = useToast();
  const [jenis, setJenis] = useState('');
  const [keperluan, setKeperluan] = useState('');
  const [nik, setNik] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [occupation, setOccupation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (jenis.trim() === '') return toast.error('Jenis surat wajib diisi');
    if (keperluan.trim() === '') return toast.error('Keperluan wajib diisi');
    setSubmitting(true);
    try {
      await rtService.submitSuratRequest(rt.id, jenis.trim(), keperluan.trim(), {
        nik,
        birthPlace,
        birthDate,
        occupation,
      });
      toast.success('Permohonan surat terkirim');
      onSubmitted?.();
      navigation.goBack();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
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
              Ajukan surat yang belum ada di daftar. Ketua RT akan meninjau permohonan Anda.
            </Text>
          </WargaCard>

          <Text style={styles.label}>Jenis / Nama Surat</Text>
          <TextInput
            style={styles.input}
            value={jenis}
            onChangeText={setJenis}
            placeholder="Contoh: Surat Keterangan Kehilangan"
            placeholderTextColor={colors.textHint}
          />

          <Text style={styles.label}>Keperluan</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={keperluan}
            onChangeText={setKeperluan}
            multiline
            placeholder="Jelaskan keperluan / alasan pengajuan surat…"
            placeholderTextColor={colors.textHint}
          />

          <Text style={styles.sectionLabel}>Data Diri untuk Surat</Text>
          <Text style={styles.hint}>Dipakai untuk mengisi surat. Boleh dikosongkan bila tidak diperlukan.</Text>

          <Text style={styles.label}>NIK</Text>
          <TextInput
            style={styles.input}
            value={nik}
            onChangeText={setNik}
            placeholder="16 digit NIK"
            placeholderTextColor={colors.textHint}
            keyboardType="number-pad"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Tempat Lahir</Text>
              <TextInput
                style={styles.input}
                value={birthPlace}
                onChangeText={setBirthPlace}
                placeholder="Contoh: Bogor"
                placeholderTextColor={colors.textHint}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Tanggal Lahir</Text>
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="12 Mei 1990"
                placeholderTextColor={colors.textHint}
              />
            </View>
          </View>

          <Text style={styles.label}>Pekerjaan</Text>
          <TextInput
            style={styles.input}
            value={occupation}
            onChangeText={setOccupation}
            placeholder="Contoh: Wiraswasta"
            placeholderTextColor={colors.textHint}
          />

          <View style={{ height: 24 }} />
          <PrimaryButton label="Kirim Permohonan" onPress={submit} loading={submitting} />
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
  sectionLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 22 },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
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
  multiline: { minHeight: 110, textAlignVertical: 'top' },
});
