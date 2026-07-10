// Port dari lib/widgets/warga_edit_profile_sheet.dart (bottom sheet → Modal)
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, wargaColors } from '../../config/theme';
import { PrimaryButton } from '../Card';
import { WargaProfileAvatar } from './DashboardWidgets';
import { useToast } from '../Toast';
import { authService } from '../../services/authService';
import { storageService, PickedImage } from '../../services/storageService';
import { wargaText } from './wargaUi';

interface Props {
  visible: boolean;
  userId: string;
  initialName: string;
  initialPhone: string;
  initialAvatarUrl?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({
  visible,
  userId,
  initialName,
  initialPhone,
  initialAvatarUrl,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(initialAvatarUrl);
  const [local, setLocal] = useState<PickedImage | null>(null);
  const [saving, setSaving] = useState(false);

  const pick = async (from: 'gallery' | 'camera') => {
    const file =
      from === 'gallery'
        ? await storageService.pickImageFromGallery()
        : await storageService.pickImageFromCamera();
    if (file) {
      setLocal(file);
      setAvatarUrl(null);
    }
  };

  const save = async () => {
    if (name.trim() === '') {
      toast.error('Nama wajib diisi');
      return;
    }
    setSaving(true);
    try {
      let url = avatarUrl ?? undefined;
      if (local) url = await storageService.uploadProfileAvatar(userId, local);
      await authService.updateMyProfile(name.trim(), phone.trim(), url);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(`Gagal menyimpan: ${String(e?.message ?? e)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.handle} />
            <Text style={[wargaText.sectionTitle, { fontSize: 18, textAlign: 'center' }]}>Edit Profil</Text>
            <Text style={[wargaText.greeting, { textAlign: 'center', marginTop: 8 }]}>
              Ubah data dan foto profil Anda
            </Text>

            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <WargaProfileAvatar
                imageUrl={local?.uri ?? avatarUrl}
                fullName={name || initialName}
                radius={48}
                showCameraBadge
                onTap={() => pick('gallery')}
              />
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Pressable onPress={() => pick('gallery')}>
                  <Text style={styles.link}>Galeri</Text>
                </Pressable>
                <Pressable onPress={() => pick('camera')}>
                  <Text style={styles.link}>Kamera</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Nama lengkap</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama lengkap" placeholderTextColor={colors.textHint} />

            <Text style={styles.label}>Nomor HP</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Nomor HP" placeholderTextColor={colors.textHint} />

            <View style={{ height: 20 }} />
            {saving ? (
              <View style={styles.savingBtn}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <PrimaryButton label="Simpan Perubahan" onPress={save} />
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 16 },
  link: { color: wargaColors.primaryGreen, fontWeight: '600' },
  label: { fontSize: 13, color: colors.textSecondary, marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  savingBtn: {
    backgroundColor: wargaColors.primaryGreen,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
});
