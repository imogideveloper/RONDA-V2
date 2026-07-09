import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/app_theme.dart';
import '../config/app_toast.dart';
import '../models/rt_unit_model.dart';
import '../utils/period_grouping.dart';
import 'warga_beranda_widgets.dart';

/// Data status untuk hero iuran.
class IuranStatusUi {
  final String label;
  final String subtitle;
  final Color accent;
  final Color accentBg;
  final IconData icon;

  const IuranStatusUi({
    required this.label,
    required this.subtitle,
    required this.accent,
    required this.accentBg,
    required this.icon,
  });

  static IuranStatusUi fromBill(IuranRecordModel? bill) {
    if (bill == null) {
      return const IuranStatusUi(
        label: 'Belum ada tagihan',
        subtitle: 'Tagihan bulan ini akan muncul otomatis.',
        accent: WargaBerandaColors.textSecondary,
        accentBg: Color(0xFFF3F4F6),
        icon: Icons.info_outline_rounded,
      );
    }
    if (bill.isPaid) {
      return IuranStatusUi(
        label: 'Lunas',
        subtitle: 'Terima kasih, iuran ${iuranPeriodTitle(bill)} sudah lunas.',
        accent: WargaBerandaColors.primaryGreen,
        accentBg: WargaBerandaColors.lightGreen,
        icon: Icons.check_circle_rounded,
      );
    }
    if (bill.isAwaitingVerification) {
      return IuranStatusUi(
        label: 'Menunggu verifikasi',
        subtitle: 'Bukti ${iuranPeriodTitle(bill)} sedang dicek Bendahara RT.',
        accent: const Color(0xFF92400E),
        accentBg: const Color(0xFFFEF3C7),
        icon: Icons.hourglass_top_rounded,
      );
    }
    return IuranStatusUi(
      label: 'Belum bayar',
      subtitle:
          'Jatuh tempo ${iuranDueDateLabel(bill.periodKey)} · ${formatRupiahCompact(bill.amount)}',
      accent: WargaBerandaColors.dangerRed,
      accentBg: const Color(0xFFFEE2E2),
      icon: Icons.schedule_rounded,
    );
  }
}

/// Hero tetap di atas — judul + kartu status putih (refresh tidak mengganggu).
class WargaIuranHeroSection extends StatelessWidget {
  final IuranRecordModel? currentBill;
  final String rtLabel;
  final Widget? rtSwitcher;

  const WargaIuranHeroSection({
    super.key,
    required this.currentBill,
    required this.rtLabel,
    this.rtSwitcher,
  });

  @override
  Widget build(BuildContext context) {
    final bill = currentBill;
    final periodTitle = bill != null ? iuranPeriodTitle(bill) : '—';
    final badge = bill != null ? iuranPeriodBadge(bill.periodKey) : null;
    final status = IuranStatusUi.fromBill(bill);

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E40AF), Color(0xFF3B82F6), Color(0xFF60A5FA)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            right: -30,
            top: -20,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.08),
              ),
            ),
          ),
          Positioned(
            left: -40,
            bottom: 40,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.06),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Iuran Saya',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    height: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Periode $periodTitle',
                  style: GoogleFonts.poppins(
                    color: Colors.white.withValues(alpha: 0.92),
                    fontSize: 14,
                  ),
                ),
                if (rtSwitcher != null) ...[
                  const SizedBox(height: 14),
                  rtSwitcher!,
                ],
                const SizedBox(height: 20),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: status.accentBg,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(status.icon, color: status.accent, size: 26),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'STATUS IURAN',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.5,
                                color: WargaBerandaColors.textSecondary,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Text(
                                  status.label,
                                  style: GoogleFonts.poppins(
                                    fontSize: 22,
                                    fontWeight: FontWeight.w700,
                                    color: status.accent,
                                    height: 1.1,
                                  ),
                                ),
                                if (badge != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: WargaBerandaColors.bgColor,
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: WargaBerandaColors.border),
                                    ),
                                    child: Text(
                                      badge,
                                      style: GoogleFonts.poppins(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: WargaBerandaColors.textPrimary,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              status.subtitle,
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                height: 1.4,
                                color: WargaBerandaColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
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

/// Kelompok konten dengan judul — kartu putih rapi.
class WargaIuranSection extends StatelessWidget {
  final String title;
  final String? trailing;
  final List<Widget> children;

  const WargaIuranSection({
    super.key,
    required this.title,
    this.trailing,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Expanded(
              child: Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: WargaBerandaColors.textPrimary,
                ),
              ),
            ),
            if (trailing != null)
              Text(
                trailing!,
                style: WargaBerandaText.greeting().copyWith(fontSize: 12),
              ),
          ],
        ),
        const SizedBox(height: 14),
        ...children,
      ],
    );
  }
}

class WargaIuranQrisCard extends StatelessWidget {
  final String rtLabel;
  final double amount;
  final VoidCallback onScan;

  const WargaIuranQrisCard({
    super.key,
    required this.rtLabel,
    required this.amount,
    required this.onScan,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF2563EB),
      elevation: 0,
      shadowColor: const Color(0xFF2563EB).withValues(alpha: 0.35),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onScan,
        borderRadius: BorderRadius.circular(18),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.qr_code_2_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Bayar via QRIS',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '$rtLabel • ${formatRupiahCompact(amount)}',
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  'Scan',
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
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

class WargaIuranVirtualAccountCard extends StatelessWidget {
  final String rtNumber;
  final String accountNumber;
  final String accountName;

  const WargaIuranVirtualAccountCard({
    super.key,
    required this.rtNumber,
    required this.accountNumber,
    required this.accountName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: wargaCardDecoration(radius: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.account_balance_rounded,
                color: Color(0xFF2563EB),
                size: 22,
              ),
              const SizedBox(width: 10),
              Text(
                'Virtual Account Bank BRI',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: WargaBerandaColors.bgColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: WargaBerandaColors.border),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    accountNumber,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(
                    Icons.copy_rounded,
                    color: Color(0xFF2563EB),
                    size: 20,
                  ),
                  onPressed: () {
                    Clipboard.setData(
                      ClipboardData(text: accountNumber.replaceAll('-', '')),
                    );
                    AppToast.show(context, 'Nomor VA disalin');
                  },
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            accountName,
            style: WargaBerandaText.greeting().copyWith(fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class WargaIuranEwalletTile extends StatelessWidget {
  final String label;
  final String phone;
  final IconData icon;
  final Color color;

  const WargaIuranEwalletTile({
    super.key,
    required this.label,
    required this.phone,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: wargaCardDecoration(radius: 14),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 6),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              phone,
              style: WargaBerandaText.greeting().copyWith(fontSize: 10),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class WargaIuranHistoryCard extends StatelessWidget {
  final IuranRecordModel record;
  final VoidCallback? onPay;

  const WargaIuranHistoryCard({
    super.key,
    required this.record,
    required this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    final paid = record.isPaid;
    final awaiting = record.isAwaitingVerification;
    final title = iuranPeriodTitle(record);

    Color iconBg;
    Color iconColor;
    IconData icon;
    Color amountColor;
    String subtitle;
    String badge;
    Color badgeBg;
    Color badgeFg;

    if (paid) {
      iconBg = WargaBerandaColors.lightGreen;
      iconColor = WargaBerandaColors.primaryGreen;
      icon = Icons.check_circle_rounded;
      amountColor = WargaBerandaColors.primaryGreen;
      final d = record.paidAt;
      final dateStr = d != null
          ? '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}'
          : '—';
      subtitle = 'Dibayar tgl $dateStr via ${record.paymentMethodLabel}';
      badge = 'LUNAS';
      badgeBg = WargaBerandaColors.lightGreen;
      badgeFg = WargaBerandaColors.primaryGreen;
    } else if (awaiting) {
      iconBg = const Color(0xFFFEF3C7);
      iconColor = const Color(0xFF92400E);
      icon = Icons.hourglass_top_rounded;
      amountColor = const Color(0xFF92400E);
      subtitle = 'Menunggu verifikasi Bendahara';
      badge = 'PROSES';
      badgeBg = const Color(0xFFFEF3C7);
      badgeFg = const Color(0xFF92400E);
    } else {
      iconBg = const Color(0xFFFEE2E2);
      iconColor = WargaBerandaColors.dangerRed;
      icon = Icons.warning_amber_rounded;
      amountColor = WargaBerandaColors.dangerRed;
      subtitle = 'Belum dibayar';
      badge = 'BELUM';
      badgeBg = const Color(0xFFFEE2E2);
      badgeFg = WargaBerandaColors.dangerRed;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPay,
          borderRadius: BorderRadius.circular(14),
          child: Ink(
            decoration: wargaCardDecoration(radius: 14),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: iconBg,
                      shape: BoxShape.circle,
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
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            color: iconColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        formatRupiahCompact(record.amount),
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                          color: amountColor,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: badgeBg,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          badge,
                          style: GoogleFonts.poppins(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: badgeFg,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class WargaIuranTotalsCard extends StatelessWidget {
  final double paidTotal;
  final int paidMonths;
  final double unpaidTotal;
  final int unpaidMonths;

  const WargaIuranTotalsCard({
    super.key,
    required this.paidTotal,
    required this.paidMonths,
    required this.unpaidTotal,
    required this.unpaidMonths,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 20),
      decoration: BoxDecoration(
        color: const Color(0xFFECFEFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF99F6E4)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'TOTAL SUDAH DIBAYAR',
                  style: GoogleFonts.poppins(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: WargaBerandaColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  AppTheme.formatRupiah(paidTotal),
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                    color: WargaBerandaColors.primaryGreen,
                  ),
                ),
                Text(
                  '$paidMonths bulan',
                  style: WargaBerandaText.greeting().copyWith(fontSize: 11),
                ),
              ],
            ),
          ),
          Container(width: 1, height: 48, color: const Color(0xFF99F6E4)),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'TOTAL TERTUNGGAK',
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: WargaBerandaColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    AppTheme.formatRupiah(unpaidTotal),
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: const Color(0xFFEA580C),
                    ),
                  ),
                  Text(
                    '$unpaidMonths bulan',
                    style: WargaBerandaText.greeting().copyWith(fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class WargaIuranDownloadCard extends StatelessWidget {
  final String lastPaidLabel;
  final VoidCallback? onTap;

  const WargaIuranDownloadCard({
    super.key,
    required this.lastPaidLabel,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          decoration: wargaCardDecoration(radius: 14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: WargaBerandaColors.accentBlue,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.receipt_long_rounded,
                    color: Color(0xFF2563EB),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Download Bukti Bayar',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        'Terakhir: $lastPaidLabel',
                        style: WargaBerandaText.greeting().copyWith(
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: WargaBerandaColors.textSecondary,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
