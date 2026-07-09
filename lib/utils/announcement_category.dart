import 'package:flutter/material.dart';

import '../models/rt_unit_model.dart';
import '../widgets/warga_beranda_widgets.dart';

enum AnnouncementCategoryKind { kerjaBakti, info, darurat }

class AnnouncementCategoryMeta {
  final AnnouncementCategoryKind kind;
  final String label;
  final Color color;
  final Color bg;
  final Color dotColor;
  final IconData icon;

  const AnnouncementCategoryMeta({
    required this.kind,
    required this.label,
    required this.color,
    required this.bg,
    required this.dotColor,
    required this.icon,
  });
}

AnnouncementCategoryKind categoryKindFor(AnnouncementModel item) {
  final t = '${item.title} ${item.content}'.toLowerCase();
  if (t.contains('darurat') ||
      t.contains('peringatan') ||
      t.contains('bahaya') ||
      t.contains('pencurian') ||
      t.contains('emergency')) {
    return AnnouncementCategoryKind.darurat;
  }
  if (t.contains('kerja bakti') || t.contains('gotong royong') || t.contains('gotong')) {
    return AnnouncementCategoryKind.kerjaBakti;
  }
  if (item.isPinned && (t.contains('penting') || t.contains('waspada'))) {
    return AnnouncementCategoryKind.darurat;
  }
  return AnnouncementCategoryKind.info;
}

AnnouncementCategoryMeta categoryMetaFor(AnnouncementModel item) {
  switch (categoryKindFor(item)) {
    case AnnouncementCategoryKind.kerjaBakti:
      return const AnnouncementCategoryMeta(
        kind: AnnouncementCategoryKind.kerjaBakti,
        label: 'KERJA BAKTI',
        color: WargaBerandaColors.primaryGreen,
        bg: WargaBerandaColors.lightGreen,
        dotColor: WargaBerandaColors.primaryGreen,
        icon: Icons.event_rounded,
      );
    case AnnouncementCategoryKind.darurat:
      return const AnnouncementCategoryMeta(
        kind: AnnouncementCategoryKind.darurat,
        label: 'DARURAT',
        color: WargaBerandaColors.dangerRed,
        bg: WargaBerandaColors.accentRed,
        dotColor: WargaBerandaColors.dangerRed,
        icon: Icons.warning_amber_rounded,
      );
    case AnnouncementCategoryKind.info:
      return const AnnouncementCategoryMeta(
        kind: AnnouncementCategoryKind.info,
        label: 'INFO',
        color: Color(0xFF92400E),
        bg: WargaBerandaColors.accentYellow,
        dotColor: Color(0xFFEAB308),
        icon: Icons.campaign_rounded,
      );
  }
}

String announcementRelativeTime(DateTime createdAt) {
  final diff = DateTime.now().difference(createdAt);
  if (diff.inDays >= 7) {
    final weeks = (diff.inDays / 7).floor();
    return '$weeks minggu lalu';
  }
  if (diff.inDays >= 1) return '${diff.inDays} hari lalu';
  if (diff.inHours >= 1) return '${diff.inHours} jam lalu';
  if (diff.inMinutes >= 1) return '${diff.inMinutes} menit lalu';
  return 'Baru saja';
}

String announcementAuthorLabel(AnnouncementModel item) {
  final name = item.authorName?.trim();
  if (name == null || name.isEmpty) return 'Pengurus RT';
  if (name.toLowerCase().startsWith('pak ') || name.toLowerCase().startsWith('bu ')) {
    return name;
  }
  return 'Pak $name';
}
