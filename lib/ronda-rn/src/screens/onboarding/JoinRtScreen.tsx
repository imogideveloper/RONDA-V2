// Port dari lib/pages/onboarding/join_rt_page.dart
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../../config/theme';
import { WargaAppBar } from '../../components/warga/WargaAppBar';
import { PrimaryButton } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { rtService } from '../../services/rtService';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinRt'>;

export default function JoinRtScreen({ route, navigation }: Props) {
  const { additionalMembership, onSuccess } = route.params ?? {};
  const toast = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.trim().length < 4) return toast.error('Kode undangan tidak valid');
    setLoading(true);
    try {
      await rtService.joinRt(code.trim());
      onSuccess?.();
      navigation.goBack();
    } catch (e: any) {
      toast.error(String(e?.message ?? 'Gagal gabung RT'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <WargaAppBar title="Gabung RT" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <Text style={styles.desc}>
          {additionalMembership
            ? 'Punya rumah di RT lain? Masukkan kode undangan Ketua RT lokasi tersebut (mis. Cigombong & Jakarta).'
            : 'Masukkan kode undangan dari Ketua RT jika nomor Anda belum di-import.'}
        </Text>
        <TextInput
          style={styles.code}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          autoCapitalize="characters"
          textAlign="center"
          placeholder="XXXXXX"
          placeholderTextColor={colors.textHint}
        />
        <View style={{ flex: 1 }} />
        <PrimaryButton label={additionalMembership ? 'Gabung RT' : 'Gabung sebagai Warga'} onPress={submit} loading={loading} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  body: { flex: 1, padding: 24 },
  desc: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  code: { marginTop: 24, fontSize: 28, fontWeight: '800', letterSpacing: 6, color: colors.emeraldDark, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surface, paddingVertical: 16 },
});
