// Port dari lib/widgets/ketua_rt_dashboard_widgets.dart + WargaPengumumanFeedCard/WargaEmptyState
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { colors, formatRupiah, wargaColors } from '../../config/theme';
import { Announcement, announcementCreatedLabel } from '../../types/models';
import { categoryMetaFor } from '../../lib/announcementCategory';
import { wargaCardStyle, wargaText } from './wargaUi';

// Kartu hero kas (dashboard ketua).
export function KasHeroCard({ saldo, onTap }: { saldo: number; onTap?: () => void }) {
  return (
    <Pressable onPress={onTap} style={({ pressed }) => [styles.kasHero, pressed && { opacity: 0.9 }]}>
      <Text style={styles.kasHeroLabel}>Total Kas RT</Text>
      <Text style={styles.kasHeroValue}>{formatRupiah(saldo)}</Text>
      <Text style={styles.kasHeroHint}>Ketuk untuk riwayat transaksi</Text>
    </Pressable>
  );
}

// Grid aksi cepat ketua (tagih, verifikasi, approve surat, buat info).
export function KetuaQuickActionGrid({
  tagihCount,
  verifikasiCount,
  suratPendingCount,
  onTagih,
  onVerifikasi,
  onApproveSurat,
  onBuatInfo,
}: {
  tagihCount: number;
  verifikasiCount: number;
  suratPendingCount: number;
  onTagih: () => void;
  onVerifikasi: () => void;
  onApproveSurat: () => void;
  onBuatInfo: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <QuickTile icon="cash" color={wargaColors.primaryGreen} label={'Tagih\nIuran'} badge={tagihCount} onTap={onTagih} />
      <QuickTile icon="eye" color="#185FA5" label={'Verifikasi\nIuran'} badge={verifikasiCount} onTap={onVerifikasi} />
      <QuickTile icon="create" color="#3B6D11" label={'Approve\nSurat'} badge={suratPendingCount} onTap={onApproveSurat} />
      <QuickTile icon="megaphone" color="#BA7517" label={'Buat\nInfo'} onTap={onBuatInfo} />
    </View>
  );
}

function QuickTile({
  icon,
  color,
  label,
  badge = 0,
  onTap,
}: {
  icon: IconName;
  color: string;
  label: string;
  badge?: number;
  onTap: () => void;
}) {
  return (
    <Pressable onPress={onTap} style={({ pressed }) => [wargaCardStyle(14), styles.quickTile, pressed && { opacity: 0.9 }]}>
      <View style={[styles.quickIcon, { backgroundColor: color + '1F' }]}>
        <Icon name={icon} size={26} color={color} />
        {badge > 0 && (
          <View style={styles.quickBadge}>
            <Text style={styles.quickBadgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

// Kartu feed pengumuman (dashboard).
export function WargaPengumumanFeedCard({ item, onTap }: { item: Announcement; onTap: () => void }) {
  const cat = categoryMetaFor(item);
  return (
    <Pressable onPress={onTap} style={({ pressed }) => [wargaCardStyle(16), styles.feed, pressed && { opacity: 0.9 }]}>
      <View style={[styles.feedIcon, { backgroundColor: cat.bg }]}>
        <Icon name={cat.icon} size={22} color={cat.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.feedBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.feedBadgeText, { color: cat.color }]}>{cat.label}</Text>
          </View>
          <Text style={[wargaText.greeting, { fontSize: 11 }]}>{announcementCreatedLabel(item)}</Text>
        </View>
        <Text style={styles.feedTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]} numberOfLines={2}>{item.content}</Text>
      </View>
    </Pressable>
  );
}

export function WargaEmptyState({
  icon = 'file-tray-outline',
  message,
}: {
  icon?: IconName;
  message: string;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 32 }}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={36} color={wargaColors.primaryGreen} />
      </View>
      <Text style={[wargaText.greeting, { fontSize: 14, textAlign: 'center', marginTop: 14 }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kasHero: { padding: 18, borderRadius: 18, backgroundColor: wargaColors.primaryGreen, overflow: 'hidden' },
  kasHeroLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  kasHeroValue: { color: '#fff', fontSize: 28, fontWeight: '600', marginTop: 8 },
  kasHeroHint: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },

  quickTile: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  quickIcon: { padding: 12, borderRadius: 14 },
  quickBadge: {
    position: 'absolute', top: -4, right: -4, paddingHorizontal: 5, paddingVertical: 2,
    backgroundColor: colors.danger, borderRadius: 10, borderWidth: 1.5, borderColor: '#fff',
  },
  quickBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8, lineHeight: 14, color: colors.textPrimary },

  feed: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, marginBottom: 10 },
  feedIcon: { padding: 10, borderRadius: 12 },
  feedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  feedBadgeText: { fontSize: 10, fontWeight: '700' },
  feedTitle: { fontWeight: '700', fontSize: 14, color: colors.textPrimary, marginTop: 8 },

  emptyIcon: { padding: 16, borderRadius: 999, backgroundColor: wargaColors.lightGreen },
});
