// Preview draft surat berkop untuk Ketua RT (dibuka dari layar approve surat).
// Kop, alamat, dan tanda tangan diambil dari Setting RT (jika sudah diisi).
import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { buildSuratDraft } from '../../lib/suratDraft';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SuratDraft'>;

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function tanggalIndo(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SuratDraftScreen({ route }: Props) {
  const { rt, request, ketuaName } = route.params;
  const toast = useToast();

  const draft = buildSuratDraft({
    suratType: request.suratType,
    wargaName: request.userName ?? 'Warga',
    purpose: request.purpose,
    rtNumber: rt.rtNumber,
    rwNumber: rt.rwNumber,
    rtName: rt.name,
    address: rt.address ?? '-',
    ketuaName,
  });

  const wargaName = request.userName ?? 'Warga';
  const alamat = rt.address ?? '-';
  const today = tanggalIndo(new Date());
  const BLANK = '________________';
  const nik = request.nik ?? BLANK;
  const ttl =
    request.birthPlace || request.birthDate
      ? `${request.birthPlace ?? '-'}, ${request.birthDate ?? '-'}`
      : BLANK;
  const pekerjaan = request.occupation ?? BLANK;

  const copyText = async () => {
    const dataLines = [
      `Nama            : ${wargaName}`,
      `NIK             : ${nik}`,
      `Tempat/Tgl Lahir: ${ttl}`,
      `Pekerjaan       : ${pekerjaan}`,
      `Alamat          : ${alamat}`,
    ].join('\n');
    const text =
      `${rt.name}\nRT ${rt.rtNumber} RW ${rt.rwNumber ?? '-'}\n${alamat}\n` +
      `----------------------------------------\n\n` +
      `${draft.heading}\nNomor: ${draft.nomor}\n\n` +
      `${draft.pembuka}\n\n${dataLines}\n\n` +
      draft.isi.join('\n\n') +
      `\n\n${draft.penutup}\n\n` +
      `${today}\nKetua RT ${rt.rtNumber}\n\n\n( ${ketuaName} )`;
    await Clipboard.setStringAsync(text);
    toast.success('Teks draft disalin');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Draft Surat" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.paper}>
          {/* Kop surat */}
          {rt.kopSuratUrl ? (
            <Image source={{ uri: rt.kopSuratUrl }} style={styles.kop} resizeMode="contain" />
          ) : (
            <View style={styles.kopText}>
              <Text style={styles.kopTitle}>{rt.name}</Text>
              <Text style={styles.kopSub}>RT {rt.rtNumber} RW {rt.rwNumber ?? '-'}</Text>
              {rt.address != null && <Text style={styles.kopSub}>{rt.address}</Text>}
            </View>
          )}
          <View style={styles.hr} />

          {/* Judul & nomor */}
          <Text style={styles.heading}>{draft.heading}</Text>
          <Text style={styles.nomor}>Nomor: {draft.nomor}</Text>

          {/* Pembuka */}
          <Text style={styles.para}>{draft.pembuka}</Text>

          {/* Data pemohon */}
          <View style={styles.dataBox}>
            <DataRow label="Nama" value={wargaName} />
            <DataRow label="NIK" value={nik} />
            <DataRow label="Tempat/Tgl Lahir" value={ttl} />
            <DataRow label="Pekerjaan" value={pekerjaan} />
            <DataRow label="Alamat" value={alamat} />
          </View>

          {/* Isi */}
          {draft.isi.map((p, i) => (
            <Text key={i} style={styles.para}>{p}</Text>
          ))}

          {/* Penutup */}
          <Text style={styles.para}>{draft.penutup}</Text>

          {/* Tanda tangan */}
          <View style={styles.ttdBlock}>
            <Text style={styles.ttdLine}>{today}</Text>
            <Text style={styles.ttdLine}>Ketua RT {rt.rtNumber}</Text>
            {rt.signatureUrl ? (
              <Image source={{ uri: rt.signatureUrl }} style={styles.signature} resizeMode="contain" />
            ) : (
              <View style={{ height: 56 }} />
            )}
            <Text style={styles.ttdName}>( {ketuaName} )</Text>
          </View>
        </View>

        <View style={styles.note}>
          <Icon name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.noteText}>
            Draft otomatis. NIK, tempat/tanggal lahir, dan pekerjaan diambil dari data yang diisi
            warga saat mengajukan (bagian kosong berarti belum diisi). Kop & tanda tangan diambil
            dari Pengaturan RT.
          </Text>
        </View>

        <Pressable style={styles.copyBtn} onPress={copyText}>
          <Icon name="copy-outline" size={18} color="#fff" />
          <Text style={styles.copyText}>Salin Teks Draft</Text>
        </Pressable>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLabel}>{label}</Text>
      <Text style={styles.dataColon}>:</Text>
      <Text style={styles.dataValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { padding: 16, paddingBottom: 24 },
  paper: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
  },
  kop: { width: '100%', height: 84 },
  kopText: { alignItems: 'center' },
  kopTitle: { fontSize: 17, fontWeight: '700', color: '#111', textAlign: 'center' },
  kopSub: { fontSize: 12, color: '#333', textAlign: 'center' },
  hr: { height: 2, backgroundColor: '#111', marginTop: 10, marginBottom: 16 },
  heading: { fontSize: 15, fontWeight: '700', color: '#111', textAlign: 'center', textDecorationLine: 'underline' },
  nomor: { fontSize: 12, color: '#333', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  para: { fontSize: 13, color: '#222', lineHeight: 20, marginBottom: 12, textAlign: 'justify' },
  dataBox: { marginBottom: 12, paddingLeft: 8 },
  dataRow: { flexDirection: 'row', marginBottom: 3 },
  dataLabel: { width: 118, fontSize: 13, color: '#222' },
  dataColon: { width: 12, fontSize: 13, color: '#222' },
  dataValue: { flex: 1, fontSize: 13, color: '#222', fontWeight: '500' },
  ttdBlock: { alignItems: 'flex-end', marginTop: 12 },
  ttdLine: { fontSize: 13, color: '#222' },
  signature: { width: 150, height: 64, marginVertical: 4 },
  ttdName: { fontSize: 13, color: '#111', fontWeight: '700', textDecorationLine: 'underline', marginTop: 4 },
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
