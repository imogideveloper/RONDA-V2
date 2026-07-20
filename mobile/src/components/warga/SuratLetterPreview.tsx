// Render "surat jadi" berkop — dipakai di preview warga (sebelum ajukan) & draft Ketua.
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../config/theme';
import { RtUnit } from '../../types/models';
import { buildSuratDraft } from '../../lib/suratDraft';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export function tanggalIndo(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

const BLANK = '________________';

export interface SuratLetterData {
  rt: RtUnit;
  suratType: string;
  wargaName: string;
  purpose: string;
  ketuaName: string;
  nik?: string | null;
  birthPlace?: string | null;
  birthDate?: string | null;
  occupation?: string | null;
  gender?: string | null;
  religion?: string | null;
  maritalStatus?: string | null;
  address?: string | null; // alamat rumah warga (dari KK); jika kosong pakai alamat RT
}

const orBlank = (s?: string | null) => (s && s.trim() !== '' ? s.trim() : BLANK);

function fields(d: SuratLetterData) {
  const nik = orBlank(d.nik);
  const ttl =
    (d.birthPlace && d.birthPlace.trim() !== '') || (d.birthDate && d.birthDate.trim() !== '')
      ? `${d.birthPlace?.trim() || '-'}, ${d.birthDate?.trim() || '-'}`
      : BLANK;
  return {
    nik,
    ttl,
    gender: orBlank(d.gender),
    religion: orBlank(d.religion),
    status: orBlank(d.maritalStatus),
    pekerjaan: orBlank(d.occupation),
    alamat: (d.address && d.address.trim() !== '' ? d.address : d.rt.address) ?? '-',
  };
}

function draftCtx(d: SuratLetterData) {
  return {
    suratType: d.suratType,
    wargaName: d.wargaName,
    purpose: d.purpose,
    rtNumber: d.rt.rtNumber,
    rwNumber: d.rt.rwNumber,
    rtName: d.rt.name,
    address: d.rt.address ?? '-',
    ketuaName: d.ketuaName,
    kelurahan: d.rt.kelurahan,
    kecamatan: d.rt.kecamatan,
    kota: d.rt.kota,
  };
}

/** Versi teks polos (untuk disalin). */
export function suratLetterPlainText(d: SuratLetterData): string {
  const draft = buildSuratDraft(draftCtx(d));
  const f = fields(d);
  const kota = d.rt.kota && d.rt.kota.trim() !== '' ? `${d.rt.kota.trim()}, ` : '';
  const dataLines = [
    `Nama            : ${d.wargaName}`,
    `NIK             : ${f.nik}`,
    `Tempat/Tgl Lahir: ${f.ttl}`,
    `Jenis Kelamin   : ${f.gender}`,
    `Agama           : ${f.religion}`,
    `Status          : ${f.status}`,
    `Pekerjaan       : ${f.pekerjaan}`,
    `Alamat          : ${f.alamat}`,
  ].join('\n');
  return (
    `RUKUN TETANGGA ${d.rt.rtNumber} — RUKUN WARGA ${d.rt.rwNumber ?? '-'}\n${f.alamat}\n` +
    `----------------------------------------\n\n` +
    `${draft.heading}\nNomor: ${draft.nomor}\n\n` +
    `${draft.pembuka}\n\n${dataLines}\n\n` +
    draft.isi.join('\n\n') +
    `\n\n${draft.penutup}\n\n` +
    `${kota}${tanggalIndo(new Date())}\nKetua RT ${d.rt.rtNumber} RW ${d.rt.rwNumber ?? '-'}\n\n\n( ${d.ketuaName || '……………………'} )`
  );
}

export function SuratLetterPreview({
  data,
  showSignature = true,
}: {
  data: SuratLetterData;
  showSignature?: boolean;
}) {
  const { rt } = data;
  const draft = buildSuratDraft(draftCtx(data));
  const f = fields(data);
  const today = tanggalIndo(new Date());
  const kotaLoc = [rt.kelurahan, rt.kecamatan, rt.kota].filter((x) => x && x.trim() !== '').join(', ');
  const tanggalKota = rt.kota && rt.kota.trim() !== '' ? `${rt.kota.trim()}, ${today}` : today;

  return (
    <View style={styles.paper}>
      {rt.kopSuratUrl ? (
        <Image source={{ uri: rt.kopSuratUrl }} style={styles.kop} resizeMode="contain" />
      ) : (
        <View style={styles.kopText}>
          <Text style={styles.kopTitle}>
            RUKUN TETANGGA {rt.rtNumber} — RUKUN WARGA {rt.rwNumber ?? '-'}
          </Text>
          <Text style={styles.kopSub}>{kotaLoc !== '' ? kotaLoc : rt.address ?? ''}</Text>
        </View>
      )}
      <View style={styles.hr} />

      <Text style={styles.heading}>{draft.heading}</Text>
      <Text style={styles.nomor}>Nomor: {draft.nomor}</Text>

      <Text style={styles.para}>{draft.pembuka}</Text>

      <View style={styles.dataBox}>
        <DataRow label="Nama" value={data.wargaName} />
        <DataRow label="NIK" value={f.nik} />
        <DataRow label="Tempat/Tgl Lahir" value={f.ttl} />
        <DataRow label="Jenis Kelamin" value={f.gender} />
        <DataRow label="Agama" value={f.religion} />
        <DataRow label="Status" value={f.status} />
        <DataRow label="Pekerjaan" value={f.pekerjaan} />
        <DataRow label="Alamat" value={f.alamat} />
      </View>

      {draft.isi.map((p, i) => (
        <ParaWithBold key={i} text={p} bold={draft.keperluan} />
      ))}

      <Text style={styles.para}>{draft.penutup}</Text>

      <View style={styles.ttdBlock}>
        <Text style={styles.ttdLine}>{tanggalKota}</Text>
        <Text style={styles.ttdLine}>Ketua RT {rt.rtNumber} RW {rt.rwNumber ?? '-'}</Text>
        {showSignature && rt.signatureUrl ? (
          <Image source={{ uri: rt.signatureUrl }} style={styles.signature} resizeMode="contain" />
        ) : (
          <View style={{ height: 56 }} />
        )}
        <Text style={styles.ttdName}>( {data.ketuaName || '……………………'} )</Text>
      </View>
    </View>
  );
}

// Paragraf isi; frasa keperluan ditebalkan bila muncul di dalamnya.
function ParaWithBold({ text, bold }: { text: string; bold: string }) {
  const idx = bold && bold.trim() !== '' ? text.indexOf(bold) : -1;
  if (idx === -1) {
    return <Text style={styles.para}>{text}</Text>;
  }
  return (
    <Text style={styles.para}>
      {text.slice(0, idx)}
      <Text style={styles.paraBold}>{bold}</Text>
      {text.slice(idx + bold.length)}
    </Text>
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
  paraBold: { fontWeight: '700', color: '#111' },
  dataBox: { marginBottom: 12, paddingLeft: 8 },
  dataRow: { flexDirection: 'row', marginBottom: 3 },
  dataLabel: { width: 118, fontSize: 13, color: '#222' },
  dataColon: { width: 12, fontSize: 13, color: '#222' },
  dataValue: { flex: 1, fontSize: 13, color: '#222', fontWeight: '500' },
  ttdBlock: { alignSelf: 'flex-end', alignItems: 'center', width: 210, marginTop: 18 },
  ttdLine: { fontSize: 13, color: '#222', textAlign: 'center' },
  signature: { width: 160, height: 66, marginVertical: 2 },
  ttdName: { fontSize: 13, color: '#111', fontWeight: '700', textDecorationLine: 'underline', marginTop: 2, textAlign: 'center' },
});
