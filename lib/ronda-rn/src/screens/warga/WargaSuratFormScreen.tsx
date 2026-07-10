// Port dari lib/pages/warga/warga_surat_form_page.dart
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaSuratFormStepper } from '../../components/warga/SuratWidgets';
import { wargaCardStyle, wargaText } from '../../components/warga/wargaUi';
import { wargaInitialsFromName } from '../../components/warga/DashboardWidgets';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaSuratForm'>;

interface FamilyMember {
  name: string; relation: string; occupation: string; nik: string;
  birthPlace: string; birthDate: string; gender: string; religion: string;
}

const FAMILY_DEMO: FamilyMember[] = [
  { name: 'Siti Nurhaliza', relation: 'Istri', occupation: 'Ibu Rumah Tangga', nik: '3276054203870002', birthPlace: 'Bogor', birthDate: '4 Maret 1987', gender: 'Perempuan', religion: 'Islam' },
  { name: 'Muhammad Rizki Hidayat', relation: 'Anak', occupation: 'Pelajar', nik: '3276051205120004', birthPlace: 'Depok', birthDate: '12 Mei 2012', gender: 'Laki-laki', religion: 'Islam' },
  { name: 'Aisyah Putri Hidayat', relation: 'Anak', occupation: 'Pelajar', nik: '3276050808140005', birthPlace: 'Depok', birthDate: '8 Agustus 2014', gender: 'Perempuan', religion: 'Islam' },
];

export default function WargaSuratFormScreen({ route, navigation }: Props) {
  const { profile, rt, suratItem, onSubmitted } = route.params;
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [forSelf, setForSelf] = useState(true);
  const [familyIndex, setFamilyIndex] = useState(0);
  const [keperluanIndex, setKeperluanIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const address = rt.address?.trim() || `${rt.name}, RT ${rt.rtNumber}`;
  const selectedKeperluan = keperluanIndex == null ? '' : suratItem.keperluanOptions[keperluanIndex];

  const buildPurpose = () => {
    const subject = forSelf
      ? `Diri sendiri (${profile.fullName})`
      : `${FAMILY_DEMO[familyIndex].name} · ${FAMILY_DEMO[familyIndex].relation}`;
    return `[${subject}] ${selectedKeperluan}`;
  };

  const submit = async () => {
    if (selectedKeperluan === '') {
      toast.error('Pilih keperluan surat');
      return;
    }
    setSubmitting(true);
    try {
      await rtService.submitSuratRequest(rt.id, suratItem.suratTypeKey, buildPurpose());
      onSubmitted?.();
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
              <View style={styles.fieldRow}><Field label="NAMA" value={profile.fullName} /><Field label="NIK" value="—" /></View>
              <View style={styles.fieldRow}><Field label="PEKERJAAN" value="Wiraswasta" /><Field label="STATUS" value="Kawin" /></View>
              <View style={{ marginTop: 10 }}><Field label="ALAMAT" value={address} /></View>
            </View>

            <SectionTitle icon="people-outline" title="Surat Untuk" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <SuratUntukCard selected={forSelf} onPress={() => setForSelf(true)} icon="person-outline" title="Diri Sendiri" sub="Kepala Keluarga" />
              <SuratUntukCard selected={!forSelf} onPress={() => setForSelf(false)} icon="people-circle-outline" title="Anggota Keluarga" sub="Anak, Istri, dll" />
            </View>

            {!forSelf && (
              <>
                <SectionTitle icon="create-outline" title="Data Orang dalam Surat" iconColor="#EA580C" />
                {FAMILY_DEMO.map((m, i) => (
                  <Pressable key={m.nik} onPress={() => setFamilyIndex(i)} style={[styles.familyCard, { borderColor: familyIndex === i ? '#3B82F6' : colors.border, backgroundColor: familyIndex === i ? wargaColors.accentBlue : colors.surface }]}>
                    <View style={styles.familyAvatar}><Text style={{ fontSize: 11, fontWeight: '600' }}>{wargaInitialsFromName(m.name)}</Text></View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.bold14}>{m.name}</Text>
                      <Text style={[wargaText.greeting, { fontSize: 12 }]}>{m.relation} · {m.occupation}</Text>
                    </View>
                    {familyIndex === i && <Ionicons name="checkmark-circle" size={22} color="#3B82F6" />}
                  </Pressable>
                ))}
                <View style={[wargaCardStyle(14), { padding: 14, marginTop: 4 }]}>
                  <View style={styles.fieldRow}><Field label="NIK" value={FAMILY_DEMO[familyIndex].nik} /><Field label="TTL" value={`${FAMILY_DEMO[familyIndex].birthPlace}, ${FAMILY_DEMO[familyIndex].birthDate}`} /></View>
                  <View style={styles.fieldRow}><Field label="JENIS KELAMIN" value={FAMILY_DEMO[familyIndex].gender} /><Field label="AGAMA" value={FAMILY_DEMO[familyIndex].religion} /></View>
                </View>
              </>
            )}

            <SectionTitle icon="document-text-outline" title="Keperluan" iconColor={wargaColors.primaryGreen} />
            {suratItem.keperluanOptions.map((opt, i) => (
              <Pressable key={opt} onPress={() => setKeperluanIndex(i)} style={[wargaCardStyle(14), styles.keperluan]}>
                <Ionicons name={keperluanIndex === i ? 'radio-button-on' : 'radio-button-off'} size={22} color={keperluanIndex === i ? '#3B82F6' : colors.textSecondary} />
                <Text style={styles.keperluanText}>{opt}</Text>
              </Pressable>
            ))}
          </>
        ) : (
          <View style={[wargaCardStyle(16), { padding: 16 }]}>
            <Text style={wargaText.sectionTitle}>Ringkasan permohonan</Text>
            <View style={{ height: 12 }} />
            <PreviewRow label="Jenis surat" value={suratItem.title} />
            <PreviewRow label="Untuk" value={forSelf ? profile.fullName : FAMILY_DEMO[familyIndex].name} />
            <PreviewRow label="Keperluan" value={selectedKeperluan} />
            <PreviewRow label="Estimasi" value={suratItem.sla} />
            <View style={styles.divider} />
            <Text style={[wargaText.greeting, { fontSize: 12, lineHeight: 17 }]}>
              Setelah dikirim, permohonan akan ditinjau Ketua RT. Anda bisa cek status di tab Permohonan Saya.
            </Text>
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomBarWrap}>
        <Pressable onPress={submitting ? undefined : onPrimary} style={[styles.bottomBar, submitting && { opacity: 0.6 }]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.bottomBarText}>{step === 0 ? 'Lanjut Preview' : 'Kirim Permohonan'}</Text>}
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}

function InfoBanner({ title, sla, icon, iconColor }: { title: string; sla: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }) {
  return (
    <View style={styles.infoBanner}>
      <Ionicons name={icon} size={28} color={iconColor} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.bold14}>{title}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]}>Estimasi {sla}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ icon, title, badge, iconColor }: { icon: keyof typeof Ionicons.glyphMap; title: string; badge?: string; iconColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 }}>
      <Ionicons name={icon} size={20} color={iconColor ?? '#3B82F6'} />
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

function SuratUntukCard({ selected, onPress, icon, title, sub }: { selected: boolean; onPress: () => void; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }) {
  const c = selected ? '#2563EB' : colors.textSecondary;
  return (
    <Pressable onPress={onPress} style={[styles.untukCard, { borderColor: selected ? '#3B82F6' : colors.border, borderWidth: selected ? 2 : 1, backgroundColor: selected ? wargaColors.accentBlue : colors.surface }]}>
      <Ionicons name={icon} size={24} color={c} />
      <Text style={[styles.untukTitle, { color: selected ? '#2563EB' : colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.untukSub, { color: selected ? '#2563EB' : colors.textSecondary }]}>{sub}</Text>
    </Pressable>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={[wargaText.greeting, { fontSize: 12, width: 100 }]}>{label}</Text>
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
  untukCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14 },
  untukTitle: { fontWeight: '600', fontSize: 13, marginTop: 8, textAlign: 'center' },
  untukSub: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  familyCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  familyAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: wargaColors.lightGreen, alignItems: 'center', justifyContent: 'center' },
  keperluan: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, marginTop: 8 },
  keperluanText: { flex: 1, marginLeft: 12, fontWeight: '500', fontSize: 14, color: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  bottomBarWrap: { backgroundColor: wargaColors.bgColor },
  bottomBar: { marginHorizontal: 20, marginVertical: 8, height: 48, borderRadius: 14, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center' },
  bottomBarText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
