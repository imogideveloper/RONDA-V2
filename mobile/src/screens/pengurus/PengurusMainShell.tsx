// Port dari lib/pages/shell/main_shell.dart — shell Ketua/Bendahara (5 tab).
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../../components/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, wargaColors } from '../../config/theme';
import { Profile, RtUnit } from '../../types/models';
import { PengurusHomeScreen } from './PengurusHomeScreen';
import { PengurusIuranScreen } from './PengurusIuranScreen';
import { PengurusKasScreen } from './PengurusKasScreen';
import { PengurusPengumumanScreen } from './PengurusPengumumanScreen';
import { PengurusProfilScreen } from './PengurusProfilScreen';

export type IuranKetuaMode = 'semua' | 'tagih' | 'verifikasi';
export type OfficerTabNav = (index: number, iuranMode?: IuranKetuaMode) => void;

interface Props {
  profile: Profile;
  rt: RtUnit;
  onLogout: () => void;
  onChanged: () => void;
}

const TABS = [
  { key: 'home', label: 'Beranda', icon: 'home' as const },
  { key: 'iuran', label: 'Iuran', icon: 'wallet' as const },
  { key: 'kas', label: 'Kas', icon: 'cash' as const },
  { key: 'info', label: 'Info', icon: 'megaphone' as const },
  { key: 'profil', label: 'Profil', icon: 'person' as const },
];

export function PengurusMainShell({ profile, rt, onLogout, onChanged }: Props) {
  const [index, setIndex] = useState(0);
  const [iuranMode, setIuranMode] = useState<IuranKetuaMode>('semua');

  const goTab: OfficerTabNav = (i, mode) => {
    setIndex(i);
    if (i === 1) setIuranMode(mode ?? 'semua');
  };

  return (
    <View style={styles.root}>
      <View style={{ flex: 1 }}>
        {index === 0 && <PengurusHomeScreen profile={profile} rt={rt} onNavigateTab={goTab} />}
        {index === 1 && <PengurusIuranScreen profile={profile} rt={rt} mode={iuranMode} onBack={() => goTab(0)} />}
        {index === 2 && <PengurusKasScreen profile={profile} rt={rt} />}
        {index === 3 && <PengurusPengumumanScreen profile={profile} rt={rt} onChanged={onChanged} />}
        {index === 4 && <PengurusProfilScreen profile={profile} rt={rt} onLogout={onLogout} onProfileUpdated={onChanged} />}
      </View>
      <SafeAreaView edges={['bottom']} style={styles.navSafe}>
        <View style={styles.nav}>
          {TABS.map((t, i) => {
            const active = i === index;
            return (
              <Pressable key={t.key} style={styles.navItem} onPress={() => goTab(i)}>
                <Icon name={active ? t.icon : (`${t.icon}-outline` as any)} size={24} color={active ? colors.emerald : colors.textHint} />
                <Text style={[styles.navLabel, active && { color: colors.emerald, fontWeight: '700' }]}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
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
});
