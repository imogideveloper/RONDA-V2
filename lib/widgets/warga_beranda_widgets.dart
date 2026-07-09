import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/app_theme.dart';
import '../config/smooth_scroll.dart';
import '../models/rt_unit_model.dart';
import 'animated_rt_widgets.dart';

// ── Palet Beranda Warga (production) ─────────────────────────────────────
abstract class WargaBerandaColors {
  static const primaryGreen = Color(0xFF1D9E75);
  static const primaryDark = Color(0xFF0F6E56);
  static const lightGreen = Color(0xFFE8F5F0);
  static const bgColor = Color(0xFFF0F4F0);
  static const cardWhite = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF1A1A1A);
  static const textSecondary = Color(0xFF6B7280);
  static const dangerRed = Color(0xFFE24B4A);
  static const lightRed = Color(0xFFFFF5F5);
  static const accentYellow = Color(0xFFFFF8E6);
  static const accentBlue = Color(0xFFE6F1FB);
  static const accentRed = Color(0xFFFCEBEB);
  static const accentLime = Color(0xFFEAF3DE);
  static const emergencyBorder = Color(0xFFF7C1C1);
  static const border = Color(0xFFE5E7EB);

  // Alias kompatibilitas
  static const primary = primaryGreen;
  static const background = bgColor;
  static const card = cardWhite;
  static const accentGreen = lightGreen;
  static const emergencyBg = lightRed;
  static const navActive = primaryGreen;
  static const navActiveBg = lightGreen;
  static const tagihanOverdue = dangerRed;
  static const tagihanStart = Color(0xFFEF4444);
  static const tagihanEnd = Color(0xFF991B1B);
}

abstract class WargaBerandaText {
  static TextStyle _base(
    double size,
    FontWeight w,
    Color color, {
    double? height,
  }) => GoogleFonts.poppins(
    fontSize: size,
    fontWeight: w,
    color: color,
    height: height,
  );

  static TextStyle greeting() =>
      _base(13, FontWeight.w400, WargaBerandaColors.textSecondary);

  static TextStyle name() =>
      _base(18, FontWeight.w600, WargaBerandaColors.textPrimary, height: 1.2);

  static TextStyle sectionTitle() =>
      _base(16, FontWeight.w500, WargaBerandaColors.textPrimary);

  static TextStyle labelCaps() => _base(
    10,
    FontWeight.w500,
    WargaBerandaColors.textSecondary,
  ).copyWith(letterSpacing: 0.5);

  static TextStyle aksiLabel() =>
      _base(10, FontWeight.w400, WargaBerandaColors.textSecondary);
}

BoxDecoration get _cardDecoration => BoxDecoration(
  color: WargaBerandaColors.card,
  borderRadius: BorderRadius.circular(14),
  border: Border.all(color: WargaBerandaColors.border),
  boxShadow: [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ],
);

/// Rupiah ringkas: 1700000 → Rp 1,7 jt
String wargaFormatRupiahCompact(num amount) {
  if (amount >= 1000000000) {
    final v = (amount / 1000000000).toStringAsFixed(1).replaceAll('.', ',');
    return 'Rp $v M';
  }
  if (amount >= 1000000) {
    final v = (amount / 1000000).toStringAsFixed(1).replaceAll('.', ',');
    return 'Rp $v jt';
  }
  if (amount >= 1000) {
    final v = (amount / 1000).toStringAsFixed(0);
    return 'Rp $v rb';
  }
  return AppTheme.formatRupiah(amount);
}

String wargaInitialsFromName(String fullName) {
  final parts = fullName
      .trim()
      .split(RegExp(r'\s+'))
      .where((p) => p.isNotEmpty)
      .toList();
  if (parts.isEmpty) return 'W';
  if (parts.length == 1) return parts.first[0].toUpperCase();
  return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
}

/// Avatar profil: foto URL atau inisial nama.
class WargaProfileAvatar extends StatelessWidget {
  final String? imageUrl;
  final String fullName;
  final double radius;
  final VoidCallback? onTap;
  final bool showCameraBadge;

  const WargaProfileAvatar({
    super.key,
    this.imageUrl,
    required this.fullName,
    this.radius = 26,
    this.onTap,
    this.showCameraBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    final hasUrl = imageUrl != null && imageUrl!.trim().isNotEmpty;
    Widget avatar = CircleAvatar(
      key: ValueKey(imageUrl ?? fullName),
      radius: radius,
      backgroundColor: WargaBerandaColors.accentGreen,
      backgroundImage: hasUrl ? NetworkImage(imageUrl!) : null,
      child: hasUrl
          ? null
          : Text(
              wargaInitialsFromName(fullName),
              style: GoogleFonts.poppins(
                fontSize: radius * 0.62,
                fontWeight: FontWeight.w600,
                color: WargaBerandaColors.primaryGreen,
              ),
            ),
    );

    if (showCameraBadge) {
      avatar = Stack(
        clipBehavior: Clip.none,
        children: [
          avatar,
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: WargaBerandaColors.primaryGreen,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 14),
            ),
          ),
        ],
      );
    }

    if (onTap == null) return avatar;
    return ScalePress(onTap: onTap, child: avatar);
  }
}

class WargaBerandaHeader extends StatelessWidget {
  final String greetingLine;
  final String fullName;
  final String roleRtLine;
  final int notifCount;
  final VoidCallback onNotifTap;
  final String? avatarUrl;

  const WargaBerandaHeader({
    super.key,
    required this.greetingLine,
    required this.fullName,
    required this.roleRtLine,
    required this.notifCount,
    required this.onNotifTap,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        WargaProfileAvatar(
          imageUrl: avatarUrl,
          fullName: fullName,
          radius: 26,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(greetingLine, style: WargaBerandaText.greeting()),
              const SizedBox(height: 2),
              Text(fullName, style: WargaBerandaText.name()),
              const SizedBox(height: 2),
              Text(
                roleRtLine,
                style: WargaBerandaText.greeting().copyWith(fontSize: 12),
              ),
            ],
          ),
        ),
        ScalePress(
          onTap: onNotifTap,
          child: Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: WargaBerandaColors.card,
              shape: BoxShape.circle,
              border: Border.all(color: WargaBerandaColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.center,
              children: [
                const Icon(
                  Icons.notifications_outlined,
                  size: 22,
                  color: WargaBerandaColors.textPrimary,
                ),
                if (notifCount > 0)
                  Positioned(
                    top: 10,
                    right: 11,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(
                        color: Color(0xFFEF4444),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class WargaTotalTagihanCard extends StatefulWidget {
  final num total;
  final int bulanTertunggak;
  final VoidCallback onTap;
  final int? daysLate;
  final bool showChevron;

  const WargaTotalTagihanCard({
    super.key,
    required this.total,
    required this.bulanTertunggak,
    required this.onTap,
    this.daysLate,
    this.showChevron = true,
  });

  @override
  State<WargaTotalTagihanCard> createState() => _WargaTotalTagihanCardState();
}

class _WargaTotalTagihanCardState extends State<WargaTotalTagihanCard>
    with SingleTickerProviderStateMixin {
  AnimationController? _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _syncPulse();
  }

  @override
  void didUpdateWidget(WargaTotalTagihanCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    _syncPulse();
  }

  void _syncPulse() {
    final pulse = widget.total > 0;
    if (pulse && _pulseCtrl == null) {
      _pulseCtrl = AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 1800),
      )..repeat(reverse: true);
      setState(() {});
    } else if (!pulse && _pulseCtrl != null) {
      _pulseCtrl?.dispose();
      _pulseCtrl = null;
      setState(() {});
    }
  }

  @override
  void dispose() {
    _pulseCtrl?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final hasTunggak = widget.total > 0;
    final gradient = hasTunggak
        ? const [Color(0xFFE24B4A), Color(0xFFF97316)]
        : const [
            WargaBerandaColors.primaryGreen,
            WargaBerandaColors.primaryDark,
          ];

    Widget card = ScalePress(
      onTap: widget.onTap,
      pressedScale: 0.98,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: gradient,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: (hasTunggak ? WargaBerandaColors.dangerRed : WargaBerandaColors.primaryGreen)
                        .withValues(alpha: 0.28),
                    blurRadius: 14,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Expanded(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 320),
                        layoutBuilder: (current, previous) => Stack(
                          alignment: Alignment.centerLeft,
                          children: [...previous, if (current != null) current],
                        ),
                        child: SizedBox(
                          key: ValueKey<bool>(hasTunggak),
                          width: double.infinity,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Align(
                                alignment: Alignment.centerLeft,
                                child: _statusPill(hasTunggak),
                              ),
                              const SizedBox(height: 12),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: AnimatedCountText(
                                  value: widget.total.toDouble(),
                                  formatter: AppTheme.formatRupiah,
                                  style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontSize: 28,
                                    fontWeight: FontWeight.w600,
                                    height: 1.1,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _footerText(hasTunggak),
                                textAlign: TextAlign.left,
                                style: GoogleFonts.poppins(
                                  color: Colors.white.withValues(alpha: 0.88),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    if (widget.showChevron)
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.chevron_right_rounded,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
              ),
            ),
            Positioned(
              right: -24,
              top: -24,
              child: Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.1),
                ),
              ),
            ),
            Positioned(
              right: 40,
              bottom: -30,
              child: Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.06),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (_pulseCtrl != null) {
      card = AnimatedBuilder(
        animation: _pulseCtrl!,
        builder: (_, child) {
          final scale = 1 + (_pulseCtrl!.value * 0.012);
          return Transform.scale(scale: scale, child: child);
        },
        child: card,
      );
    }

    return card;
  }

  Widget _statusPill(bool hasTunggak) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            hasTunggak
                ? Icons.warning_amber_rounded
                : Icons.check_circle_outline,
            color: Colors.white,
            size: 14,
          ),
          const SizedBox(width: 6),
          Text(
            hasTunggak ? 'Ada tunggakan' : 'Iuran lunas',
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _footerText(bool hasTunggak) {
    if (!hasTunggak) return 'Semua tagihan sudah dibayar';
    final n = widget.bulanTertunggak;
    return '$n bulan tertunggak · Segera lunasi';
  }
}

class WargaMiniStatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String label;
  final double amount;
  final Color? valueColor;
  final VoidCallback? onTap;
  final bool isLoading;
  final String? footnote;
  final bool useCompactAmount;

  const WargaMiniStatCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.label,
    required this.amount,
    this.valueColor,
    this.onTap,
    this.isLoading = false,
    this.footnote,
    this.useCompactAmount = false,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: const EdgeInsets.all(14),
      decoration: _cardDecoration.copyWith(
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 12),
          Text(label, style: WargaBerandaText.labelCaps()),
          const SizedBox(height: 4),
          if (isLoading)
            const ShimmerBlock(height: 18, width: 100, borderRadius: 6)
          else
            Text(
              useCompactAmount ? wargaFormatRupiahCompact(amount) : AppTheme.formatRupiah(amount),
              style: GoogleFonts.poppins(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: valueColor ?? WargaBerandaColors.textPrimary,
              ),
            ),
          if (footnote != null && !isLoading) ...[
            const SizedBox(height: 6),
            Text(
              footnote!,
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: footnote!.startsWith('↗')
                    ? WargaBerandaColors.primaryGreen
                    : WargaBerandaColors.textSecondary,
              ),
            ),
          ],
        ],
      ),
    );
    if (onTap == null || isLoading) return card;
    return ScalePress(onTap: onTap, child: card);
  }
}

/// Baris statistik kas + kontribusi dengan skeleton opsional.
class WargaHomeStatsRow extends StatelessWidget {
  final double saldoKas;
  final double totalKontribusi;
  final bool isLoading;
  final VoidCallback onSaldoTap;
  final VoidCallback onKontribusiTap;
  final int paidCount;
  final double kasMasukBulanIni;

  const WargaHomeStatsRow({
    super.key,
    required this.saldoKas,
    required this.totalKontribusi,
    required this.isLoading,
    required this.onSaldoTap,
    required this.onKontribusiTap,
    this.paidCount = 0,
    this.kasMasukBulanIni = 0,
  });

  String? get _saldoFootnote {
    if (kasMasukBulanIni <= 0) return null;
    return '↗ Pemasukan bulan ini';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: WargaMiniStatCard(
            icon: Icons.account_balance_wallet_outlined,
            iconColor: WargaBerandaColors.primaryGreen,
            iconBg: WargaBerandaColors.lightGreen,
            label: 'SALDO KAS RT',
            amount: saldoKas,
            useCompactAmount: saldoKas >= 1000000,
            footnote: _saldoFootnote,
            isLoading: isLoading,
            onTap: isLoading ? null : onSaldoTap,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: WargaMiniStatCard(
            icon: Icons.savings_outlined,
            iconColor: WargaBerandaColors.primaryGreen,
            iconBg: WargaBerandaColors.accentLime,
            label: 'TOTAL KONTRIBUSI',
            amount: totalKontribusi,
            valueColor: WargaBerandaColors.primaryGreen,
            footnote: paidCount > 0 ? '✓ ${paidCount}x pembayaran' : null,
            isLoading: isLoading,
            onTap: isLoading ? null : onKontribusiTap,
          ),
        ),
      ],
    );
  }
}

class WargaAksiCepatGrid extends StatelessWidget {
  final VoidCallback onTagihIuran;
  final VoidCallback onSuratRt;
  final VoidCallback onInfo;
  final VoidCallback onLayanan;
  final int tagihBadgeCount;

  const WargaAksiCepatGrid({
    super.key,
    required this.onTagihIuran,
    required this.onSuratRt,
    required this.onInfo,
    required this.onLayanan,
    this.tagihBadgeCount = 0,
  });

  static const _tiles = [
    (
      Icons.payments_rounded,
      WargaBerandaColors.lightGreen,
      WargaBerandaColors.primaryGreen,
      'Tagih iuran',
    ),
    (
      Icons.description_rounded,
      WargaBerandaColors.accentLime,
      Color(0xFF3B6D11),
      'Surat RT',
    ),
    (
      Icons.campaign_rounded,
      WargaBerandaColors.accentYellow,
      Color(0xFFBA7517),
      'Info',
    ),
    (
      Icons.headset_mic_rounded,
      WargaBerandaColors.accentBlue,
      Color(0xFF185FA5),
      'Layanan',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final callbacks = [onTagihIuran, onSuratRt, onInfo, onLayanan];
    return Row(
      children: List.generate(4, (i) {
        final t = _tiles[i];
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(left: i == 0 ? 0 : 5, right: i == 3 ? 0 : 5),
            child: _AksiTile(
              icon: t.$1,
              iconBg: t.$2,
              iconColor: t.$3,
              label: t.$4,
              badge: i == 0 && tagihBadgeCount > 0 ? tagihBadgeCount : null,
              onTap: callbacks[i],
            ),
          ),
        );
      }),
    );
  }
}

class _AksiTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String label;
  final VoidCallback onTap;
  final int? badge;

  const _AksiTile({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.label,
    required this.onTap,
    this.badge,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      pressedScale: 0.94,
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: iconColor, size: 26),
              ),
              if (badge != null)
                Positioned(
                  top: -4,
                  right: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: WargaBerandaColors.dangerRed,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                    child: Text(
                      '$badge',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            style: WargaBerandaText.aksiLabel(),
          ),
        ],
      ),
    );
  }
}

class WargaDaruratBanner extends StatelessWidget {
  final VoidCallback onTap;

  const WargaDaruratBanner({super.key, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: WargaBerandaColors.emergencyBg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: WargaBerandaColors.emergencyBorder),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: WargaBerandaColors.accentRed,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.phone_in_talk_rounded,
                color: WargaBerandaColors.dangerRed,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Call darurat',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: const Color(0xFF991B1B),
                    ),
                  ),
                  Text(
                    'Hubungi pengurus RT',
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: const Color(0xFFB91C1C),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: WargaBerandaColors.textSecondary,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}

/// Satu baris di Papan info (tagihan / surat / pengumuman).
class WargaPapanInfoStrip extends StatelessWidget {
  final Color accentColor;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String badge;
  final Color badgeBg;
  final Color badgeFg;
  final String metaRight;
  final String title;
  final String subtitle;
  final VoidCallback? onTap;

  const WargaPapanInfoStrip({
    super.key,
    required this.accentColor,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.badge,
    required this.badgeBg,
    required this.badgeFg,
    required this.metaRight,
    required this.title,
    required this.subtitle,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      pressedScale: 0.99,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: _cardDecoration,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 4,
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(icon, size: 20, color: iconColor),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: badgeBg,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    badge,
                                    style: GoogleFonts.poppins(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: badgeFg,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ),
                                const Spacer(),
                                Text(metaRight, style: WargaBerandaText.greeting().copyWith(fontSize: 11)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: WargaBerandaColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              subtitle,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.only(top: 20),
                        child: Icon(
                          Icons.chevron_right_rounded,
                          size: 20,
                          color: WargaBerandaColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Judul Papan info + pill jumlah + link.
class WargaPapanInfoHeader extends StatelessWidget {
  final int stripCount;
  final VoidCallback? onLihatSemua;

  const WargaPapanInfoHeader({
    super.key,
    required this.stripCount,
    this.onLihatSemua,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text('Papan info', style: WargaBerandaText.sectionTitle()),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: WargaBerandaColors.lightGreen,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            '$stripCount strip',
            style: GoogleFonts.poppins(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: WargaBerandaColors.primaryGreen,
            ),
          ),
        ),
        const Spacer(),
        if (onLihatSemua != null)
          GestureDetector(
            onTap: onLihatSemua,
            child: Text(
              'Lihat semua >',
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: WargaBerandaColors.primaryGreen,
              ),
            ),
          ),
      ],
    );
  }
}

class WargaSectionHeader extends StatelessWidget {
  final String title;
  final String? trailing;
  final VoidCallback? onTrailingTap;
  final bool showSparkle;

  const WargaSectionHeader({
    super.key,
    required this.title,
    this.trailing,
    this.onTrailingTap,
    this.showSparkle = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title, style: WargaBerandaText.sectionTitle()),
        if (showSparkle) ...[
          const SizedBox(width: 6),
          const Icon(Icons.auto_awesome, color: Color(0xFFEAB308), size: 18),
        ],
        const Spacer(),
        if (trailing != null)
          GestureDetector(
            onTap: onTrailingTap,
            child: Text(
              trailing!,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: onTrailingTap != null
                    ? WargaBerandaColors.primary
                    : WargaBerandaColors.textSecondary,
              ),
            ),
          ),
      ],
    );
  }
}

class WargaLayananSuratItem {
  final String title;
  final String sla;
  final String description;
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final Color accentColor;
  final String suratTypeKey;
  final bool isPopular;
  final List<String> keperluanOptions;

  const WargaLayananSuratItem({
    required this.title,
    required this.sla,
    required this.description,
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.accentColor,
    required this.suratTypeKey,
    this.isPopular = false,
    this.keperluanOptions = const [
      'Administrasi sekolah',
      'Pendaftaran program bantuan',
      'Pengajuan KTP/KK',
      'Keperluan lainnya',
    ],
  });

  static const catalog = [
    WargaLayananSuratItem(
      title: 'Surat Keterangan Domisili',
      sla: '2 hari kerja',
      description: 'Surat resmi alamat domisili warga untuk keperluan administrasi.',
      icon: Icons.home_rounded,
      iconColor: Color(0xFF185FA5),
      iconBg: WargaBerandaColors.accentBlue,
      accentColor: Color(0xFF3B82F6),
      suratTypeKey: 'Surat Keterangan Domisili',
      isPopular: true,
      keperluanOptions: [
        'Administrasi sekolah',
        'Pendaftaran program bantuan',
        'Pengajuan KTP/KK',
        'Keperluan lainnya',
      ],
    ),
    WargaLayananSuratItem(
      title: 'Surat Keterangan Tidak Mampu',
      sla: '3 hari kerja',
      description: 'Surat untuk pengajuan bantuan sosial atau keringanan biaya.',
      icon: Icons.favorite_rounded,
      iconColor: WargaBerandaColors.dangerRed,
      iconBg: WargaBerandaColors.accentRed,
      accentColor: Color(0xFFEC4899),
      suratTypeKey: 'Surat Keterangan Tidak Mampu',
      keperluanOptions: [
        'Pendaftaran program bantuan',
        'Beasiswa / sekolah',
        'Bantuan kesehatan',
        'Keperluan lainnya',
      ],
    ),
    WargaLayananSuratItem(
      title: 'Surat Pengantar SKCK',
      sla: '1 hari kerja',
      description: 'Surat pengantar ke Polsek untuk pembuatan SKCK.',
      icon: Icons.shield_rounded,
      iconColor: Color(0xFF5B21B6),
      iconBg: Color(0xFFF3E8FF),
      accentColor: Color(0xFF8B5CF6),
      suratTypeKey: 'Surat Pengantar SKCK',
      keperluanOptions: [
        'Melamar pekerjaan',
        'Melanjutkan studi',
        'Keperluan administrasi',
        'Keperluan lainnya',
      ],
    ),
    WargaLayananSuratItem(
      title: 'Surat Keterangan Usaha',
      sla: '2 hari kerja',
      description: 'Surat keterangan usaha untuk UMKM / perizinan ringan.',
      icon: Icons.storefront_rounded,
      iconColor: Color(0xFFBA7517),
      iconBg: WargaBerandaColors.accentYellow,
      accentColor: Color(0xFFF59E0B),
      suratTypeKey: 'Surat Keterangan Usaha',
      keperluanOptions: [
        'Perizinan usaha',
        'Pengajuan kredit UMKM',
        'Kontrak / kerjasama',
        'Keperluan lainnya',
      ],
    ),
    WargaLayananSuratItem(
      title: 'Surat Pengantar Nikah',
      sla: '3 hari kerja',
      description: 'Surat pengantar nikah ke Kelurahan / KUA.',
      icon: Icons.favorite_border_rounded,
      iconColor: WargaBerandaColors.primaryGreen,
      iconBg: WargaBerandaColors.lightGreen,
      accentColor: Color(0xFFEC4899),
      suratTypeKey: 'Surat Pengantar Nikah',
      keperluanOptions: [
        'Pengajuan nikah di KUA',
        'Administrasi catatan sipil',
        'Keperluan lainnya',
      ],
    ),
  ];

  static WargaLayananSuratItem? byTypeKey(String key) {
    for (final item in catalog) {
      if (item.suratTypeKey == key) return item;
    }
    const aliases = <String, String>{
      'Surat Domisili': 'Surat Keterangan Domisili',
      'Surat Pengantar KTP': 'Surat Keterangan Tidak Mampu',
    };
    final mapped = aliases[key];
    if (mapped != null) return byTypeKey(mapped);
    return null;
  }
}

/// Satu kartu putih berisi daftar layanan surat dengan divider.
class WargaLayananSuratGroupedList extends StatelessWidget {
  final List<WargaLayananSuratItem> items;
  final void Function(WargaLayananSuratItem item) onItemTap;
  final bool showBaruOnFirst;

  const WargaLayananSuratGroupedList({
    super.key,
    required this.items,
    required this.onItemTap,
    this.showBaruOnFirst = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: _cardDecoration,
      child: Column(
        children: [
          for (var i = 0; i < items.length; i++) ...[
            if (i > 0)
              const Divider(height: 1, color: WargaBerandaColors.border),
            _LayananRow(
              item: items[i],
              showBaru: showBaruOnFirst && i == 0,
              onTap: () => onItemTap(items[i]),
            ),
          ],
        ],
      ),
    );
  }
}

class _LayananRow extends StatelessWidget {
  final WargaLayananSuratItem item;
  final bool showBaru;
  final VoidCallback onTap;

  const _LayananRow({
    required this.item,
    required this.onTap,
    this.showBaru = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: item.iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: item.iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            item.title,
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                              color: WargaBerandaColors.textPrimary,
                            ),
                          ),
                        ),
                        if (showBaru) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: WargaBerandaColors.lightGreen,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Baru',
                              style: GoogleFonts.poppins(
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                                color: WargaBerandaColors.primaryGreen,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.sla,
                      style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right_rounded,
                color: WargaBerandaColors.textSecondary,
                size: 22,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

@Deprecated('Gunakan WargaLayananSuratGroupedList')
class WargaLayananSuratCard extends StatelessWidget {
  final WargaLayananSuratItem item;
  final VoidCallback onTap;

  const WargaLayananSuratCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: WargaLayananSuratGroupedList(
        items: [item],
        onItemTap: (_) => onTap(),
      ),
    );
  }
}

class WargaPengumumanFeedCard extends StatelessWidget {
  final AnnouncementModel item;
  final VoidCallback onTap;

  const WargaPengumumanFeedCard({
    super.key,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final category = _categoryMeta(item);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ScalePress(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: _cardDecoration,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: category.bg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(category.icon, color: category.color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: category.bg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            category.label,
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: category.color,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _dateIso(item.createdAt),
                          style: WargaBerandaText.greeting().copyWith(
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.title,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: WargaBerandaColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.contentPreview,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        color: WargaBerandaColors.textSecondary,
                        height: 1.35,
                      ),
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

  static ({String label, Color color, Color bg, IconData icon}) _categoryMeta(
    AnnouncementModel item,
  ) {
    final t = item.title.toLowerCase();
    if (t.contains('kerja bakti') || t.contains('gotong')) {
      return (
        label: 'KERJA BAKTI',
        color: const Color(0xFFBA7517),
        bg: WargaBerandaColors.accentYellow,
        icon: Icons.cleaning_services_rounded,
      );
    }
    return (
      label: 'INFO',
      color: WargaBerandaColors.primary,
      bg: WargaBerandaColors.accentGreen,
      icon: Icons.campaign_rounded,
    );
  }

  static String _dateIso(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }
}

// ── Layout & komponen bersama (semua tab Warga) ───────────────────────────

/// Dekorasi kartu standar — dipakai di Iuran, Info, Profil.
BoxDecoration wargaCardDecoration({double radius = 14}) => BoxDecoration(
      color: WargaBerandaColors.card,
      borderRadius: BorderRadius.circular(radius),
      border: Border.all(color: WargaBerandaColors.border),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.05),
          blurRadius: 8,
          offset: const Offset(0, 2),
        ),
      ],
    );

/// Pull-to-refresh: tarik ke bawah → loading di atas kartu (bukan di tengah layar).
class WargaPullRefresh extends StatelessWidget {
  final Future<void> Function() onRefresh;
  final Widget child;

  const WargaPullRefresh({
    super.key,
    required this.onRefresh,
    required this.child,
  });

  /// Agar refresh bisa ditarik meski konten belum penuh satu layar.
  static ScrollPhysics listPhysics([ScrollPhysics? base]) {
    return AlwaysScrollableScrollPhysics(parent: base ?? AppScroll.physics);
  }

  @override
  Widget build(BuildContext context) {
    return NotificationListener<OverscrollIndicatorNotification>(
      onNotification: (notification) {
        notification.disallowIndicator();
        return false;
      },
      child: RefreshIndicator(
        onRefresh: onRefresh,
        color: WargaBerandaColors.primaryGreen,
        backgroundColor: WargaBerandaColors.card,
        strokeWidth: 2.5,
        displacement: 52,
        edgeOffset: 0,
        triggerMode: RefreshIndicatorTriggerMode.onEdge,
        child: child,
      ),
    );
  }
}

/// Scaffold ringan: background hijau muda + SafeArea + refresh opsional.
class WargaPageBody extends StatelessWidget {
  final bool loading;
  final Widget? loadingWidget;
  final Future<void> Function()? onRefresh;
  final List<Widget> children;
  final double extraBottomPadding;

  const WargaPageBody({
    super.key,
    this.loading = false,
    this.loadingWidget,
    this.onRefresh,
    required this.children,
    this.extraBottomPadding = 88,
  });

  EdgeInsets _padding(BuildContext context) {
    final h = MediaQuery.sizeOf(context).width * 0.05;
    final side = h.clamp(16.0, 24.0);
    return EdgeInsets.fromLTRB(side, 12, side, 24 + extraBottomPadding);
  }

  @override
  Widget build(BuildContext context) {
    if (loading && loadingWidget != null) {
      return ColoredBox(color: WargaBerandaColors.bgColor, child: loadingWidget!);
    }

    final refreshable = onRefresh != null;
    final list = ListView(
      physics: refreshable ? WargaPullRefresh.listPhysics() : AppScroll.physics,
      padding: _padding(context),
      children: children,
    );

    Widget body = list;
    if (refreshable) {
      body = WargaPullRefresh(onRefresh: onRefresh!, child: list);
    }

    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(child: body),
    );
  }
}

/// Judul halaman tab (Iuran / Info / Profil).
class WargaPageHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? trailing;

  const WargaPageHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 22,
                  fontWeight: FontWeight.w600,
                  color: WargaBerandaColors.textPrimary,
                  height: 1.2,
                ),
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 4),
                Text(subtitle!, style: WargaBerandaText.greeting().copyWith(fontSize: 14)),
              ],
            ],
          ),
        ),
        if (trailing != null) trailing!,
      ],
    );
  }
}

/// Kartu putih dengan border & shadow konsisten Beranda.
class WargaCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;

  const WargaCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Widget content = Container(
      width: double.infinity,
      padding: padding,
      decoration: wargaCardDecoration(),
      child: child,
    );
    if (onTap == null) return content;
    return ScalePress(
      onTap: onTap!,
      pressedScale: 0.98,
      child: content,
    );
  }
}

/// Tombol utama hijau (bayar iuran, dll.).
class WargaPrimaryButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onPressed;

  const WargaPrimaryButton({
    super.key,
    required this.label,
    this.icon,
    this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: onPressed,
        icon: icon != null ? Icon(icon, size: 22) : const SizedBox.shrink(),
        label: Text(
          label,
          style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: WargaBerandaColors.primaryGreen,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}

/// Baris menu dengan ikon berwarna (Profil, pengaturan).
class WargaMenuTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const WargaMenuTile({
    super.key,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: ScalePress(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: wargaCardDecoration(),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w500,
                        fontSize: 15,
                        color: WargaBerandaColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(subtitle, style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: WargaBerandaColors.textSecondary, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

/// State kosong ramah untuk list.
class WargaEmptyState extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String message;

  const WargaEmptyState({
    super.key,
    this.icon = Icons.inbox_rounded,
    this.iconColor = WargaBerandaColors.primaryGreen,
    this.iconBg = WargaBerandaColors.lightGreen,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Center(
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: iconBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 36),
            ),
            const SizedBox(height: 14),
            Text(
              message,
              textAlign: TextAlign.center,
              style: WargaBerandaText.greeting().copyWith(fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

/// Badge jumlah (mis. pengumuman di tab Info).
class WargaCountBadge extends StatelessWidget {
  final int count;

  const WargaCountBadge({super.key, required this.count});

  @override
  Widget build(BuildContext context) {
    if (count <= 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: WargaBerandaColors.lightGreen,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '$count',
        style: GoogleFonts.poppins(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: WargaBerandaColors.primaryGreen,
        ),
      ),
    );
  }
}

/// Pemilih periode iuran (panah kiri/kanan).
class WargaPeriodSelector extends StatelessWidget {
  final String periodLabel;
  final bool canPrev;
  final bool canNext;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;

  const WargaPeriodSelector({
    super.key,
    required this.periodLabel,
    required this.canPrev,
    required this.canNext,
    this.onPrev,
    this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: wargaCardDecoration(),
      child: Row(
        children: [
          IconButton(
            onPressed: canPrev ? onPrev : null,
            icon: Icon(
              Icons.chevron_left_rounded,
              color: canPrev ? WargaBerandaColors.primaryGreen : WargaBerandaColors.border,
            ),
          ),
          Expanded(
            child: Column(
              children: [
                Text('Periode', style: WargaBerandaText.labelCaps()),
                const SizedBox(height: 2),
                Text(
                  periodLabel,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: WargaBerandaColors.primaryGreen,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: canNext ? onNext : null,
            icon: Icon(
              Icons.chevron_right_rounded,
              color: canNext ? WargaBerandaColors.primaryGreen : WargaBerandaColors.border,
            ),
          ),
        ],
      ),
    );
  }
}

/// Satu baris riwayat dalam kartu bergroup.
class WargaHistoryRow extends StatelessWidget {
  final String title;
  final String subtitle;
  final String amountLabel;
  final bool success;

  const WargaHistoryRow({
    super.key,
    required this.title,
    required this.subtitle,
    required this.amountLabel,
    this.success = true,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Icon(
            success ? Icons.check_circle_rounded : Icons.schedule_rounded,
            color: success ? WargaBerandaColors.primaryGreen : WargaBerandaColors.dangerRed,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w500,
                    fontSize: 14,
                    color: WargaBerandaColors.textPrimary,
                  ),
                ),
                Text(subtitle, style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
              ],
            ),
          ),
          Text(
            amountLabel,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: WargaBerandaColors.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }
}
