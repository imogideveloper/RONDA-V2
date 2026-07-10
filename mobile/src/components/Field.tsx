// Input bergaya sesuai inputDecorationTheme di app_theme.dart
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Icon, type IconName } from './Icon';
import { colors, radius } from '../config/theme';

interface Props extends TextInputProps {
  label?: string;
  hint?: string;
  leftIcon?: IconName;
  prefixText?: string;
  rightIcon?: IconName;
  onRightPress?: () => void;
}

export function Field({
  label,
  hint,
  leftIcon,
  prefixText,
  rightIcon,
  onRightPress,
  style,
  ...rest
}: Props) {
  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.box}>
        {leftIcon ? (
          <Icon name={leftIcon} size={20} color={colors.emerald} style={{ marginRight: 8 }} />
        ) : null}
        {prefixText ? <Text style={styles.prefix}>{prefixText}</Text> : null}
        <TextInput
          placeholderTextColor={colors.textHint}
          style={[styles.input, style]}
          {...rest}
        />
        {rightIcon ? (
          <Pressable onPress={onRightPress} hitSlop={8}>
            <Icon name={rightIcon} size={20} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: 8 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  prefix: { fontSize: 16, fontWeight: '700', color: colors.emeraldDark, marginRight: 2 },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary, paddingVertical: 14 },
});
