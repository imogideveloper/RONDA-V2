// Gerbang warga baru: menunggu persetujuan Ketua RT sebelum bisa memakai app.
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { colors, wargaColors } from '../config/theme';
import { PrimaryButton } from '../components/Card';
import { Profile, RtUnit, rtDisplayLabel } from '../types/models';
import { formatDate } from '../lib/date';

function elapsedLabel(from: Date): string {
  const ms = Date.now() - from.getTime();
  if (ms < 0) return 'baru saja';
  const menit = Math.floor(ms / 60000);
  const jam = Math.floor(ms / 3600000);
  const hari = Math.floor(ms / 86400000);
  if (hari >= 1) return `${hari} hari`;
  if (jam >= 1) return `${jam} jam`;
  if (menit >= 1) return `${menit} menit`;
  return 'baru saja';
}

export function PendingApprovalScreen({
  profile,
  rt,
  onRefresh,
  onLogout,
}: {
  profile: Profile;
  rt: RtUnit | null;
  onRefresh: () => Promise<void> | void;
  onLogout: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const check = async () => {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  };

  const since = profile.createdAt;
  const waited = elapsedLabel(since);
  const overdue = Date.now() - since.getTime() >= 3 * 86400000; // > 3 hari

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="time-outline" size={44} color="#D97706" />
        </View>
        <Text style={styles.title}>Menunggu Persetujuan</Text>
        <Text style={styles.sub}>
          Halo {profile.fullName}, pendaftaranmu ke{' '}
          <Text style={styles.bold}>{rt ? rtDisplayLabel(rt) : 'RT'}{rt?.name ? ` · ${rt.name}` : ''}</Text>{' '}
          sedang menunggu persetujuan Ketua RT.
        </Text>
        <Text style={styles.hint}>
          Kamu akan bisa masuk dan memakai aplikasi setelah disetujui.
        </Text>

        <View style={styles.waitCard}>
          <View style={styles.waitRow}>
            <Icon name="time-outline" size={16} color="#B45309" />
            <Text style={styles.waitText}>
              Menunggu sejak <Text style={styles.waitBold}>{formatDate(since)}</Text> · sudah {waited}
            </Text>
          </View>
          <Text style={styles.estimate}>Biasanya diproses dalam 1–2 hari.</Text>
          {overdue && (
            <Text style={styles.overdue}>
              Sudah lebih dari 3 hari? Coba hubungi Ketua RT-mu langsung untuk konfirmasi.
            </Text>
          )}
        </View>

        <View style={{ height: 24 }} />
        <PrimaryButton label={checking ? 'Memeriksa…' : 'Periksa Status'} onPress={check} loading={checking} />
        <Text style={styles.logout} onPress={onLogout}>
          Keluar
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 12 },
  bold: { fontWeight: '700', color: colors.textPrimary },
  hint: { fontSize: 12, color: colors.textHint, textAlign: 'center', lineHeight: 18, marginTop: 12 },
  waitCard: { alignSelf: 'stretch', marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A' },
  waitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  waitText: { fontSize: 13, color: '#92400E', textAlign: 'center' },
  waitBold: { fontWeight: '700', color: '#78350F' },
  estimate: { fontSize: 12, color: '#B45309', textAlign: 'center', marginTop: 6 },
  overdue: { fontSize: 12, color: wargaColors.dangerRed, textAlign: 'center', marginTop: 8, lineHeight: 17 },
  logout: { color: wargaColors.dangerRed, fontWeight: '600', marginTop: 18, padding: 10 },
});
