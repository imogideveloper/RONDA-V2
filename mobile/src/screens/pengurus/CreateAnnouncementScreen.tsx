// Port dari lib/pages/pengumuman/create_announcement_page.dart
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { ANNOUNCEMENT_TEMPLATES, AnnouncementTemplate } from '../../lib/announcementTemplates';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { PrimaryButton } from '../../components/Card';
import { wargaText } from '../../components/warga/wargaUi';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAnnouncement'>;

export default function CreateAnnouncementScreen({ route, navigation }: Props) {
  const { rtId, onCreated } = route.params;
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hari, setHari] = useState('');
  const [tanggal, setTanggal] = useState('');
  const [jam, setJam] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const applyTemplate = (t: AnnouncementTemplate) => {
    setTitle(t.title);
    setContent(t.content);
    if (t.suggestPinned) setPinned(true);
    setPickerOpen(false);
  };

  const submit = async () => {
    if (title.trim() === '') return toast.error('Judul wajib diisi');
    if (content.trim() === '') return toast.error('Isi pengumuman wajib diisi');
    if (hari.trim() === '') return toast.error('Hari wajib diisi');
    if (tanggal.trim() === '') return toast.error('Tanggal wajib diisi');
    if (jam.trim() === '') return toast.error('Jam wajib diisi');
    if (lokasi.trim() === '') return toast.error('Lokasi wajib diisi');
    setSaving(true);
    try {
      let parsedDate: Date | null = null;
      const d = new Date(tanggal.trim());
      if (!isNaN(d.getTime())) parsedDate = d;

      // Gabungkan detail jadwal (wajib) ke bagian atas isi pengumuman.
      const jadwal =
        `🗓️ Hari/Tanggal: ${hari.trim()}, ${tanggal.trim()}\n` +
        `⏰ Jam: ${jam.trim()}\n` +
        `📍 Lokasi: ${lokasi.trim()}`;
      const fullContent = `${jadwal}\n\n${content.trim()}`;

      await rtService.createAnnouncement({
        rtId,
        title: title.trim(),
        content: fullContent,
        isPinned: pinned,
        eventDate: parsedDate,
      });
      toast.success('Pengumuman dipublikasikan');
      onCreated?.();
      navigation.goBack();
    } catch (e: any) {
      toast.error(`Gagal: ${String(e?.message ?? e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Buat Pengumuman" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Pilih judul (template)</Text>
          <Pressable style={styles.dropdown} onPress={() => setPickerOpen(true)}>
            <Icon name="document-text-outline" size={18} color={wargaColors.primaryGreen} />
            <Text style={[styles.dropdownText, title === '' && { color: colors.textHint }]} numberOfLines={1}>
              {title === '' ? 'Pilih judul pengumuman…' : title}
            </Text>
            <Icon name="chevron-down" size={18} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.helperSmall}>Pilih dari daftar — judul & isi terisi otomatis, lalu bisa diedit.</Text>

          <Text style={styles.label}>Judul</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Contoh: Kerja Bakti Lingkungan" placeholderTextColor={colors.textHint} />

          <Text style={styles.label}>Isi pengumuman</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={content}
            onChangeText={setContent}
            multiline
            placeholder="Jelaskan kegiatan, lokasi, dan hal yang perlu disiapkan warga…"
            placeholderTextColor={colors.textHint}
          />

          <Text style={styles.label}>Detail Kegiatan (wajib)</Text>
          <Text style={styles.helperSmall}>Otomatis ditampilkan di bagian atas pengumuman.</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Hari</Text>
              <TextInput style={styles.input} value={hari} onChangeText={setHari} placeholder="Contoh: Minggu" placeholderTextColor={colors.textHint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.subLabel}>Tanggal</Text>
              <TextInput style={styles.input} value={tanggal} onChangeText={setTanggal} placeholder="Contoh: 20 Juli 2026" placeholderTextColor={colors.textHint} />
            </View>
          </View>
          <Text style={styles.subLabel}>Jam</Text>
          <TextInput style={styles.input} value={jam} onChangeText={setJam} placeholder="Contoh: 07.00 WIB s.d. selesai" placeholderTextColor={colors.textHint} />
          <Text style={styles.subLabel}>Lokasi</Text>
          <TextInput style={styles.input} value={lokasi} onChangeText={setLokasi} placeholder="Contoh: Lapangan RT / Balai Warga" placeholderTextColor={colors.textHint} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[wargaText.sectionTitle, { fontSize: 15 }]}>Tandai penting (pin)</Text>
              <Text style={[wargaText.greeting, { fontSize: 12 }]}>Muncul di badge notifikasi Home</Text>
            </View>
            <Switch value={pinned} onValueChange={setPinned} trackColor={{ true: wargaColors.primaryGreen }} />
          </View>

          <View style={{ height: 24 }} />
          <PrimaryButton label={saving ? 'Menyimpan...' : 'Publikasikan'} onPress={submit} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} />
          <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={[wargaText.sectionTitle, { textAlign: 'center', marginBottom: 4 }]}>Pilih Judul Pengumuman</Text>
            <Text style={[styles.helperSmall, { textAlign: 'center', marginBottom: 8 }]}>Isi akan terisi otomatis sesuai judul.</Text>
            <ScrollView style={{ maxHeight: 420 }}>
              {ANNOUNCEMENT_TEMPLATES.map((t) => (
                <Pressable key={t.title} style={styles.templateRow} onPress={() => applyTemplate(t)}>
                  <Icon name="megaphone-outline" size={18} color={wargaColors.primaryGreen} />
                  <Text style={styles.templateText}>{t.title}</Text>
                  <Icon name="chevron-forward" size={16} color={colors.textSecondary} />
                </Pressable>
              ))}
              <Pressable style={styles.templateRow} onPress={() => { setTitle(''); setContent(''); setPickerOpen(false); }}>
                <Icon name="create-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.templateText, { color: colors.textSecondary }]}>Judul lain (tulis sendiri)</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 14, marginBottom: 8 },
  subLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  helperSmall: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  modalHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  templateText: { flex: 1, fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  imageBox: {
    width: '100%',
    backgroundColor: wargaColors.lightGreen,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imageHint: { color: wargaColors.primaryGreen, fontWeight: '600', marginTop: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
});
