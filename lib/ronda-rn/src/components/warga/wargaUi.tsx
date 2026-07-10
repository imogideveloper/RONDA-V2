// UI kit bersama warga — port WargaBerandaText / WargaCard / StatusChip / wargaCardDecoration.
import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { colors, radius } from '../../config/theme';

export const wargaText = {
  name: { fontSize: 21, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.3 } as TextStyle,
  sectionTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary, letterSpacing: -0.2 } as TextStyle,
  greeting: { fontSize: 13, color: colors.textSecondary } as TextStyle,
  labelCaps: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.55,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  } as TextStyle,
};

export function wargaCardStyle(r = 16): ViewStyle {
  return {
    backgroundColor: colors.surface,
    borderRadius: r,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  };
}

export function WargaCard({
  children,
  style,
  onPress,
  radius: r = 16,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  radius?: number;
}) {
  const content = <View style={[wargaCardStyle(r), { padding: 16 }, style]}>{children}</View>;
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '22' }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontSize: 12, fontWeight: '700' },
});

export { radius };
