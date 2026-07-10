// Port dari lib/pages/surat/surat_pengantar_page.dart
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { WargaCard, StatusChip, wargaText } from '../../components/warga/wargaUi';
import { PrimaryButton } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import {
  SuratRequest,
  profileIsKetua,
  suratIsApproved,
  suratIsPending,
  suratStatusLabel,
} from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SuratPengantar'>;

const TYPES = [
  'Surat Pengantar KTP',
  'Surat Domisili',
  'Surat Kerja Bakti',
  'Surat Keterangan Usaha',
  'Surat Pengantar Nikah',
];

export default function SuratPengantarScreen({ route }: Props) {
  const { profile, rt } = route.params;
  const toast = useToast();
  const isKetua = profileIsKetua(profile);
  const [tab, setTab] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [keperluan, setKeperluan] = useState('');
  const [requests, setRequests] = useState<SuratRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const list = await rtService.getSuratRequests(rt.id, isKetua);
    setRequests(list);
    setLoading(false);
    setRefreshing(false);
  }, [rt.id, isKetua]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (selectedType == null || keperluan.trim() === '') return;
    setSubmitting(true);
    try {
      await rtService.submitSuratRequest(rt.id, selectedType, keperluan.trim());
      setKeperluan('');
      setSelectedType(null);
      await load();
      setTab(1);
      toast.success('Permohonan surat terkirim');
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (req: SuratRequest, status: string) => {
    try {
      await rtService.updateSuratStatus(req.id, status);
      await load();
      toast.success(`Status: ${status}`);
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Surat Pengantar" />
      <View style={styles.segment}>
        <SegTab label="Ajukan" active={tab === 0} onPress={() => setTab(0)} />
        <SegTab label="Status" active={tab === 1} onPress={() => setTab(1)} />
      </View>

      {tab === 0 ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.h}>Jenis Surat</Text>
          {TYPES.map((t) => (
            <Pressable key={t} onPress={() => setSelectedType(t)} style={[styles.radioRow, selectedType === t && styles.radioActive]}>
              <Ionicons name={selectedType === t ? 'radio-button-on' : 'radio-button-off'} size={22} color={selectedType === t ? colors.emerald : colors.textSecondary} />
              <Text style={styles.radioLabel}>{t}</Text>
            </Pressable>
          ))}
          <Text style={styles.h}>Keperluan</Text>
          <TextInput
            style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
            value={keperluan}
            onChangeText={setKeperluan}
            multiline
            placeholder="Jelaskan keperluan surat..."
            placeholderTextColor={colors.textHint}
          />
          <View style={{ height: 24 }} />
          <PrimaryButton label="Kirim Permohonan" onPress={submit} loading={submitting} disabled={selectedType == null} />
        </ScrollView>
      ) : loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.emerald} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          {requests.length === 0 ? (
            <Text style={styles.empty}>Belum ada permohonan surat</Text>
          ) : (
            requests.map((r) => (
              <WargaCard key={r.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{r.suratType}</Text>
                    {r.userName && isKetua && <Text style={[wargaText.greeting, { fontSize: 12 }]}>{r.userName}</Text>}
                  </View>
                  <StatusChip
                    label={suratStatusLabel(r)}
                    color={suratIsApproved(r) ? colors.success : r.status === 'rejected' ? colors.danger : colors.warning}
                  />
                </View>
                <Text style={[wargaText.greeting, { fontSize: 13, marginTop: 6 }]}>{r.purpose}</Text>
                {isKetua && suratIsPending(r) && (
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                    <Pressable onPress={() => setStatus(r, 'rejected')} style={[styles.actionBtn, { borderColor: colors.danger }]}>
                      <Text style={{ color: colors.danger, fontWeight: '600' }}>Tolak</Text>
                    </Pressable>
                    <Pressable onPress={() => setStatus(r, 'approved')} style={[styles.actionBtn, styles.approveBtn]}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>Setujui</Text>
                    </Pressable>
                  </View>
                )}
                {suratIsApproved(r) && (
                  <Pressable onPress={() => toast.success('Unduh PDF — segera hadir')} style={[styles.actionBtn, { borderColor: colors.emerald, marginTop: 12 }]}>
                    <Ionicons name="download-outline" size={18} color={colors.emerald} />
                    <Text style={{ color: colors.emerald, fontWeight: '600', marginLeft: 6 }}>Unduh PDF (demo)</Text>
                  </Pressable>
                )}
              </WargaCard>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SegTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segTab, active && styles.segTabActive]}>
      <Text style={[styles.segText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 32 },
  segment: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.emerald, borderRadius: radius.md, overflow: 'hidden' },
  segTab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segTabActive: { backgroundColor: colors.emerald },
  segText: { fontWeight: '600', color: colors.emerald },
  h: { fontWeight: '600', color: colors.textPrimary, marginTop: 16, marginBottom: 8 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginBottom: 8, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  radioActive: { borderColor: colors.emerald },
  radioLabel: { fontSize: 14, color: colors.textPrimary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, backgroundColor: colors.surface },
  empty: { color: colors.textSecondary, textAlign: 'center', padding: 32 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, borderRadius: 12, borderWidth: 1 },
  approveBtn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
});
