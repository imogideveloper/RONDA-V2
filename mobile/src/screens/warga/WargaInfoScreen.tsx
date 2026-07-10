// Port dari lib/pages/warga/warga_info_view.dart
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaInfoAnnouncementCard, WargaInfoHeroCard } from '../../components/warga/InfoWidgets';
import { rtService } from '../../services/rtService';
import { announcementReadService } from '../../services/announcementReadService';
import { categoryKindFor } from '../../lib/announcementCategory';
import { announcementActive, groupByYearMonth } from '../../lib/papanInfo';
import { Announcement } from '../../types/models';
import { Profile, RtUnit } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onAnnouncementRead?: () => void;
}

export function WargaInfoScreen({ profile, rt, onAnnouncementRead }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await rtService.getAnnouncements(rt.id);
      const reads = await announcementReadService.readIdsForRt(rt.id);
      const unread = await announcementReadService.unreadCount(rt.id, list);
      setItems(list);
      setReadIds(reads);
      setUnreadCount(unread);
    } catch {
      // biarkan data lama
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rt.id]);

  useEffect(() => {
    load();
  }, [load]);

  const countByKind = (kind: 'kerjaBakti' | 'info' | 'darurat') =>
    items.filter((a) => categoryKindFor(a) === kind).length;

  const openAnnouncement = async (a: Announcement) => {
    await announcementReadService.markRead(rt.id, a.id);
    onAnnouncementRead?.();
    navigation.navigate('AnnouncementDetail', { announcement: a });
    load();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <Text style={styles.header}>Informasi</Text>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.emerald}
          />
        }
      >
        <WargaInfoHeroCard
          activeCount={items.length}
          unreadCount={unreadCount}
          infoCount={countByKind('info')}
          kerjaBaktiCount={countByKind('kerjaBakti')}
          daruratCount={countByKind('darurat')}
        />
        <View style={{ height: 20 }} />

        {loading ? null : items.length === 0 ? (
          <WargaCard>
            <View style={{ alignItems: 'center' }}>
              <Icon name="megaphone-outline" size={48} color={colors.textSecondary} />
              <Text style={[wargaText.greeting, { marginTop: 12, textAlign: 'center' }]}>
                Belum ada informasi dari pengurus RT.
              </Text>
            </View>
          </WargaCard>
        ) : (
          <>
            {items.filter(announcementActive).map((a) => (
              <WargaInfoAnnouncementCard
                key={a.id}
                item={a}
                isUnread={!readIds.has(a.id)}
                onTap={() => openAnnouncement(a)}
              />
            ))}

            {(() => {
              const expired = items.filter((a) => !announcementActive(a));
              if (expired.length === 0) return null;
              return (
                <>
                  <View style={styles.arsipHeaderRow}>
                    <Icon name="time-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.arsipHeader}>Arsip — Kegiatan Selesai</Text>
                  </View>
                  {groupByYearMonth(expired, (a) => a.eventDate ?? a.createdAt).map((g) => (
                    <View key={g.key}>
                      <Text style={styles.monthHeader}>{g.label}</Text>
                      {g.items.map((a) => (
                        <WargaInfoAnnouncementCard
                          key={a.id}
                          item={a}
                          isUnread={!readIds.has(a.id)}
                          onTap={() => openAnnouncement(a)}
                        />
                      ))}
                    </View>
                  ))}
                </>
              );
            })()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  header: { textAlign: 'center', fontSize: 17, fontWeight: '600', color: colors.textPrimary, paddingTop: 8, paddingBottom: 10 },
  scroll: { paddingHorizontal: 20, paddingBottom: 96 },
  arsipHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 4 },
  arsipHeader: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  monthHeader: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.4, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
});
