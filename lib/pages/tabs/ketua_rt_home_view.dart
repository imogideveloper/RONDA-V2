import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_animations.dart';
import '../../config/app_theme.dart';
import '../../config/iuran_navigation.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/pengumuman/announcement_detail_page.dart';
import '../../pages/pengumuman/create_announcement_page.dart';
import '../../pages/surat/surat_pengantar_page.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/ketua_rt_dashboard_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';

class KetuaRtHomeView extends StatelessWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final KasSummaryModel kas;
  final List<AnnouncementModel> announcements;
  final int belumBayar;
  final int suratPending;
  final int unreadNotif;
  final Future<void> Function() onRefresh;
  final Future<void> Function() onRefreshBadge;
  final VoidCallback? onAnnouncementRead;
  final ShellNavigateCallback? onNavigateTab;

  const KetuaRtHomeView({
    super.key,
    required this.profile,
    required this.rt,
    required this.kas,
    required this.announcements,
    required this.belumBayar,
    this.suratPending = 0,
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
          fullName: honorificName(profile.fullName),
          roleRtLine: 'Ketua RT • ${rt.displayLabel}',
          avatarUrl: profile.avatarUrl,
          notifCount: unreadNotif,
          onNotifTap: () => onNavigateTab?.call(3),
        ),
        const SizedBox(height: 16),
        ScalePress(
          onTap: () => onNavigateTab?.call(2),
          child: _KasHeroCard(saldo: kas.saldo),
        ),
        const SizedBox(height: 12),
        WargaHomeStatsRow(
          saldoKas: kas.saldo,
          totalKontribusi: kas.totalMasuk,
          isLoading: false,
          onSaldoTap: () => onNavigateTab?.call(2),
          onKontribusiTap: () => onNavigateTab?.call(2),
        ),
        const SizedBox(height: 24),
        const WargaSectionHeader(title: 'Aksi Cepat', showSparkle: true),
        const SizedBox(height: 12),
        KetuaQuickActionGrid(
          tagihCount: belumBayar,
          verifikasiCount: belumBayar,
          suratPendingCount: suratPending,
          onTagih: () => onNavigateTab?.call(1, iuranMode: IuranKetuaMode.tagih),
          onVerifikasi: () => onNavigateTab?.call(1, iuranMode: IuranKetuaMode.verifikasi),
          onApproveSurat: () => context.pushAnimated(
            SuratPengantarPage(profile: profile, rt: rt),
          ),
          onBuatInfo: () async {
            onNavigateTab?.call(3);
            await Future<void>.delayed(const Duration(milliseconds: 300));
            if (!context.mounted) return;
            await context.pushAnimated<bool>(CreateAnnouncementPage(rtId: rt.id));
            await onRefresh();
          },
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
            message: 'Belum ada pengumuman. Buat lewat tab Info.',
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
        const SizedBox(height: 16),
        const WargaSectionHeader(title: 'Menu lainnya'),
        const SizedBox(height: 10),
        WargaMenuTile(
          icon: Icons.payments_rounded,
          iconBg: WargaBerandaColors.lightGreen,
          iconColor: WargaBerandaColors.primaryGreen,
          title: 'Kelola Iuran',
          subtitle: belumBayar > 0 ? '$belumBayar tagihan belum lunas' : 'Semua warga lunas',
          onTap: () => onNavigateTab?.call(1),
        ),
        WargaMenuTile(
          icon: Icons.money_off_csred_rounded,
          iconBg: WargaBerandaColors.accentYellow,
          iconColor: const Color(0xFFBA7517),
          title: 'Tambah Pengeluaran',
          subtitle: 'Catat pengeluaran kas RT',
          onTap: () => onNavigateTab?.call(2),
        ),
      ],
    );
  }
}

class _KasHeroCard extends StatelessWidget {
  final num saldo;

  const _KasHeroCard({required this.saldo});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(18),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [WargaBerandaColors.primaryGreen, WargaBerandaColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Total Kas RT',
                  style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.9), fontSize: 13),
                ),
                const SizedBox(height: 8),
                AnimatedCountText(
                  value: saldo.toDouble(),
                  formatter: AppTheme.formatRupiah,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Ketuk untuk riwayat transaksi',
                  style: GoogleFonts.poppins(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Positioned(
            right: -20,
            top: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
