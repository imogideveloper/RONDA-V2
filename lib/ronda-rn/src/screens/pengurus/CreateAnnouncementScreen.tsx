// Port dari lib/pages/pengumuman/create_announcement_page.dart
import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius, wargaColors } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { PrimaryButton } from '../../components/Card';
import { wargaText } from '../../components/warga/wargaUi';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import { storageService, PickedImage } from '../../services/storageService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAnnouncement'>;

export default function CreateAnnouncementScreen({ route, navigation }: Props) {
  const { rtId, onCreated } = route.params;
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const file = await storageService.pickImageFromGallery();
    if (file) setImage(file);
  };

  const submit = async () => {
    if (title.trim() === '') return toast.error('Judul wajib');
    if (content.trim() === '') return toast.error('Isi wajib');
    setSaving(true);
    try {
      let imageUrl: string | undefined;
      if (image) imageUrl = await storageService.uploadAnnouncementImage(rtId, image);
      let parsedDate: Date | null = null;
      if (eventDate.trim() !== '') {
        const d = new Date(eventDate.trim());
        if (!isNaN(d.getTime())) parsedDate = d;
      }
      await rtService.createAnnouncement({
        rtId,
        title: title.trim(),
        content: content.trim(),
        isPinned: pinned,
        eventDate: parsedDate,
        imageUrl,
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

          <Text style={styles.label}>Tanggal kegiatan (opsional)</Text>
          <TextInput style={styles.input} value={eventDate} onChangeText={setEventDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textHint} />

          <Text style={styles.label}>Foto lokasi / bukti (opsional)</Text>
          <Pressable onPress={pickImage} style={[styles.imageBox, { height: image ? 180 : 120 }]}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="image-outline" size={40} color={wargaColors.primaryGreen} />
                <Text style={styles.imageHint}>Ketuk untuk tambah foto</Text>
              </View>
            )}
          </Pressable>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: wargaColors.bgColor },
  scroll: { padding: 16, paddingBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginTop: 14, marginBottom: 8 },
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
