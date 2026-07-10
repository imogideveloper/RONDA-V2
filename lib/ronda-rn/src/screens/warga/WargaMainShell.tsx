// Port dari lib/pages/shell/warga_main_shell.dart
// Bottom nav warga: Beranda, Iuran, Info, Profil. (Iuran/Info/Profil = placeholder tahap ini.)
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, wargaColors } from '../../config/theme';
import { Profile, RtUnit } from '../../types/models';
import { WargaHomeScreen } from './WargaHomeScreen';
import { WargaInfoScreen } from './WargaInfoScreen';
import { WargaIuranScreen } from './WargaIuranScreen';
import { WargaProfilScreen } from './WargaProfilScreen';

interface Props {
  profile: Profile;
  rt: RtUnit;
  onLogout: () => void;
  onChanged: () => void;
}

const TABS = [
  { key: 'home', label: 'Beranda', icon: 'home' as const },
  { key: 'iuran', label: 'Iuran', icon: 'wallet' as const },
  { key: 'info', label: 'Info', icon: 'megaphone' as const },
  { key: 'profil', label: 'Profil', icon: 'person' as const },
];

export function WargaMainShell({ profile, rt, onLogout, onChanged }: Props) {
  const [index, setIndex] = useState(0);

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        {index === 0 ? (
          <WargaHomeScreen profile={profile} rt={rt} onNavigateTab={setIndex} onRtSwitched={onChanged} />
        ) : index === 1 ? (
          <WargaIuranScreen profile={profile} rt={rt} onRtSwitched={onChanged} />
        ) : index === 2 ? (
          <WargaInfoScreen profile={profile} rt={rt} onAnnouncementRead={onChanged} />
        ) : (
          <WargaProfilScreen profile={profile} rt={rt} onLogout={onLogout} onProfileUpdated={onChanged} />
        )}
      </View>
      <SafeAreaView edges={['bottom']} style={styles.navSafe}>
        <View style={styles.nav}>
          {TABS.map((t, i) => {
            const active = i === index;
            return (
              <Pressable key={t.key} style={styles.navItem} onPress={() => setIndex(i)}>
                <Ionicons
                  name={active ? t.icon : (`${t.icon}-outline` as any)}
                  size={24}
                  color={active ? colors.emerald : colors.textHint}
                />
                <Text style={[styles.navLabel, active && { color: colors.emerald, fontWeight: '700' }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

function Placeholder({ label, onLogout }: { label: string; onLogout?: () => void }) {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="construct-outline" size={40} color={colors.textHint} />
      <Text style={styles.placeholderText}>Tab "{label}" akan diport di tahap berikutnya.</Text>
      {onLogout ? (
        <Text style={styles.logout} onPress={onLogout}>
          Keluar
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: wargaColors.bgColor },
  navSafe: { backgroundColor: colors.surface },
  nav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 6,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navLabel: { fontSize: 11, color: colors.textHint },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  placeholderText: { color: colors.textSecondary, textAlign: 'center' },
  logout: { color: colors.emerald, fontWeight: '600', marginTop: 8, padding: 8 },
});
