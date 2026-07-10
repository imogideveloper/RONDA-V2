// Port dari lib/pages/tabs/kas_tab.dart
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatRupiah, radius, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaPageHeader } from '../../components/warga/DashboardWidgets';
import { WargaEmptyState } from '../../components/warga/PengurusWidgets';
import { PrimaryButton } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import {
  KasSummary,
  KasTransaction,
  Profile,
  RtUnit,
  emptyKasSummary,
  kasDateLabel,
  kasIsIncome,
  profileIsBendahara,
  profileIsKetua,
  rtDisplayLabel,
} from '../../types/models';

interface Props {
  profile: Profile;
  rt: RtUnit;
}

export function PengurusKasScreen({ profile, rt }: Props) {
  const toast = useToast();
  const [kas, setKas] = useState<KasSummary>(emptyKasSummary());
  const [txs, setTxs] = useState<KasTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [isIncome, setIsIncome] = useState(true);
  const canEdit = profileIsKetua(profile) || profileIsBendahara(profile);

  const load = useCallback(async () => {
    const [k, t] = await Promise.all([rtService.getKasSummary(rt.id), rtService.getKasTransactions(rt.id)]);
    setKas(k);
    setTxs(t);
    setLoading(false);
    setRefreshing(false);
  }, [rt.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (amount: number, desc: string) => {
    await rtService.addKasTransaction({
      rtId: rt.id,
      type: isIncome ? 'masuk' : 'keluar',
      amount,
      description: desc,
      category: isIncome ? 'pemasukan' : 'pengeluaran',
    });
    setAddOpen(false);
    await load();
    toast.success('Transaksi tersimpan');
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.emerald} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          <WargaPageHeader
            title="Kas RT"
            subtitle={rtDisplayLabel(rt)}
            trailing={
              canEdit ? (
                <Pressable onPress={() => setAddOpen(true)} style={styles.addBtn}>
                  <Ionicons name="add" size={22} color={wargaColors.primaryGreen} />
                </Pressable>
              ) : undefined
            }
          />
          <View style={{ height: 16 }} />

          <WargaCard>
            <Text style={wargaText.labelCaps}>SALDO KAS</Text>
            <Text style={styles.saldo}>{formatRupiah(kas.saldo)}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <KasMini label="Pemasukan" value={kas.totalMasuk} positive />
              <KasMini label="Pengeluaran" value={kas.totalKeluar} positive={false} />
            </View>
          </WargaCard>

          {!canEdit && (
            <WargaCard style={{ marginTop: 12 }}>
              <Text style={wargaText.greeting}>Hanya Ketua RT / Bendahara yang dapat mencatat transaksi.</Text>
            </WargaCard>
          )}

          <View style={{ height: 20 }} />
          <Text style={wargaText.sectionTitle}>Riwayat transaksi</Text>
          <View style={{ height: 10 }} />
          {txs.length === 0 ? (
            <WargaEmptyState icon="receipt-outline" message={'Belum ada transaksi.\nTambah lewat tombol + di atas.'} />
          ) : (
            txs.map((t) => (
              <View key={t.id} style={[styles.row, wargaCardBorder]}>
                <Ionicons name={kasIsIncome(t) ? 'checkmark-circle' : 'time-outline'} size={22} color={kasIsIncome(t) ? wargaColors.primaryGreen : wargaColors.dangerRed} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rowTitle}>{t.description}</Text>
                  <Text style={[wargaText.greeting, { fontSize: 12 }]}>{kasDateLabel(t)}</Text>
                </View>
                <Text style={[styles.rowAmount, { color: kasIsIncome(t) ? wargaColors.primaryGreen : wargaColors.dangerRed }]}>
                  {kasIsIncome(t) ? '+' : '-'}{formatRupiah(t.amount)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <KasFormModal
        visible={addOpen}
        isIncome={isIncome}
        onToggle={setIsIncome}
        onClose={() => setAddOpen(false)}
        onSubmit={submit}
      />
    </SafeAreaView>
  );
}

function KasMini({ label, value, positive }: { label: string; value: number; positive: boolean }) {
  return (
    <View style={styles.mini}>
      <Text style={wargaText.labelCaps}>{label}</Text>
      <Text style={[styles.miniValue, { color: positive ? wargaColors.primaryGreen : wargaColors.dangerRed }]}>
        {formatRupiah(value)}
      </Text>
    </View>
  );
}

function KasFormModal({
  visible,
  isIncome,
  onToggle,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  isIncome: boolean;
  onToggle: (v: boolean) => void;
  onClose: () => void;
  onSubmit: (amount: number, desc: string) => Promise<void>;
}) {
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const val = parseFloat(amount.replace(/\D/g, ''));
    if (isNaN(val) || val <= 0) return toast.error('Nominal tidak valid');
    if (desc.trim() === '') return toast.error('Keterangan wajib');
    setSaving(true);
    try {
      await onSubmit(val, desc.trim());
      setAmount('');
      setDesc('');
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <View style={styles.toggle}>
              <Pressable onPress={() => onToggle(true)} style={[styles.toggleBtn, isIncome && styles.toggleActive]}>
                <Text style={[styles.toggleText, isIncome && { color: wargaColors.primaryGreen }]}>Pemasukan</Text>
              </Pressable>
              <Pressable onPress={() => onToggle(false)} style={[styles.toggleBtn, !isIncome && styles.toggleActive]}>
                <Text style={[styles.toggleText, !isIncome && { color: wargaColors.dangerRed }]}>Pengeluaran</Text>
              </Pressable>
            </View>
            <Text style={styles.mLabel}>Nominal</Text>
            <TextInput style={styles.mInput} value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="0" placeholderTextColor={colors.textHint} />
            <Text style={styles.mLabel}>Keterangan</Text>
            <TextInput style={styles.mInput} value={desc} onChangeText={setDesc} placeholder="Contoh: Beli lampu jalan" placeholderTextColor={colors.textHint} />
            <View style={{ height: 20 }} />
            <PrimaryButton label={saving ? 'Menyimpan...' : 'Simpan Transaksi'} onPress={submit} loading={saving} />
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const wargaCardBorder = {
  backgroundColor: colors.surface,
  borderRadius: 12,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.border,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  addBtn: { padding: 10, backgroundColor: wargaColors.lightGreen, borderRadius: 12 },
  saldo: { fontSize: 28, fontWeight: '600', color: wargaColors.primaryGreen, marginTop: 8 },
  mini: { flex: 1, padding: 12, backgroundColor: wargaColors.lightGreen, borderRadius: 12 },
  miniValue: { fontWeight: '600', fontSize: 14, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  rowTitle: { fontWeight: '500', fontSize: 14, color: colors.textPrimary },
  rowAmount: { fontWeight: '600', fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 16 },
  toggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  toggleActive: { backgroundColor: '#fff' },
  toggleText: { fontWeight: '600', fontSize: 13, color: colors.textSecondary },
  mLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 16, marginBottom: 6 },
  mInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary },
});
