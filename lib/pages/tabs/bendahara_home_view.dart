import 'package:flutter/material.dart';
import '../../config/app_animations.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/pengumuman/announcement_detail_page.dart';
import '../../pages/surat/surat_pengantar_page.dart';
import '../../widgets/ketua_rt_dashboard_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';

/// Beranda Bendahara — layout & gaya sama dengan Warga/Ketua.
class BendaharaHomeView extends StatelessWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final KasSummaryModel kas;
  final List<AnnouncementModel> announcements;
  final int belumBayar;
  final int unreadNotif;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onRefreshBadge;
  final VoidCallback? onAnnouncementRead;
  final void Function(int tabIndex)? onNavigateTab;

  const BendaharaHomeView({
    super.key,
    required this.profile,
    required this.rt,
    required this.kas,
    required this.announcements,
    required this.belumBayar,
    required this.unreadNotif,
    required this.onRefresh,
    required this.onRefreshBadge,
    this.onAnnouncementRead,
    this.onNavigateTab,
  });

  @override
  Widget build(BuildContext context) {
    final latest = announcements.isNotEmpty ? announcements.first : null;

    return WargaPageBody(
      onRefresh: onRefresh,
      children: [
        WargaBerandaHeader(
          greetingLine: '${greetingByTime()} 👋',
          fullName: profile.fullName,
          roleRtLine: 'Bendahara • ${rt.displayLabel}',
          avatarUrl: profile.avatarUrl,
          notifCount: unreadNotif,
          onNotifTap: () => onNavigateTab?.call(3),
        ),
        const SizedBox(height: 16),
        WargaHomeStatsRow(
          saldoKas: kas.saldo,
          totalKontribusi: kas.totalMasuk,
          isLoading: false,
          onSaldoTap: () => onNavigateTab?.call(2),
          onKontribusiTap: () => onNavigateTab?.call(2),
        ),
        const SizedBox(height: 24),
        const WargaSectionHeader(title: 'Aksi Cepat', showSparkle: true),
        const SizedBox(height: 14),
        WargaAksiCepatGrid(
          onTagihIuran: () => onNavigateTab?.call(1),
          onSuratRt: () => context.pushAnimated(
            SuratPengantarPage(profile: profile, rt: rt),
          ),
          onInfo: () => onNavigateTab?.call(3),
          onLayanan: () => onNavigateTab?.call(2),
        ),
        const SizedBox(height: 24),
        WargaSectionHeader(
          title: 'Pengumuman Terbaru',
          trailing: 'Lihat Semua >',
          onTrailingTap: () => onNavigateTab?.call(3),
        ),
        const SizedBox(height: 10),
        if (latest == null)
          const WargaEmptyState(
            icon: Icons.campaign_outlined,
            message: 'Belum ada pengumuman dari pengurus RT.',
          )
        else
          WargaPengumumanFeedCard(
            item: latest,
            onTap: () => openAnnouncementDetail(
              context,
              latest,
              rtId: rt.id,
              onMarkedRead: () {
                onRefreshBadge();
                onAnnouncementRead?.call();
              },
            ),
          ),
        if (belumBayar > 0) ...[
          const SizedBox(height: 16),
          WargaCard(
            child: Row(
              children: [
                const Icon(Icons.info_outline, color: WargaBerandaColors.primaryGreen),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '$belumBayar tagihan warga belum lunas bulan ini.',
                    style: WargaBerandaText.greeting().copyWith(fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
