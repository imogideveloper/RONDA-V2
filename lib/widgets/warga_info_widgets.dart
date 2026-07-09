import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/rt_unit_model.dart';
import '../utils/announcement_category.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Hero oranye — ringkasan informasi RT.
class WargaInfoHeroCard extends StatelessWidget {
  final int activeCount;
  final int unreadCount;
  final int infoCount;
  final int kerjaBaktiCount;
  final int daruratCount;

  const WargaInfoHeroCard({
    super.key,
    required this.activeCount,
    required this.unreadCount,
    required this.infoCount,
    required this.kerjaBaktiCount,
    required this.daruratCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFFEA580C), Color(0xFFFBBF24)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEA580C).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.campaign_rounded, color: Colors.white.withValues(alpha: 0.92), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'INFORMASI RT',
                          style: GoogleFonts.poppins(
                            color: Colors.white.withValues(alpha: 0.92),
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '$activeCount Aktif',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      unreadCount > 0
                          ? '$unreadCount informasi belum dibaca'
                          : 'Semua informasi sudah dibaca',
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.campaign_rounded, color: Colors.white, size: 32),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _pill(Icons.campaign_outlined, '$infoCount Info'),
              const SizedBox(width: 8),
              _pill(Icons.event_outlined, '$kerjaBaktiCount Kerja Bakti'),
              const SizedBox(width: 8),
              _pill(Icons.warning_amber_rounded, '$daruratCount Darurat'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _pill(IconData icon, String label) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.18),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: Colors.white),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Kartu satu pengumuman di tab Informasi.
class WargaInfoAnnouncementCard extends StatelessWidget {
  final AnnouncementModel item;
  final bool isUnread;
  final VoidCallback onTap;

  const WargaInfoAnnouncementCard({
    super.key,
    required this.item,
    required this.isUnread,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cat = categoryMetaFor(item);

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ScalePress(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: wargaCardDecoration(radius: 16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: cat.bg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(cat.icon, color: cat.color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        _badge(cat.label, cat.color, cat.bg),
                        if (isUnread) ...[
                          const SizedBox(width: 6),
                          _badge('BARU', Colors.white, const Color(0xFFEA580C)),
                        ],
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            announcementRelativeTime(item.createdAt),
                            style: WargaBerandaText.greeting().copyWith(fontSize: 11),
                            textAlign: TextAlign.end,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.title,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.contentPreview,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: WargaBerandaText.greeting().copyWith(fontSize: 12, height: 1.35),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.person_outline, size: 14, color: WargaBerandaColors.textSecondary),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            announcementAuthorLabel(item),
                            style: WargaBerandaText.greeting().copyWith(fontSize: 11),
                          ),
                        ),
                        Container(
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(color: cat.dotColor, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.chevron_right_rounded, color: WargaBerandaColors.textSecondary, size: 20),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _badge(String text, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(6)),
      child: Text(
        text,
        style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.w700, color: fg),
      ),
    );
  }
}
