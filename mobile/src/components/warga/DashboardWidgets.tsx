// Port dari lib/widgets/warga_dashboard_widgets.dart + WargaProfileAvatar/PageHeader/MenuTile
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '../Icon';
import { colors, wargaColors } from '../../config/theme';
import { wargaCardStyle, wargaText } from './wargaUi';

export function wargaInitialsFromName(name: string): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'W';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
}

export function WargaProfileAvatar({
  imageUrl,
  fullName,
  radius = 26,
  onTap,
  showCameraBadge = false,
}: {
  imageUrl?: string | null;
  fullName: string;
  radius?: number;
  onTap?: () => void;
  showCameraBadge?: boolean;
}) {
  const hasUrl = imageUrl != null && imageUrl.trim().length > 0;
  const size = radius * 2;
  const avatar = (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        {hasUrl ? (
          <Image source={{ uri: imageUrl! }} style={{ width: '100%', height: '100%' }} />
        ) : (
          <Text style={[styles.avatarInitials, { fontSize: radius * 0.62 }]}>
            {wargaInitialsFromName(fullName)}
          </Text>
        )}
      </View>
      {showCameraBadge && (
        <View style={styles.cameraBadge}>
          <Icon name="camera" size={14} color="#fff" />
        </View>
      )}
    </View>
  );
  if (!onTap) return avatar;
  return (
    <Pressable onPress={onTap} style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}>
      {avatar}
    </Pressable>
  );
}

export function WargaPageHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={[wargaText.greeting, { fontSize: 14, marginTop: 4 }]}>{subtitle}</Text> : null}
      </View>
      {trailing}
    </View>
  );
}

export function WargaProfileHeaderCard({
  fullName,
  phone,
  roleLabel,
  avatarUrl,
  onEditProfile,
}: {
  fullName: string;
  phone: string;
  roleLabel: string;
  avatarUrl?: string | null;
  onEditProfile?: () => void;
}) {
  return (
    <View style={styles.profileCard}>
      <WargaProfileAvatar
        imageUrl={avatarUrl}
        fullName={fullName}
        radius={32}
        onTap={onEditProfile}
        showCameraBadge={onEditProfile != null}
      />
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.profileName}>{fullName}</Text>
        <View style={styles.roleChip}>
          <Icon name="person" size={14} color="#fff" />
          <Text style={styles.roleChipText}>{roleLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Icon name="call" size={14} color="rgba(255,255,255,0.85)" />
          <Text style={styles.profilePhone}>{phone}</Text>
        </View>
      </View>
    </View>
  );
}

export function WargaMembershipCard({
  displayLabel,
  subtitle,
  isActive,
  onTap,
}: {
  displayLabel: string;
  subtitle: string;
  isActive: boolean;
  onTap?: () => void;
}) {
  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [
        wargaCardStyle(16),
        styles.membership,
        {
          borderColor: isActive ? wargaColors.primaryGreen : colors.border,
          borderWidth: isActive ? 1.5 : 1,
          backgroundColor: isActive ? '#ECFDF5' : colors.surface,
        },
        pressed && onTap ? { opacity: 0.9 } : null,
      ]}
    >
      <View style={styles.membershipIcon}>
        <Icon name="home" size={22} color={wargaColors.primaryGreen} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.membershipLabel}>{displayLabel}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]}>{subtitle}</Text>
      </View>
      <Icon
        name={isActive ? 'checkmark-circle' : 'chevron-forward'}
        size={22}
        color={isActive ? wargaColors.primaryGreen : colors.textSecondary}
      />
    </Pressable>
  );
}

export function WargaAccessRow({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={styles.accessRow}>
      <Text style={styles.accessLabel}>{label}</Text>
      <View
        style={[
          styles.accessBadge,
          { backgroundColor: active ? wargaColors.lightGreen : 'rgba(229,231,235,0.4)' },
        ]}
      >
        <Text style={[styles.accessBadgeText, { color: active ? wargaColors.primaryGreen : colors.textSecondary }]}>
          {active ? 'Aktif' : 'Tidak'}
        </Text>
      </View>
    </View>
  );
}

export function WargaInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[wargaText.greeting, { fontSize: 14, flex: 1 }]}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function WargaMenuTile({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onTap,
}: {
  icon: IconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  onTap: () => void;
}) {
  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [wargaCardStyle(16), styles.menuTile, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={22} color={iconColor} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={[wargaText.greeting, { fontSize: 12 }]}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: wargaColors.accentGreen,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { fontWeight: '600', color: wargaColors.primaryGreen },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    padding: 4,
    backgroundColor: wargaColors.primaryGreen,
    borderRadius: 999,
  },
  pageTitle: { fontSize: 22, fontWeight: '600', color: colors.textPrimary },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 18,
    backgroundColor: wargaColors.primaryGreen,
    overflow: 'hidden',
  },
  profileName: { fontSize: 20, fontWeight: '600', color: '#fff' },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 8,
  },
  roleChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  profilePhone: { color: 'rgba(255,255,255,0.88)', fontSize: 13, marginLeft: 6, flex: 1 },

  membership: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 8 },
  membershipIcon: { padding: 10, backgroundColor: wargaColors.lightGreen, borderRadius: 10 },
  membershipLabel: { fontWeight: '600', fontSize: 15, color: colors.textPrimary },

  accessRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  accessLabel: { flex: 1, fontSize: 14, color: colors.textPrimary },
  accessBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  accessBadgeText: { fontSize: 11, fontWeight: '600' },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  infoValue: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },

  menuTile: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10 },
  menuIcon: { padding: 10, borderRadius: 10 },
  menuTitle: { fontWeight: '500', fontSize: 15, color: colors.textPrimary },
});
