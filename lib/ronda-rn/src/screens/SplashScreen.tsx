// Port dari lib/pages/splash_page.dart
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, softShadow } from '../config/theme';
import { authService } from '../services/authService';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 900, useNativeDriver: true }).start();
    let cancelled = false;
    (async () => {
      const [loggedIn] = await Promise.all([
        authService.isLoggedIn(),
        new Promise((r) => setTimeout(r, 1600)),
      ]);
      if (cancelled) return;
      navigation.replace(loggedIn ? 'Home' : 'Login');
    })();
    return () => {
      cancelled = true;
    };
  }, [fade, navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
        <View style={styles.logo}>
          <Ionicons name="business" size={44} color="#fff" />
        </View>
        <Text style={styles.title}>RT OS</Text>
        <Text style={styles.subtitle}>Indonesia</Text>
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.emerald} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.emeraldMuted, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  title: { fontSize: 32, fontWeight: '800', color: colors.emeraldDark, letterSpacing: 1, marginTop: 24 },
  subtitle: { fontSize: 16, color: colors.textSecondary, letterSpacing: 4 },
});
