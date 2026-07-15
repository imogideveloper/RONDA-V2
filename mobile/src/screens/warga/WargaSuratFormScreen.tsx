// Port dari lib/pages/warga/warga_surat_form_page.dart
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaSuratFormStepper } from '../../components/warga/SuratWidgets';
import { wargaCardStyle, wargaText } from '../../components/warga/wargaUi';
import { wargaInitialsFromName } from '../../components/warga/DashboardWidgets';
import { SuratLetterPreview, SuratLetterData } from '../../components/warga/SuratLetterPreview';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { familyService } from '../../services/familyService';
import { FamilyMember } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaSuratForm'>;

export default function WargaSuratFormScreen({ route, navigation }: Props) {
  const { profile, rt, suratItem, onSubmitted } = route.params;
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [forSelf, setForSelf] = useState(true);
  const [familyIndex, setFamilyIndex] = useState(0);
  const [keperluanIndex, setKeperluanIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // "Diri Sendiri" auto-terisi dari data diri di profil (jika sudah diisi).
  const [nik, setNik] = useState(profile.nik ?? '');
  const [birthPlace, setBirthPlace] = useState(profile.birthPlace ?? '');
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '');
  const [occupation, setOccupation] = useState(profile.occupation ?? '');
  const [gender, setGender] = useState(profile.gender ?? '');
  const [religion, setReligion] = useState(profile.religion ?? '');
  const [maritalStatus, setMaritalStatus] = useState(profile.maritalStatus ?? '');
  const [family, setFamily] = useState<FamilyMember[]>([]);

  useEffect(() => {
    familyService.listMine().then(setFamily).catch(() => setFamily([]));
  }, []);

  const chooseSelf = () => {
    setForSelf(true);
    setNik(profile.nik ?? '');
    setBirthPlace(profile.birthPlace ?? '');
    setBirthDate(profile.birthDate ?? '');
    setOccupation(profile.occupation ?? '');
    setGender(profile.gender ?? '');
    setReligion(profile.religion ?? '');
    setMaritalStatus(profile.maritalStatus ?? '');
  };

  const chooseFamily = (i: number) => {
    const m = family[i];
    if (!m) {
      toast.error('Belum ada anggota keluarga. Hubungi Ketua RT untuk mendaftarkan.');
      return;
    }
    setForSelf(false);
    setFamilyIndex(i);
    setNik(m.nik ?? '');
    setBirthPlace(m.birthPlace ?? '');
    setBirthDate(m.birthDate ?? '');
    setOccupation(m.occupation ?? '');
    setGender(m.gender ?? '');
    setReligion(m.religion ?? '');
    setMaritalStatus(m.maritalStatus ?? '');
  };

  const address = rt.address?.trim() || `${rt.name}, RT ${rt.rtNumber}`;
  const selectedKeperluan = keperluanIndex == null ? '' : suratItem.keperluanOptions[keperluanIndex];

  const letterData: SuratLetterData = {
    rt,
    suratType: suratItem.suratTypeKey,
    wargaName: forSelf ? profile.fullName : (family[familyIndex]?.name ?? profile.fullName),
    purpose: selectedKeperluan,
    ketuaName: '',
    nik,
    birthPlace,
    birthDate,
    occupation,
    gender,
    religion,
    maritalStatus,
  };

  // Keperluan = teks apa adanya (tanpa penanda "[Diri sendiri (…)]"),
  // karena data pemohon di surat sudah menunjukkan untuk siapa surat dibuat.
  const buildPurpose = () => selectedKeperluan;

  const submit = async () => {
    if (selectedKeperluan === '') {
      toast.error('Pilih keperluan surat');
      return;
    }
    setSubmitting(true);
    try {
      await rtService.submitSuratRequest(rt.id, suratItem.suratTypeKey, buildPurpose(), {
        nik,
        birthPlace,
        birthDate,
        occupation,
        gender,
        religion,
        maritalStatus,
      });
      onSubmitted?.(suratItem.title);
      navigation.goBack();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  const onPrimary = () => {
    if (step === 0) {
      if (keperluanIndex == null) {
        toast.error('Pilih keperluan surat');
        return;
      }
      setStep(1);
    } else {
      submit();
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title={suratItem.title} />
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <WargaSuratFormStepper step={step} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 0 ? (
          <>
            <InfoBanner title={suratItem.title} sla={suratItem.sla} icon={suratItem.icon} iconColor={suratItem.iconColor} />
            <SectionTitle icon="person-outline" title="Data Pemohon" badge="OTOMATIS" />
            <View style={[wargaCardStyle(16), { padding: 14, marginTop: 10 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.pemohonAvatar}><Text style={styles.pemohonInitials}>{wargaInitialsFromName(profile.fullName)}</Text></View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.bold15}>{profile.fullName}</Text>
                  <Text style={[wargaText.greeting, { fontSize: 12 }]}>Kepala Keluarga</Text>
                </View>
              </View>
              <View style={styles.fieldRow}><Field label="NAMA" value={profile.fullName} /><Field label="NIK" value={profile.nik || '—'} /></View>
              <View style={styles.fieldRow}><Field label="PEKERJAAN" value={profile.occupation || '—'} /><Field label="TTL" value={profile.birthPlace || profile.birthDate ? `${profile.birthPlace || '—'}, ${profile.birthDate || '—'}` : '—'} /></View>
              <View style={{ marginTop: 10 }}><Field label="ALAMAT" value={address} /></View>
            </View>

            <SectionTitle icon="people-outline" title="Surat Untuk" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <SuratUntukCard selected={forSelf} onPress={chooseSelf} icon="person-outline" title="Diri Sendiri" sub="Kepala Keluarga" />
              <SuratUntukCard selected={!forSelf} onPress={() => chooseFamily(familyIndex)} icon="people-circle-outline" title="Anggota Keluarga" sub="Anak, Istri, dll" />
            </View>

            {!forSelf && (
              <>
                <SectionTitle icon="create-outline" title="Data Orang dalam Surat" iconColor="#EA580C" />
                {family.map((m, i) => (
                  <Pressable key={m.id} onPress={() => chooseFamily(i)} style={[styles.familyCard, { borderColor: familyIndex === i ? '#3B82F6' : colors.border, backgroundColor: familyIndex === i ? wargaColors.accentBlue : colors.surface }]}>
                    <View style={styles.familyAvatar}><Text style={{ fontSize: 11, fontWeight: '600' }}>{wargaInitialsFromName(m.name)}</Text></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.bold14}>{m.name}</Text>
                      <Text style={[wargaText.greeting, { fontSize: 12 }]}>{[m.relation, m.occupation].filter(Boolean).join(' · ') || '—'}</Text>
                    </View>
                    {familyIndex === i && <Icon name="checkmark-circle" size={22} color="#3B82F6" />}
                  </Pressable>
                ))}
                {family[familyIndex] && (
                  <View style={[wargaCardStyle(14), { padding: 14, marginTop: 4 }]}>
                    <View style={styles.fieldRow}><Field label="NIK" value={family[familyIndex].nik || '—'} /><Field label="TTL" value={family[familyIndex].birthPlace || family[familyIndex].birthDate ? `${family[familyIndex].birthPlace || '—'}, ${family[familyIndex].birthDate || '—'}` : '—'} /></View>
                    <View style={styles.fieldRow}><Field label="JENIS KELAMIN" value={family[familyIndex].gender || '—'} /><Field label="AGAMA" value={family[familyIndex].religion || '—'} /></View>
                  </View>
                )}
              </>
            )}

            <SectionTitle icon="document-text-outline" title="Keperluan" iconColor={wargaColors.primaryGreen} />
            {suratItem.keperluanOptions.map((opt, i) => (
              <Pressable key={opt} onPress={() => setKeperluanIndex(i)} style={[wargaCardStyle(14), styles.keperluan]}>
                <Icon name={keperluanIndex === i ? 'radio-button-on' : 'radio-button-off'} size={22} color={keperluanIndex === i ? '#3B82F6' : colors.textSecondary} />
                <Text style={styles.keperluanText}>{opt}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <View style={styles.summaryBox}>
              <SummaryLine label="Nama" value={forSelf ? profile.fullName : (family[familyIndex]?.name ?? '—')} />
              <SummaryLine label="NIK" value={nik.trim() || '—'} />
              <SummaryLine label="Keperluan" value={selectedKeperluan} />
              <SummaryLine label="Untuk" value={forSelf ? 'Diri Sendiri' : 'Anggota Keluarga'} />
            </View>
            <View style={styles.warnBox}>
              <Icon name="alert-circle-outline" size={16} color="#B45309" />
              <Text style={styles.warnText}>Periksa isi surat dengan teliti sebelum mengajukan.</Text>
            </View>
            <SuratLetterPreview data={letterData} showSignature={false} />
            <Text style={[wargaText.greeting, { fontSize: 12, lineHeight: 17, marginTop: 12 }]}>
              Setelah dikirim, permohonan akan ditinjau Ketua RT. Anda bisa cek status di tab Permohonan Saya.
              Kop & tanda tangan mengikuti Pengaturan RT.
            </Text>
          </>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrap}>
        {step === 1 ? (
          <View style={styles.bottomRow}>
            <Pressable onPress={submitting ? undefined : () => setStep(0)} style={styles.editBtn}>
              <Icon name="create-outline" size={18} color={colors.textPrimary} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
            <Pressable onPress={submitting ? undefined : submit} style={[styles.bottomBar, styles.ajukanBtn, submitting && { opacity: 0.6 }]}>
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bottomBarText}>Ajukan Surat</Text>}
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={onPrimary} style={styles.bottomBar}>
            <Text style={styles.bottomBarText}>Lanjut Preview</Text>
          </Pressable>
        )}
      </SafeAreaView>
    </SafeAreaView>
  );
}

function InfoBanner({ title, sla, icon, iconColor }: { title: string; sla: string; icon: IconName; iconColor: string }) {
  return (
    <View style={styles.infoBanner}>
      <Icon name={icon} size={28} color={iconColor} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.bold14}>{title}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]}>Estimasi {sla}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ icon, title, badge, iconColor }: { icon: IconName; title: string; badge?: string; iconColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 }}>
      <Icon name={icon} size={20} color={iconColor ?? '#3B82F6'} />
      <Text style={[wargaText.sectionTitle, { fontSize: 15 }]}>{title}</Text>
      {badge && (
        <View style={styles.autoBadge}>
          <Text style={styles.autoBadgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

function SuratUntukCard({ selected, onPress, icon, title, sub }: { selected: boolean; onPress: () => void; icon: IconName; title: string; sub: string }) {
  const c = selected ? '#2563EB' : colors.textSecondary;
  return (
    <Pressable onPress={onPress} style={[styles.untukCard, { borderColor: selected ? '#3B82F6' : colors.border, borderWidth: selected ? 2 : 1, backgroundColor: selected ? wargaColors.accentBlue : colors.surface }]}>
      <Icon name={icon} size={24} color={c} />
      <Text style={[styles.untukTitle, { color: selected ? '#2563EB' : colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.untukSub, { color: selected ? '#2563EB' : colors.textSecondary }]}>{sub}</Text>
    </Pressable>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Icon name="checkmark-circle" size={16} color={wargaColors.primaryGreen} />
      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{label}:</Text>
      <Text style={{ flex: 1, fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, backgroundColor: wargaColors.accentBlue, borderWidth: 1, borderColor: '#93C5FD' },
  bold14: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  bold15: { fontWeight: '600', fontSize: 15, color: colors.textPrimary },
  autoBadge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: wargaColors.accentBlue, borderRadius: 8 },
  autoBadgeText: { fontSize: 9, fontWeight: '700', color: '#2563EB' },
  pemohonAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  pemohonInitials: { fontWeight: '700', color: '#2563EB' },
  fieldRow: { flexDirection: 'row', marginTop: 12, gap: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },
  fieldValue: { fontWeight: '600', fontSize: 13, color: colors.textPrimary, marginTop: 2 },
  inputLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 10, marginBottom: 5 },
  suratInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, backgroundColor: colors.surface },
  untukCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14 },
  untukTitle: { fontWeight: '600', fontSize: 13, marginTop: 8, textAlign: 'center' },
  untukSub: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  familyCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  familyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: wargaColors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  keperluan: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, marginTop: 8 },
  keperluanText: { flex: 1, marginLeft: 12, fontWeight: '500', fontSize: 14, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  summaryBox: { backgroundColor: wargaColors.lightGreen, borderRadius: 14, padding: 14, marginBottom: 12 },
  warnBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginBottom: 14 },
  warnText: { flex: 1, fontSize: 12, color: '#92400E' },
  bottomBarWrap: { backgroundColor: wargaColors.bgColor },
  bottomBar: { marginHorizontal: 20, marginVertical: 8, height: 48, borderRadius: 14, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  bottomBarText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginVertical: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, paddingHorizontal: 20, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  editText: { color: colors.textPrimary, fontWeight: '600', fontSize: 15 },
  ajukanBtn: { flex: 1, marginHorizontal: 0, marginVertical: 0, backgroundColor: wargaColors.primaryGreen },
});
