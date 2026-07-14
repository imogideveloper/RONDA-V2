// Direktori Layanan Warga — hero + pencarian + 8 kategori.
// Bagian "Populer" belum dibuat (menyusul).
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Icon } from '../../components/Icon';
import { colors, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { useToast } from '../../components/Toast';
import {
  LAYANAN_CATEGORIES,
  LayananCategory,
  LayananService,
  layananTotal,
  searchLayanan,
} from '../../lib/layananDirektori';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'WargaLayanan'>;

export default function WargaLayananScreen(_props: Props) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<LayananCategory | null>(null);

  const total = layananTotal();
  const results = useMemo(() => searchLayanan(query), [query]);
  const searching = query.trim() !== '';

  // Semua layanan masih "under construction" — beri info, jangan buka aksi.
  const underConstruction = (name?: string) =>
    toast.success(`🚧 ${name ? `${name} — ` : ''}Fitur dalam pengembangan, segera hadir`);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Layanan Warga" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Hero */}
        <View style={styles.hero}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroLabelRow}>
              <Icon name="call" size={13} color="#FECACA" />
              <Text style={styles.heroLabel}>DIREKTORI LAYANAN</Text>
            </View>
            <Text style={styles.heroBig}>{LAYANAN_CATEGORIES.length} Kategori</Text>
            <Text style={styles.heroSub}>{total} layanan tersedia untuk Anda</Text>
          </View>
          <View style={styles.heroIcon}>
            <Icon name="grid-outline" size={26} color="#fff" />
          </View>
        </View>

        {/* Pencarian */}
        <View style={styles.searchBox}>
          <Icon name="search" size={18} color={colors.textHint} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari layanan..."
            placeholderTextColor={colors.textHint}
            value={query}
            onChangeText={setQuery}
          />
          {searching && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Icon name="close-circle-outline" size={18} color={colors.textHint} />
            </Pressable>
          )}
        </View>

        {searching ? (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 22, marginBottom: 14 }]}>
              {results.length > 0 ? `${results.length} hasil untuk "${query.trim()}"` : `Tidak ada hasil untuk "${query.trim()}"`}
            </Text>
            {results.map((s, i) => (
              <ServiceRow key={`${s.name}-${i}`} service={s} color={s.category.color} icon={s.category.icon} onTap={() => underConstruction(s.name)} />
            ))}
          </>
        ) : (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Kategori</Text>
              <Text style={styles.sectionCount}>{LAYANAN_CATEGORIES.length} kategori</Text>
            </View>
            <View style={styles.grid}>
              {LAYANAN_CATEGORIES.map((c) => (
                <Pressable key={c.key} style={styles.gridItem} onPress={() => setSelected(c)}>
                  <View style={[styles.tile, { backgroundColor: c.color }]}>
                    <Icon name={c.icon} size={26} color="#fff" />
                    <View style={styles.tileBadge}>
                      <Text style={styles.tileBadgeText}>{c.services.length}</Text>
                    </View>
                  </View>
                  <Text style={styles.tileLabel} numberOfLines={1}>{c.label}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Detail kategori */}
      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            {selected && (
              <>
                <View style={styles.sheetHeader}>
                  <View style={[styles.sheetIcon, { backgroundColor: selected.color }]}>
                    <Icon name={selected.icon} size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetTitle}>{selected.label}</Text>
                    <Text style={styles.sheetSub}>Segera hadir</Text>
                  </View>
                  <Pressable onPress={() => setSelected(null)} hitSlop={8}>
                    <Icon name="close-circle-outline" size={24} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <View style={styles.ucBox}>
                  <View style={[styles.ucIcon, { backgroundColor: selected.color + '1A' }]}>
                    <Icon name="construct-outline" size={34} color={selected.color} />
                  </View>
                  <Text style={styles.ucTitle}>Dalam Pengembangan</Text>
                  <Text style={styles.ucSub}>
                    Layanan {selected.label} sedang kami siapkan dan akan segera tersedia.
                    Terima kasih atas kesabaran Anda 🙏
                  </Text>
                  <View style={styles.ucBadge}>
                    <Text style={styles.ucBadgeText}>{selected.services.length} layanan direncanakan</Text>
                  </View>
                </View>
                <View style={{ height: 8 }} />
              </>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ServiceRow({
  service,
  color,
  icon,
  onTap,
}: {
  service: LayananService;
  color: string;
  icon: string;
  onTap: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onTap}>
      <View style={[styles.rowIcon, { backgroundColor: color + '1A' }]}>
        <Icon name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{service.name}</Text>
        <Text style={styles.rowSub}>{service.subtitle}</Text>
      </View>
      {service.tag && (
        <View style={styles.tagPill}>
          <Text style={styles.tagText}>{service.tag}</Text>
        </View>
      )}
      <Icon name="chevron-forward" size={18} color={colors.textHint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B91C1C',
    borderRadius: 18,
    padding: 18,
  },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  heroLabel: { fontSize: 11, fontWeight: '700', color: '#FECACA', letterSpacing: 0.6 },
  heroBig: { fontSize: 26, fontWeight: '800', color: '#fff' },
  heroSub: { fontSize: 12, color: '#FCA5A5', marginTop: 4 },
  heroIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, padding: 0 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionCount: { fontSize: 12, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  gridItem: { width: '23%', alignItems: 'center' },
  tile: { width: '100%', aspectRatio: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileBadgeText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  tileLabel: { fontSize: 11, fontWeight: '600', color: colors.textPrimary, marginTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tagPill: { backgroundColor: wargaColors.lightRed, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 9, fontWeight: '700', color: wargaColors.dangerRed, letterSpacing: 0.3 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  sheetIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  sheetSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  ucBox: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 18 },
  ucIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  ucTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  ucSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19, marginTop: 8 },
  ucBadge: { marginTop: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  ucBadgeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
});
