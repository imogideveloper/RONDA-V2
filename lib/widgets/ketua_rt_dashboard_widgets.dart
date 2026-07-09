import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../config/app_theme.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

class RtBadge extends StatelessWidget {
  final String label;
  final IconData? icon;
  final Color? color;

  const RtBadge({super.key, required this.label, this.icon, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppTheme.emerald;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 15, color: c),
            const SizedBox(width: 5),
          ],
          Text(
            label,
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: c),
          ),
        ],
      ),
    );
  }
}

/// Kartu statistik — tanpa Spacer (hindari glitch layar putih di HP)
class DashboardStatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const DashboardStatCard({
    super.key,
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: value.length > 12 ? 15 : 18,
              fontWeight: FontWeight.w800,
              color: color,
              height: 1.15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w500,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}

/// Baris 2 kartu statistik
class StatCardRow extends StatelessWidget {
  final Widget left;
  final Widget right;

  const StatCardRow({super.key, required this.left, required this.right});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: left),
        const SizedBox(width: 12),
        Expanded(child: right),
      ],
    );
  }
}

class PengumumanHighlightCard extends StatelessWidget {
  final String title;
  final String content;
  final String? eventDateLabel;
  final VoidCallback? onTap;

  const PengumumanHighlightCard({
    super.key,
    required this.title,
    required this.content,
    this.eventDateLabel,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.emeraldMuted,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.2)),
        ),
        child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.campaign_rounded, color: AppTheme.emerald, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Pengumuman Terbaru',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.emeraldDark,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.textPrimary,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      content,
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                        height: 1.45,
                      ),
                    ),
                    if (eventDateLabel != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.event_rounded, size: 14, color: AppTheme.emerald),
                          const SizedBox(width: 4),
                          Text(
                            eventDateLabel!,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.emeraldDark),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const Padding(
                padding: EdgeInsets.only(top: 24),
                child: Icon(Icons.chevron_right_rounded, color: AppTheme.emerald),
              ),
            ],
          ),
        ),
    );
  }
}

/// Aksi cepat — area sentuh besar (nyaman jari)
class QuickActionRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;

  const QuickActionRow({
    super.key,
    required this.icon,
    required this.color,
    required this.title,
    this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 64),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.border.withValues(alpha: 0.6)),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ],
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: AppTheme.textHint.withValues(alpha: 0.7), size: 28),
          ],
        ),
      ),
    );
  }
}

class NotificationBellButton extends StatelessWidget {
  final int count;
  final VoidCallback? onTap;

  const NotificationBellButton({super.key, this.count = 0, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: AppTheme.surface,
          shape: BoxShape.circle,
          border: Border.all(color: AppTheme.border),
        ),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Center(
              child: Icon(Icons.notifications_outlined, color: AppTheme.textPrimary, size: 24),
            ),
            if (count > 0)
              Positioned(
                top: 6,
                right: 6,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppTheme.danger,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white, width: 1.5),
                  ),
                  child: Text(
                    count > 9 ? '9+' : '$count',
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Empat aksi cepat icon (Tagih, Verifikasi, Surat, Info) seperti mockup Ketua RT.
class KetuaQuickActionGrid extends StatelessWidget {
  final int tagihCount;
  final int verifikasiCount;
  final int suratPendingCount;
  final VoidCallback onTagih;
  final VoidCallback onVerifikasi;
  final VoidCallback onApproveSurat;
  final VoidCallback onBuatInfo;

  const KetuaQuickActionGrid({
    super.key,
    required this.tagihCount,
    required this.verifikasiCount,
    required this.suratPendingCount,
    required this.onTagih,
    required this.onVerifikasi,
    required this.onApproveSurat,
    required this.onBuatInfo,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: KetuaQuickActionTile(
            icon: Icons.payments_rounded,
            color: WargaBerandaColors.primaryGreen,
            label: 'Tagih\nIuran',
            badge: tagihCount,
            onTap: onTagih,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: KetuaQuickActionTile(
            icon: Icons.visibility_rounded,
            color: const Color(0xFF185FA5),
            label: 'Verifikasi\nIuran',
            badge: verifikasiCount,
            onTap: onVerifikasi,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: KetuaQuickActionTile(
            icon: Icons.edit_note_rounded,
            color: const Color(0xFF3B6D11),
            label: 'Approve\nSurat',
            badge: suratPendingCount,
            onTap: onApproveSurat,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: KetuaQuickActionTile(
            icon: Icons.campaign_rounded,
            color: const Color(0xFFBA7517),
            label: 'Buat\nInfo',
            onTap: onBuatInfo,
          ),
        ),
      ],
    );
  }
}

class KetuaQuickActionTile extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final int badge;
  final VoidCallback onTap;

  const KetuaQuickActionTile({
    super.key,
    required this.icon,
    required this.color,
    required this.label,
    this.badge = 0,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 6),
        decoration: wargaCardDecoration(radius: 14),
        child: Column(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: color, size: 26),
                ),
                if (badge > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.danger,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.white, width: 1.5),
                      ),
                      child: Text(
                        badge > 9 ? '9+' : '$badge',
                        style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, height: 1.2),
            ),
          ],
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;

  const SectionHeader({super.key, required this.title, this.action, this.onAction});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Row(
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
          ),
          const Spacer(),
          if (action != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                foregroundColor: AppTheme.emerald,
                padding: const EdgeInsets.symmetric(horizontal: 8),
              ),
              child: Text(action!, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }
}

String greetingByTime() {
  final h = DateTime.now().hour;
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

String honorificName(String fullName) {
  final parts = fullName.trim().split(' ').where((p) => p.isNotEmpty).toList();
  if (parts.isEmpty) return 'Bapak/Ibu';
  if (parts.length >= 2 && parts.first.length <= 3) {
    return 'Pak ${parts[1]}';
  }
  return 'Pak ${parts.first}';
}

/// Rupiah ringkas untuk kartu kecil: 12450000 → Rp 12,4 jt
String formatRupiahCompact(num amount) {
  if (amount >= 1000000000) {
    return 'Rp ${(amount / 1000000000).toStringAsFixed(1)} M';
  }
  if (amount >= 1000000) {
    return 'Rp ${(amount / 1000000).toStringAsFixed(1)} jt';
  }
  if (amount >= 1000) {
    return 'Rp ${(amount / 1000).toStringAsFixed(0)} rb';
  }
  return AppTheme.formatRupiah(amount);
}
