// Port dari lib/pages/pengumuman/announcement_detail_page.dart
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors } from '../../config/theme';
import { WargaCard, StatusChip, wargaText } from '../../components/warga/wargaUi';
import {
  Announcement,
  announcementCreatedLabel,
  announcementHasImage,
} from '../../types/models';
import { formatDate } from '../../lib/date';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AnnouncementDetail'>;

export default function AnnouncementDetailScreen({ route, navigation }: Props) {
  const a: Announcement = route.params.announcement;
  const hasEvent = a.eventDate != null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appbar}>
        <Icon
          name="arrow-back"
          size={24}
          color={colors.emerald}
          onPress={() => navigation.goBack()}
        />
        <Text style={[wargaText.sectionTitle, { marginLeft: 12 }]}>Detail Pengumuman</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {a.isPinned && (
          <View style={{ marginBottom: 12 }}>
            <StatusChip label="Penting" color="#BA7517" />
          </View>
        )}
        {announcementHasImage(a) && (
          <Image source={{ uri: a.imageUrl! }} style={styles.image} resizeMode="cover" />
        )}
        <Text style={styles.title}>{a.title}</Text>

        {hasEvent && (
          <WargaCard style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="calendar" size={22} color={colors.emerald} />
              <View style={{ marginLeft: 10 }}>
                <Text style={wargaText.labelCaps}>Tanggal kegiatan</Text>
                <Text style={[wargaText.sectionTitle, { fontSize: 16 }]}>
                  {formatDate(a.eventDate!)}
                </Text>
              </View>
            </View>
          </WargaCard>
        )}

        <WargaCard style={{ marginBottom: 16 }}>
          <Text style={styles.content}>{a.content}</Text>
        </WargaCard>

        <WargaCard>
          <MetaRow icon="person-outline" label="Diposting oleh" value={a.authorName ?? 'Pengurus RT'} />
          <View style={{ height: 10 }} />
          <MetaRow icon="time-outline" label="Tanggal posting" value={announcementCreatedLabel(a)} />
          {hasEvent && (
            <>
              <View style={{ height: 10 }} />
              <MetaRow icon="sparkles-outline" label="Pelaksanaan" value={formatDate(a.eventDate!)} />
            </>
          )}
        </WargaCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <Icon name={icon} size={20} color={colors.emerald} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={wargaText.labelCaps}>{label}</Text>
        <Text style={[wargaText.sectionTitle, { fontSize: 14 }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  appbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  image: { width: '100%', aspectRatio: 16 / 10, borderRadius: 16, marginBottom: 16, backgroundColor: colors.emeraldSoft },
  title: { fontSize: 22, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  content: { fontSize: 15, lineHeight: 24, color: colors.textSecondary },
});
