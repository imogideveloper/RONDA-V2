// Port dari lib/models/warga_directory_entry.dart
import { Profile, profileIsKetua } from './models';

type Row = Record<string, any>;

/** Anggota terdaftar atau warga hasil import (belum punya akun). */
export interface WargaDirectoryEntry {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  blokRumah: string | null;
  role: string;
  isPendingImport: boolean;
  isKetua: boolean;
  avatarUrl: string | null;
}

export function directoryFromProfile(p: Profile): WargaDirectoryEntry {
  return {
    id: p.id,
    fullName: p.fullName,
    phone: p.phone,
    email: null,
    blokRumah: null,
    role: p.role,
    isPendingImport: false,
    isKetua: profileIsKetua(p),
    avatarUrl: p.avatarUrl ?? null,
  };
}

export function directoryFromRegistry(map: Row): WargaDirectoryEntry {
  return {
    id: map.id as string,
    fullName: map.full_name as string,
    phone: map.phone as string,
    email: (map.email as string) ?? null,
    blokRumah: (map.blok_rumah as string) ?? null,
    role: 'warga',
    isPendingImport: true,
    isKetua: false,
    avatarUrl: null,
  };
}

export function directoryRoleLabel(e: WargaDirectoryEntry): string {
  switch (e.role) {
    case 'ketua_rt':
      return 'Ketua RT';
    case 'bendahara':
      return 'Bendahara';
    default:
      return e.isPendingImport ? 'Menunggu daftar' : 'Warga';
  }
}

export const directoryIsWarga = (e: WargaDirectoryEntry): boolean =>
  e.role === 'warga' && !e.isPendingImport;
export const directoryIsBendahara = (e: WargaDirectoryEntry): boolean => e.role === 'bendahara';
