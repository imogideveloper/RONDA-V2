// App bar bundar khas halaman warga (port pola AppBar di *_page.dart).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../config/theme';
import { wargaText } from './wargaUi';

export function WargaAppBar({ title }: { title: string }) {
  const navigation = useNavigation();
  return (
    <View style={styles.bar}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
        <Ionicons name="chevron-back" size={18} color={colors.textPrimary} />
      </Pressable>
      <Text style={[wargaText.sectionTitle, styles.title]}>{title}</Text>
      <View style={{ width: 34 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, textAlign: 'center' },
});
