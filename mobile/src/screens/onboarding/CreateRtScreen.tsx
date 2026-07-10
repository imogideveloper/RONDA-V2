// Port dari lib/pages/onboarding/create_rt_page.dart
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { alertDialog } from '../../lib/dialog';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { PrimaryButton } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateRt'>;

export default function CreateRtScreen({ route, navigation }: Props) {
  const { onSuccess } = route.params ?? {};
  const toast = useToast();
  const [name, setName] = useState('');
  const [rtNumber, setRtNumber] = useState('');
  const [rwNumber, setRwNumber] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (name.trim() === '') return toast.error('Nama RT wajib diisi');
    if (rtNumber.trim() === '') return toast.error('No. RT wajib diisi');
    setLoading(true);
    try {
      const result = await rtService.createRt({
        name: name.trim(),
        rtNumber: rtNumber.trim(),
        rwNumber: rwNumber.trim() === '' ? null : rwNumber.trim(),
        address: address.trim() === '' ? null : address.trim(),
      });
      alertDialog('RT Berhasil Dibuat 🎉', `Kode undangan: ${result.invite_code ?? '-'}`, () => {
        onSuccess?.();
        navigation.goBack();
      });
    } catch (e: any) {
      toast.error(String(e?.message ?? 'Gagal membuat RT'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Buat RT Baru" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Field label="Nama RT / Lingkungan" value={name} onChange={setName} hint="RT 05 Perumahan Mawar" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}><Field label="No. RT" value={rtNumber} onChange={setRtNumber} hint="05" keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Field label="No. RW" value={rwNumber} onChange={setRwNumber} hint="03" keyboardType="number-pad" /></View>
          </View>
          <Field label="Alamat" value={address} onChange={setAddress} hint="Jl. Melati No. 1" />
          <View style={{ height: 28 }} />
          <PrimaryButton label="Buat RT & Jadi Ketua RT" onPress={submit} loading={loading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
  keyboardType?: 'default' | 'number-pad';
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} placeholder={hint} placeholderTextColor={colors.textHint} keyboardType={keyboardType} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 24 },
  label: { fontWeight: '600', fontSize: 14, color: colors.textPrimary, marginBottom: 8 },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textPrimary },
});
