// Preview draft surat berkop untuk Ketua RT (dibuka dari layar approve surat).
// Kop, alamat, dan tanda tangan diambil dari Setting RT (jika sudah diisi).
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { SuratLetterData, SuratLetterPreview } from '../../components/warga/SuratLetterPreview';
import { exportSuratPdf } from '../../lib/suratPdf';
import { suratIsApproved, suratPersonName } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SuratDraft'>;

export default function SuratDraftScreen({ route }: Props) {
  const { rt, request, ketuaName } = route.params;
  const toast = useToast();

  const data: SuratLetterData = {
    rt,
    suratType: request.suratType,
    wargaName: suratPersonName(request),
    purpose: request.purpose,
    ketuaName,
    nik: request.nik,
    birthPlace: request.birthPlace,
    birthDate: request.birthDate,
    occupation: request.occupation,
    gender: request.gender,
    religion: request.religion,
    maritalStatus: request.maritalStatus,
  };

  // Tanda tangan hanya muncul bila surat sudah DISETUJUI.
  const signed = suratIsApproved(request);

  const [downloading, setDownloading] = useState(false);
  const downloadPdf = async () => {
    setDownloading(true);
    try {
      await exportSuratPdf(data, { showSignature: signed });
    } catch (e: any) {
      toast.error(`Gagal membuat PDF: ${String(e?.message ?? e)}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Draft Surat" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SuratLetterPreview data={data} showSignature={signed} />

        <View style={styles.note}>
          <Icon name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            Draft otomatis. NIK, tempat/tanggal lahir, dan pekerjaan diambil dari data yang diisi
            warga saat mengajukan (bagian kosong berarti belum diisi). Kop & tanda tangan diambil
            dari Pengaturan RT.
          </Text>
        </View>

        <Pressable style={styles.copyBtn} onPress={downloadPdf} disabled={downloading}>
          {downloading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="download-outline" size={18} color="#fff" />
              <Text style={styles.copyText}>Unduh PDF</Text>
            </>
          )}
        </Pressable>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { padding: 16, paddingBottom: 24 },
  note: { flexDirection: 'row', gap: 8, marginTop: 14, paddingHorizontal: 4 },
  noteText: { flex: 1, fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: wargaColors.primaryGreen,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: 18,
  },
  copyText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
