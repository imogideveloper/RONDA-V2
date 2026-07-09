import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_animations.dart';
import '../../models/rt_unit_model.dart';
import '../../services/announcement_read_service.dart';
import '../../widgets/rt_ui_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';

/// Halaman detail pengumuman — dibuka dari tab Info, Home, atau notifikasi.
class AnnouncementDetailPage extends StatelessWidget {
  final AnnouncementModel announcement;

  const AnnouncementDetailPage({super.key, required this.announcement});

  @override
  Widget build(BuildContext context) {
    final a = announcement;

    return Scaffold(
      backgroundColor: WargaBerandaColors.bgColor,
      appBar: AppBar(
        backgroundColor: WargaBerandaColors.bgColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: WargaBerandaColors.primaryGreen),
        title: Text('Detail Pengumuman', style: WargaBerandaText.sectionTitle()),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          if (a.isPinned) ...[
            const Align(
              alignment: Alignment.centerLeft,
              child: StatusChip(label: 'Penting', color: Color(0xFFBA7517)),
            ),
            const SizedBox(height: 12),
          ],
          if (a.hasImage) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: AspectRatio(
                aspectRatio: 16 / 10,
                child: Image.network(
                  a.imageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: WargaBerandaColors.lightGreen,
                    child: const Center(
                      child: Icon(Icons.broken_image_outlined, color: WargaBerandaColors.textSecondary, size: 48),
                    ),
                  ),
                  loadingBuilder: (context, child, progress) {
                    if (progress == null) return child;
                    return Container(
                      color: WargaBerandaColors.lightGreen,
                      child: const Center(
                        child: CircularProgressIndicator(color: WargaBerandaColors.primaryGreen),
                      ),
                    );
                  },
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          Text(a.title, style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w600, color: WargaBerandaColors.textPrimary)),
          const SizedBox(height: 12),
          if (a.hasEventDate)
            WargaCard(
              child: Row(
                children: [
                  const Icon(Icons.event_rounded, color: WargaBerandaColors.primaryGreen, size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tanggal kegiatan', style: WargaBerandaText.labelCaps()),
                        Text(a.eventDateLabel, style: WargaBerandaText.sectionTitle().copyWith(fontSize: 16)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          if (a.hasEventDate) const SizedBox(height: 12),
          WargaCard(
            child: Text(a.content, style: WargaBerandaText.greeting().copyWith(fontSize: 15, height: 1.6)),
          ),
          const SizedBox(height: 16),
          WargaCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _metaRow(Icons.person_outline_rounded, 'Diposting oleh', a.authorName ?? 'Pengurus RT'),
                const SizedBox(height: 10),
                _metaRow(Icons.schedule_rounded, 'Tanggal posting', a.createdAtLabel),
                if (a.hasEventDate) ...[
                  const SizedBox(height: 10),
                  _metaRow(Icons.celebration_outlined, 'Pelaksanaan', a.eventDateLabel),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metaRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: WargaBerandaColors.primaryGreen),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: WargaBerandaText.labelCaps()),
              Text(value, style: WargaBerandaText.sectionTitle().copyWith(fontSize: 14)),
            ],
          ),
        ),
      ],
    );
  }
}

/// Buka detail; jika [rtId] diisi, pengumuman ditandai sudah dibaca (hilangkan badge notif).
Future<void> openAnnouncementDetail(
  BuildContext context,
  AnnouncementModel announcement, {
  String? rtId,
  VoidCallback? onMarkedRead,
}) async {
  if (rtId != null) {
    await AnnouncementReadService.instance.markRead(rtId, announcement.id);
    onMarkedRead?.call();
  }
  if (!context.mounted) return;
  await context.pushAnimated(AnnouncementDetailPage(announcement: announcement));
}
