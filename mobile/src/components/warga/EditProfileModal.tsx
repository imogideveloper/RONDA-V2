// Port dari lib/widgets/warga_edit_profile_sheet.dart (bottom sheet → Modal)
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, wargaColors } from '../../config/theme';
import { PrimaryButton } from '../Card';
import { DateField } from '../DateField';
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
  initialNik?: string | null;
  initialBirthPlace?: string | null;
  initialBirthDate?: string | null;
  initialOccupation?: string | null;
  initialGender?: string | null;
  initialReligion?: string | null;
  initialMaritalStatus?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProfileModal({
  visible,
  userId,
  initialName,
  initialPhone,
  initialAvatarUrl,
  initialNik,
  initialBirthPlace,
  initialBirthDate,
  initialOccupation,
  initialGender,
  initialReligion,
  initialMaritalStatus,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(initialAvatarUrl);
  const [local, setLocal] = useState<PickedImage | null>(null);
  const [nik, setNik] = useState(initialNik ?? '');
  const [birthPlace, setBirthPlace] = useState(initialBirthPlace ?? '');
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? '');
  const [occupation, setOccupation] = useState(initialOccupation ?? '');
  const [gender, setGender] = useState(initialGender ?? '');
  const [religion, setReligion] = useState(initialReligion ?? '');
  const [maritalStatus, setMaritalStatus] = useState(initialMaritalStatus ?? '');
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
      await authService.updateMyProfile(name.trim(), phone.trim(), url, {
        nik,
        birthPlace,
        birthDate,
        occupation,
        gender,
        religion,
        maritalStatus,
      });
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
            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
                  <Text style={styles.link}>Pilih dari Galeri</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Nama lengkap</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nama lengkap" placeholderTextColor={colors.textHint} />

            <Text style={styles.label}>Nomor HP</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Nomor HP" placeholderTextColor={colors.textHint} />

            <Text style={styles.dataDiriTitle}>Data Diri untuk Surat</Text>
            <Text style={styles.dataDiriHint}>Diisi sekali — dipakai otomatis saat mengajukan surat.</Text>

            <Text style={styles.label}>NIK</Text>
            <TextInput style={styles.input} value={nik} onChangeText={setNik} keyboardType="number-pad" placeholder="16 digit NIK" placeholderTextColor={colors.textHint} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Tempat Lahir</Text>
                <TextInput style={styles.input} value={birthPlace} onChangeText={setBirthPlace} placeholder="Contoh: Bogor" placeholderTextColor={colors.textHint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Tanggal Lahir</Text>
                <DateField value={birthDate} onChange={setBirthDate} placeholder="12 Mei 1990" />
              </View>
            </View>

            <Text style={styles.label}>Pekerjaan</Text>
            <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Contoh: Wiraswasta" placeholderTextColor={colors.textHint} />

            <Text style={styles.label}>Jenis Kelamin</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['Laki-laki', 'Perempuan'].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                >
                  <Text style={[styles.genderText, gender === g && { color: '#fff' }]}>{g}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Agama</Text>
                <TextInput style={styles.input} value={religion} onChangeText={setReligion} placeholder="Contoh: Islam" placeholderTextColor={colors.textHint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Status</Text>
                <TextInput style={styles.input} value={maritalStatus} onChangeText={setMaritalStatus} placeholder="Kawin / Belum Kawin" placeholderTextColor={colors.textHint} />
              </View>
            </View>

            <View style={{ height: 20 }} />
            {saving ? (
              <View style={styles.savingBtn}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <PrimaryButton label="Simpan Perubahan" onPress={save} />
            )}
            </ScrollView>
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
  dataDiriTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 22 },
  dataDiriHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  genderBtn: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  genderBtnActive: { backgroundColor: wargaColors.primaryGreen, borderColor: wargaColors.primaryGreen },
  genderText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
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
