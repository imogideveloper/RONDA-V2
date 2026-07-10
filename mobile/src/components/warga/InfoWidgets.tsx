// Port dari lib/widgets/warga_info_widgets.dart
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { colors } from '../../config/theme';
import { Announcement, announcementContentPreview } from '../../types/models';
import {
  announcementAuthorLabel,
  announcementRelativeTime,
  categoryMetaFor,
} from '../../lib/announcementCategory';
import { wargaCardStyle } from './wargaUi';

// Hero oranye — ringkasan informasi RT.
export function WargaInfoHeroCard({
  activeCount,
  unreadCount,
  infoCount,
  kerjaBaktiCount,
  daruratCount,
}: {
  activeCount: number;
  unreadCount: number;
  infoCount: number;
  kerjaBaktiCount: number;
  daruratCount: number;
}) {
  return (
    <View style={styles.hero}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="megaphone" size={16} color="rgba(255,255,255,0.92)" />
            <Text style={styles.heroKicker}>INFORMASI RT</Text>
          </View>
          <Text style={styles.heroBig}>{activeCount} Aktif</Text>
          <Text style={styles.heroSub}>
            {unreadCount > 0
              ? `${unreadCount} informasi belum dibaca`
              : 'Semua informasi sudah dibaca'}
          </Text>
        </View>
        <View style={styles.heroIcon}>
          <Icon name="megaphone" size={32} color="#fff" />
        </View>
      </View>
      <View style={styles.pillRow}>
        <Pill icon="megaphone-outline" label={`${infoCount} Info`} />
        <Pill icon="calendar-outline" label={`${kerjaBaktiCount} Kerja Bakti`} />
        <Pill icon="warning-outline" label={`${daruratCount} Darurat`} />
      </View>
    </View>
  );
}

function Pill({ icon, label }: { icon: IconName; label: string }) {
  return (
    <View style={styles.pill}>
      <Icon name={icon} size={14} color="#fff" />
      <Text style={styles.pillText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

// Kartu satu pengumuman di tab Informasi.
export function WargaInfoAnnouncementCard({
  item,
  isUnread,
  onTap,
}: {
  item: Announcement;
  isUnread: boolean;
  onTap: () => void;
}) {
  const cat = categoryMetaFor(item);
  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [wargaCardStyle(16), styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.catIcon, { backgroundColor: cat.bg }]}>
        <Icon name={cat.icon} size={22} color={cat.color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Badge text={cat.label} fg={cat.color} bg={cat.bg} />
          {isUnread && (
            <View style={{ marginLeft: 6 }}>
              <Badge text="BARU" fg="#fff" bg="#EA580C" />
            </View>
          )}
          <Text style={styles.relTime}>{announcementRelativeTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.preview} numberOfLines={2}>
          {announcementContentPreview(item)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Icon name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.author} numberOfLines={1}>
            {announcementAuthorLabel(item)}
          </Text>
          <View style={[styles.dot, { backgroundColor: cat.dotColor }]} />
          <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

function Badge({ text, fg, bg }: { text: string; fg: string; bg: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroKicker: { color: 'rgba(255,255,255,0.92)', fontSize: 10, fontWeight: '600', letterSpacing: 0.4 },
  heroBig: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 12, marginTop: 4 },
  heroIcon: { padding: 14, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, alignSelf: 'flex-start' },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
  },
  pillText: { color: '#fff', fontSize: 10, fontWeight: '600', flexShrink: 1 },
  card: { flexDirection: 'row', padding: 14, marginBottom: 10 },
  catIcon: { padding: 10, borderRadius: 12, alignSelf: 'flex-start' },
  relTime: { flex: 1, textAlign: 'right', fontSize: 11, color: colors.textSecondary },
  title: { fontWeight: '600', fontSize: 14, color: colors.textPrimary, marginTop: 8, lineHeight: 18 },
  preview: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  author: { flex: 1, marginLeft: 4, fontSize: 11, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '700' },
});
