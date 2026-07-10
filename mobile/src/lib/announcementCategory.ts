// Port dari lib/utils/announcement_category.dart
import type { IconName } from '../components/Icon';
import { wargaColors } from '../config/theme';
import { Announcement } from '../types/models';

export type AnnouncementCategoryKind = 'kerjaBakti' | 'info' | 'darurat';

export interface AnnouncementCategoryMeta {
  kind: AnnouncementCategoryKind;
  label: string;
  color: string;
  bg: string;
  dotColor: string;
  icon: IconName;
}

export function categoryKindFor(item: Announcement): AnnouncementCategoryKind {
  const t = `${item.title} ${item.content}`.toLowerCase();
  if (
    t.includes('darurat') ||
    t.includes('peringatan') ||
    t.includes('bahaya') ||
    t.includes('pencurian') ||
    t.includes('emergency')
  ) {
    return 'darurat';
  }
  if (t.includes('kerja bakti') || t.includes('gotong royong') || t.includes('gotong')) {
    return 'kerjaBakti';
  }
  if (item.isPinned && (t.includes('penting') || t.includes('waspada'))) {
    return 'darurat';
  }
  return 'info';
}

export function categoryMetaFor(item: Announcement): AnnouncementCategoryMeta {
  switch (categoryKindFor(item)) {
    case 'kerjaBakti':
      return {
        kind: 'kerjaBakti',
        label: 'KERJA BAKTI',
        color: wargaColors.primaryGreen,
        bg: wargaColors.lightGreen,
        dotColor: wargaColors.primaryGreen,
        icon: 'calendar',
      };
    case 'darurat':
      return {
        kind: 'darurat',
        label: 'DARURAT',
        color: wargaColors.dangerRed,
        bg: wargaColors.accentRed,
        dotColor: wargaColors.dangerRed,
        icon: 'warning',
      };
    case 'info':
    default:
      return {
        kind: 'info',
        label: 'INFO',
        color: '#92400E',
        bg: wargaColors.accentYellow,
        dotColor: '#EAB308',
        icon: 'megaphone',
      };
  }
}

export function announcementRelativeTime(createdAt: Date): string {
  const diffMs = Date.now() - createdAt.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 7) return `${Math.floor(days / 7)} minggu lalu`;
  if (days >= 1) return `${days} hari lalu`;
  if (hours >= 1) return `${hours} jam lalu`;
  if (mins >= 1) return `${mins} menit lalu`;
  return 'Baru saja';
}

export function announcementAuthorLabel(item: Announcement): string {
  const name = item.authorName?.trim();
  if (!name) return 'Pengurus RT';
  const lower = name.toLowerCase();
  if (lower.startsWith('pak ') || lower.startsWith('bu ')) return name;
  return `Pak ${name}`;
}
