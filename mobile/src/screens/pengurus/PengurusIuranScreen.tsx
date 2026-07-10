// Port dari lib/pages/tabs/iuran_tab.dart + ketua_iuran_bill_card.dart (mode Ketua/Bendahara)
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { WargaCard, StatusChip, wargaText } from '../../components/warga/wargaUi';
import { WargaPageHeader } from '../../components/warga/DashboardWidgets';
import { WargaEmptyState } from '../../components/warga/PengurusWidgets';
import { PrimaryButton } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import {
  IuranRecord,
  Profile,
  RtUnit,
  iuranIsPaid,
  rtDisplayLabel,
} from '../../types/models';
import { openWhatsAppTagihan } from '../../lib/whatsapp';
import type { IuranKetuaMode } from './PengurusMainShell';

const DEFAULT_AMOUNT = 50000;

interface Props {
  profile: Profile;
  rt: RtUnit;
  mode: IuranKetuaMode;
  onBack?: () => void;
}

export function PengurusIuranScreen({ rt, mode, onBack }: Props) {
  const toast = useToast();
  const [bills, setBills] = useState<IuranRecord[]>([]);
  const [members, setMembers] = useState<Record<string, Profile>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await rtService.getIuranRecords(rt.id);
    const memberList = await rtService.getRtMembers();
    setBills(list);
    setMembers(Object.fromEntries(memberList.map((m) => [m.id, m])));
    setLoading(false);
    setRefreshing(false);
  }, [rt.id]);

  useEffect(() => {
    load();
  }, [load]);

  const generateMonthly = async () => {
    try {
      const n = await rtService.ensureMonthlyIuran(DEFAULT_AMOUNT);
      toast.success(n > 0 ? `${n} tagihan baru dibuat` : 'Tagihan bulan ini sudah ada');
      await load();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    }
  };

  const approve = async (bill: IuranRecord) => {
    setApprovingId(bill.id);
    try {
      await rtService.approveIuranAsOfficer(bill.id);
      toast.success(`Iuran ${bill.userName ?? 'warga'} disetujui`);
      await load();
    } catch (e: any) {
      toast.error(String(e?.message ?? e));
    } finally {
      setApprovingId(null);
    }
  };

  const unpaid = bills.filter((b) => !iuranIsPaid(b));
  const paid = bills.filter(iuranIsPaid);
  const focused = mode === 'tagih' || mode === 'verifikasi';
  const title = mode === 'tagih' ? 'Tagih Iuran' : mode === 'verifikasi' ? 'Verifikasi Iuran' : 'Iuran RT';
  const infoText = focused
    ? mode === 'tagih'
      ? 'Ketuk kartu warga untuk mention WhatsApp atau approve pembayaran.'
      : 'Ketuk kartu warga untuk verifikasi pembayaran iuran.'
    : 'Pantau status pembayaran iuran warga RT. Ketuk ↻ untuk buat tagihan bulan ini.';

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.emerald} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
        >
          {onBack && (
            <Pressable onPress={onBack} style={styles.backRow}>
              <Ionicons name="chevron-back" size={18} color={wargaColors.primaryGreen} />
              <Text style={styles.backText}>Kembali ke Beranda</Text>
            </Pressable>
          )}
          <WargaPageHeader
            title={title}
            subtitle={rtDisplayLabel(rt)}
            trailing={
              <Pressable onPress={generateMonthly} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={22} color={wargaColors.primaryGreen} />
              </Pressable>
            }
          />
          <View style={{ height: 16 }} />

          <WargaCard style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={22} color={wargaColors.primaryGreen} />
              <Text style={[wargaText.greeting, { flex: 1, marginLeft: 12, lineHeight: 19 }]}>{infoText}</Text>
            </View>
          </WargaCard>

          {focused ? (
            <>
              <Text style={wargaText.sectionTitle}>
                {mode === 'tagih' ? 'Warga belum bayar' : 'Menunggu verifikasi'}
              </Text>
              <View style={{ height: 10 }} />
              {unpaid.length === 0 ? (
                <WargaEmptyState icon="happy-outline" message="Semua iuran bulan ini sudah lunas." />
              ) : (
                unpaid.map((b) => (
                  <KetuaExpandableIuranCard
                    key={b.id}
                    bill={b}
                    warga={members[b.userId]}
                    rt={rt}
                    mode={mode}
                    expanded={expandedId === b.id}
                    approving={approvingId === b.id}
                    onToggle={() => setExpandedId((cur) => (cur === b.id ? null : b.id))}
                    onApprove={() => approve(b)}
                  />
                ))
              )}
              {paid.length > 0 && (
                <>
                  <View style={{ height: 16 }} />
                  <Text style={wargaText.sectionTitle}>Sudah lunas</Text>
                  <View style={{ height: 10 }} />
                  {paid.slice(0, 6).map((b) => <BillCard key={b.id} bill={b} showName />)}
                </>
              )}
            </>
          ) : (
            <>
              <Text style={wargaText.sectionTitle}>Semua Tagihan RT</Text>
              <View style={{ height: 10 }} />
              {bills.length === 0 ? (
                <WargaEmptyState icon="receipt-outline" message={'Belum ada tagihan.\nKetuk ikon refresh di atas.'} />
              ) : (
                bills.map((b) => <BillCard key={b.id} bill={b} showName />)
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function BillCard({ bill, showName = false }: { bill: IuranRecord; showName?: boolean }) {
  return (
    <WargaCard style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text style={[wargaText.sectionTitle, { fontSize: 15 }]}>
          {showName && bill.userName ? `${bill.userName} — ${bill.periodLabel}` : bill.periodLabel}
        </Text>
        <Text style={[wargaText.greeting, { marginTop: 4 }]}>{formatRupiah(bill.amount)}</Text>
      </View>
      <StatusChip label={iuranIsPaid(bill) ? 'Lunas' : 'Belum bayar'} color={iuranIsPaid(bill) ? wargaColors.primaryGreen : '#BA7517'} />
    </WargaCard>
  );
}

function iuranCardTitle(userName: string | null, periodLabel: string): string {
  const name = userName && userName.trim().length > 0 ? userName.split(' ')[0] : 'Warga';
  const periodShort = periodLabel.split(' ')[0];
  return `${name} - ${periodShort}`;
}

function KetuaExpandableIuranCard({
  bill,
  warga,
  rt,
  mode,
  expanded,
  approving,
  onToggle,
  onApprove,
}: {
  bill: IuranRecord;
  warga?: Profile;
  rt: RtUnit;
  mode: IuranKetuaMode;
  expanded: boolean;
  approving: boolean;
  onToggle: () => void;
  onApprove: () => void;
}) {
  const phone = warga?.phone ?? '';
  const hasPhone = phone.replace(/\D/g, '').length >= 9;

  const mention = () =>
    openWhatsAppTagihan({
      phone,
      wargaName: bill.userName ?? 'Warga',
      periodLabel: bill.periodLabel,
      amountFormatted: formatRupiah(bill.amount),
      rtLabel: rtDisplayLabel(rt),
    });

  return (
    <WargaCard style={{ marginBottom: 10 }}>
      <Pressable onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={[wargaText.sectionTitle, { fontSize: 16 }]}>{iuranCardTitle(bill.userName, bill.periodLabel)}</Text>
          <Text style={[wargaText.greeting, { marginTop: 4 }]}>{formatRupiah(bill.amount)}</Text>
        </View>
        <StatusChip label={iuranIsPaid(bill) ? 'Lunas' : 'Belum bayar'} color={iuranIsPaid(bill) ? wargaColors.primaryGreen : '#BA7517'} />
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} style={{ marginLeft: 4 }} />
      </Pressable>
      {expanded && !iuranIsPaid(bill) && (
        <View style={{ marginTop: 16 }}>
          {mode === 'verifikasi' && (
            <View style={{ marginBottom: 10 }}>
              <PrimaryButton label={approving ? 'Memproses...' : 'Approve Iuran'} onPress={onApprove} loading={approving} />
            </View>
          )}
          <Pressable onPress={hasPhone ? mention : undefined} style={[styles.waBtn, !hasPhone && { opacity: 0.5 }]}>
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={styles.waText}>{hasPhone ? 'Mention tagihan ke No. warga' : 'Nomor warga belum diisi'}</Text>
          </Pressable>
          {mode === 'tagih' && (
            <View style={{ marginTop: 10 }}>
              <PrimaryButton label={approving ? 'Memproses...' : 'Approve Iuran'} onPress={onApprove} loading={approving} />
            </View>
          )}
        </View>
      )}
    </WargaCard>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backText: { color: wargaColors.primaryGreen, fontWeight: '600' },
  refreshBtn: { padding: 10, backgroundColor: wargaColors.lightGreen, borderRadius: 12 },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#25D366',
  },
  waText: { color: '#25D366', fontWeight: '600' },
});
