// Port dari lib/pages/tabs/pengumuman_tab.dart
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, wargaColors } from '../../config/theme';
import { WargaCard, wargaText } from '../../components/warga/wargaUi';
import { WargaPageHeader } from '../../components/warga/DashboardWidgets';
import { WargaEmptyState, WargaPengumumanFeedCard } from '../../components/warga/PengurusWidgets';
import { announcementReadService } from '../../services/announcementReadService';
import { rtService } from '../../services/rtService';
import { Announcement, Profile, RtUnit, profileIsBendahara, profileIsKetua, rtDisplayLabel } from '../../types/models';
import type { RootStackParamList } from '../../navigation/types';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onChanged: () => void;
}

export function PengurusPengumumanScreen({ profile, rt, onChanged }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [items, setItems] = useState<Announcement[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const canPost = profileIsKetua(profile) || profileIsBendahara(profile);

  const load = useCallback(async () => {
    const list = await rtService.getAnnouncements(rt.id);
    setItems(list);
    setUnread(await announcementReadService.unreadCount(rt.id, list));
    setLoading(false);
    setRefreshing(false);
  }, [rt.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openItem = async (a: Announcement) => {
    await announcementReadService.markRead(rt.id, a.id);
    onChanged();
    navigation.navigate('AnnouncementDetail', { announcement: a });
    load();
  };

  const openCreate = () =>
    navigation.navigate('CreateAnnouncement', {
      rtId: rt.id,
      onCreated: () => {
        load();
        onChanged();
      },
    });

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.emerald} />}
      >
        <WargaPageHeader
          title="Pengumuman RT"
          subtitle={`Informasi untuk ${rtDisplayLabel(rt)}`}
          trailing={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {unread > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{unread}</Text>
                </View>
              )}
              {canPost && (
                <Pressable onPress={openCreate} style={styles.addBtn}>
                  <Icon name="add" size={22} color={wargaColors.primaryGreen} />
                </Pressable>
              )}
            </View>
          }
        />
        <View style={{ height: 20 }} />

        {!canPost && (
          <WargaCard style={{ marginBottom: 12 }}>
            <Text style={wargaText.greeting}>Pengumuman dari Ketua RT / Bendahara akan muncul di sini.</Text>
          </WargaCard>
        )}

        {loading ? null : items.length === 0 ? (
          <WargaEmptyState icon="megaphone-outline" message={'Belum ada pengumuman.\nKetua/Bendahara bisa buat lewat tombol +'} />
        ) : (
          items.map((a) => <WargaPengumumanFeedCard key={a.id} item={a} onTap={() => openItem(a)} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: wargaColors.lightGreen, borderRadius: 20 },
  countBadgeText: { fontSize: 13, fontWeight: '600', color: wargaColors.primaryGreen },
  addBtn: { padding: 10, backgroundColor: wargaColors.lightGreen, borderRadius: 12 },
});
