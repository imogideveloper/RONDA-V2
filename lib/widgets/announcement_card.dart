import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import '../models/rt_unit_model.dart';
import '../pages/pengumuman/announcement_detail_page.dart';
import 'rt_ui_widgets.dart';

class AnnouncementListCard extends StatelessWidget {
  final AnnouncementModel item;

  const AnnouncementListCard({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    return RtCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (item.isPinned)
            const Padding(
              padding: EdgeInsets.only(bottom: 8),
              child: StatusChip(label: 'Penting', color: AppTheme.warning),
            ),
          if (item.hasImage)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: AspectRatio(
                  aspectRatio: 16 / 7,
                  child: Image.network(
                    item.imageUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: AppTheme.emeraldMuted,
                      child: const Icon(Icons.image_not_supported_outlined, color: AppTheme.textHint),
                    ),
                  ),
                ),
              ),
            ),
          Text(item.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          const SizedBox(height: 6),
          Text(
            item.contentPreview,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppTheme.textSecondary, height: 1.45, fontSize: 14),
          ),
          if (item.hasEventDate) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.event_rounded, size: 16, color: AppTheme.emerald),
                const SizedBox(width: 6),
                Text(
                  'Kegiatan: ${item.eventDateLabel}',
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.emeraldDark),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          Text(
            '${item.authorName ?? 'Pengurus RT'} · ${item.createdAtLabel}',
            style: const TextStyle(fontSize: 12, color: AppTheme.textHint),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => openAnnouncementDetail(context, item),
              icon: const Icon(Icons.article_outlined, size: 18),
              label: const Text('Detail'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.emerald,
                side: const BorderSide(color: AppTheme.emerald),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
