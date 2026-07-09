import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/app_theme.dart';
import '../models/profile_model.dart';
import '../models/rt_unit_model.dart';
import '../utils/period_grouping.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

class WargaPageSummaryDarkCard extends StatelessWidget {
  final double saldo;
  final double totalKeluar;

  const WargaPageSummaryDarkCard({
    super.key,
    required this.saldo,
    required this.totalKeluar,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.account_balance_wallet_outlined,
                        color: Colors.white.withValues(alpha: 0.7), size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'SALDO KAS RT',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.65),
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  AppTheme.formatRupiah(saldo),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          Container(width: 1, height: 52, color: Colors.white.withValues(alpha: 0.15)),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  'TOTAL PENGELUARAN',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.65),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  AppTheme.formatRupiah(totalKeluar),
                  style: const TextStyle(
                    color: Color(0xFFF87171),
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class WargaEmergencyBannerCard extends StatelessWidget {
  final String rtLine;

  const WargaEmergencyBannerCard({super.key, required this.rtLine});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFFE24B4A), Color(0xFFB91C1C)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: WargaBerandaColors.dangerRed.withValues(alpha: 0.35),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.emergency_rounded, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hubungi Pengurus RT',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  rtLine,
                  style: GoogleFonts.poppins(
                    color: Colors.white.withValues(alpha: 0.92),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class WargaPengurusContactCard extends StatelessWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback onCall;
  final VoidCallback onWhatsApp;

  const WargaPengurusContactCard({
    super.key,
    required this.profile,
    required this.rt,
    required this.onCall,
    required this.onWhatsApp,
  });

  String get _roleLine {
    if (profile.isKetua) return 'Ketua RT ${rt.rtNumber}';
    if (profile.isBendahara) return 'Bendahara RT ${rt.rtNumber}';
    return profile.roleLabel;
  }

  Color get _roleColor {
    if (profile.isBendahara) return const Color(0xFFEA580C);
    return WargaBerandaColors.primaryGreen;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: wargaCardDecoration(),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: WargaProfileAvatar(
              imageUrl: profile.avatarUrl,
              fullName: profile.fullName,
              radius: 28,
              showCameraBadge: false,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  profile.fullName,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 15),
                ),
                const SizedBox(height: 2),
                Text(
                  _roleLine,
                  style: GoogleFonts.poppins(
                    color: _roleColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  profile.phone.isNotEmpty ? profile.phone : 'Nomor belum diisi',
                  style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
          _ContactActionButton(
            icon: Icons.phone_rounded,
            color: _roleColor,
            onTap: onCall,
          ),
          const SizedBox(width: 8),
          _ContactActionButton(
            icon: Icons.chat_rounded,
            color: WargaBerandaColors.primaryGreen,
            onTap: onWhatsApp,
          ),
        ],
      ),
    );
  }
}

class _ContactActionButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _ContactActionButton({
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      child: Container(
        width: 42,
        height: 42,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: color.withValues(alpha: 0.45)),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
    );
  }
}

class WargaIuranTabSwitcher extends StatelessWidget {
  final int selectedIndex;
  final int unpaidCount;
  final int paidCount;
  final ValueChanged<int> onChanged;

  const WargaIuranTabSwitcher({
    super.key,
    required this.selectedIndex,
    required this.unpaidCount,
    required this.paidCount,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          Expanded(
            child: _TabChip(
              label: 'Belum Bayar',
              badge: unpaidCount,
              badgeColor: AppTheme.danger,
              selected: selectedIndex == 0,
              onTap: () => onChanged(0),
            ),
          ),
          Expanded(
            child: _TabChip(
              label: 'Sudah Bayar',
              badge: paidCount,
              badgeColor: AppTheme.emerald,
              selected: selectedIndex == 1,
              onTap: () => onChanged(1),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  final String label;
  final int badge;
  final Color badgeColor;
  final bool selected;
  final VoidCallback onTap;

  const _TabChip({
    required this.label,
    required this.badge,
    required this.badgeColor,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppTheme.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: selected
                ? [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  fontSize: 13,
                  color: selected ? AppTheme.textPrimary : AppTheme.textSecondary,
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$badge',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      color: badgeColor,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class WargaKontribusiSummaryCard extends StatelessWidget {
  final double total;
  final int bulanCount;
  final bool paid;

  const WargaKontribusiSummaryCard({
    super.key,
    required this.total,
    required this.bulanCount,
    required this.paid,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.account_balance_wallet_rounded,
                color: Color(0xFF2563EB), size: 28),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  paid ? 'TOTAL KONTRIBUSI ANDA' : 'TOTAL TAGIHAN ANDA',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textSecondary,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  AppTheme.formatRupiah(total),
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: paid ? AppTheme.emerald : AppTheme.danger,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  paid
                      ? '$bulanCount bulan sudah dibayar'
                      : '$bulanCount bulan belum dibayar',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

ThemeData _nestedExpansionTheme(BuildContext context) {
  return Theme.of(context).copyWith(
    dividerColor: Colors.transparent,
    splashColor: AppTheme.emerald.withValues(alpha: 0.06),
    highlightColor: AppTheme.emerald.withValues(alpha: 0.04),
  );
}

class WargaKontribusiHeroCard extends StatelessWidget {
  final double total;
  final int bulanCount;

  const WargaKontribusiHeroCard({
    super.key,
    required this.total,
    required this.bulanCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFF3B82F6), Color(0xFF60A5FA)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3B82F6).withValues(alpha: 0.35),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.account_balance_wallet_outlined, color: Colors.white.withValues(alpha: 0.9), size: 18),
                    const SizedBox(width: 6),
                    Text(
                      'TOTAL KONTRIBUSI',
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.92),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.4,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  AppTheme.formatRupiah(total),
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  bulanCount > 0 ? '$bulanCount bulan sudah dibayar' : 'Belum ada pembayaran lunas',
                  style: GoogleFonts.poppins(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.22),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_rounded, color: Colors.white, size: 28),
          ),
        ],
      ),
    );
  }
}

class WargaPaidIuranCard extends StatelessWidget {
  final IuranRecordModel record;

  const WargaPaidIuranCard({super.key, required this.record});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: wargaCardDecoration(),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: WargaBerandaColors.lightGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_rounded, color: WargaBerandaColors.primaryGreen, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  iuranPeriodTitle(record),
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 2),
                Text(
                  iuranPaidSubtitle(record),
                  style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            AppTheme.formatRupiah(record.amount),
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w700,
              fontSize: 14,
              color: WargaBerandaColors.primaryGreen,
            ),
          ),
        ],
      ),
    );
  }
}

class WargaYearExpansionTile extends StatelessWidget {
  final int year;
  final int monthCount;
  final String trailingAmount;
  final Color trailingColor;
  final List<Widget> children;
  final bool accentBadge;

  const WargaYearExpansionTile({
    super.key,
    required this.year,
    required this.monthCount,
    required this.trailingAmount,
    required this.trailingColor,
    required this.children,
    this.accentBadge = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF9FAFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border.withValues(alpha: 0.55)),
      ),
      child: Theme(
        data: _nestedExpansionTheme(context),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
          childrenPadding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Text(
                '$year',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: accentBadge
                      ? WargaBerandaColors.lightGreen
                      : const Color(0xFFE5E7EB),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$monthCount bulan',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: accentBadge ? WargaBerandaColors.primaryGreen : AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          trailing: Text(
            trailingAmount,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 14,
              color: trailingColor,
            ),
          ),
          children: children,
        ),
      ),
    );
  }
}

/// Level 2: bulan (nested di dalam tahun).
class WargaMonthExpansionTile extends StatelessWidget {
  final String monthTitle;
  final int itemCount;
  final String trailingAmount;
  final Color trailingColor;
  final List<Widget> children;

  const WargaMonthExpansionTile({
    super.key,
    required this.monthTitle,
    required this.itemCount,
    required this.trailingAmount,
    required this.trailingColor,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final countLabel = itemCount == 1 ? '1 transaksi' : '$itemCount transaksi';

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border.withValues(alpha: 0.45)),
        ),
        child: Theme(
          data: _nestedExpansionTheme(context),
          child: ExpansionTile(
            tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
            childrenPadding: const EdgeInsets.fromLTRB(10, 0, 10, 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            title: Row(
              children: [
                Expanded(
                  child: Text(
                    monthTitle,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  countLabel,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ],
            ),
            trailing: Text(
              trailingAmount,
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13,
                color: trailingColor,
              ),
            ),
            children: children,
          ),
        ),
      ),
    );
  }
}

/// Level 3: kartu transaksi kas (pengeluaran).
class WargaKasTransactionCard extends StatelessWidget {
  final KasTransactionModel tx;

  const WargaKasTransactionCard({super.key, required this.tx});

  static ({IconData icon, Color color, Color bg, String label}) _meta(KasTransactionModel tx) {
    final c = (tx.category ?? tx.description).toLowerCase();
    if (c.contains('util') || c.contains('listrik') || c.contains('air')) {
      return (
        icon: Icons.bolt_rounded,
        color: const Color(0xFF2563EB),
        bg: const Color(0xFFEFF6FF),
        label: 'UTILITAS',
      );
    }
    if (c.contains('iuran')) {
      return (
        icon: Icons.payments_rounded,
        color: AppTheme.emerald,
        bg: AppTheme.emeraldMuted,
        label: 'IURAN',
      );
    }
    return (
      icon: Icons.payments_rounded,
      color: const Color(0xFFD97706),
      bg: const Color(0xFFFFFBEB),
      label: 'OPERASIONAL',
    );
  }

  @override
  Widget build(BuildContext context) {
    final meta = _meta(tx);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: meta.bg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(meta.icon, color: meta.color, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    tx.description,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${meta.label} • ${tx.dateLabel}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                  if (tx.recorderName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Dicatat: ${tx.recorderName}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textHint),
                    ),
                  ],
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Icon(Icons.south_east_rounded, color: AppTheme.danger, size: 14),
                Text(
                  AppTheme.formatRupiah(tx.amount),
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    color: AppTheme.danger,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Level 3: kartu iuran per periode.
class WargaIuranPaymentCard extends StatelessWidget {
  final IuranRecordModel record;
  final bool paid;
  final VoidCallback? onPay;

  const WargaIuranPaymentCard({
    super.key,
    required this.record,
    required this.paid,
    this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    final title = iuranPeriodTitle(record);
    final subtitle = paid ? iuranPaidSubtitle(record) : 'Belum dibayar';
    final amountColor = paid ? AppTheme.emerald : AppTheme.danger;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border.withValues(alpha: 0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: paid ? AppTheme.emeraldMuted : const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    paid ? Icons.check_circle_rounded : Icons.schedule_rounded,
                    color: amountColor,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: TextStyle(fontSize: 11, color: amountColor),
                      ),
                    ],
                  ),
                ),
                Text(
                  AppTheme.formatRupiah(record.amount),
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                    color: amountColor,
                  ),
                ),
              ],
            ),
            if (!paid && onPay != null) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: onPay,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.emerald,
                    side: const BorderSide(color: AppTheme.emerald),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  child: Text('Bayar $title'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
