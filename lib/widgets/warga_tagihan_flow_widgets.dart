import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/app_theme.dart';
import '../models/rt_unit_model.dart';
import '../utils/period_grouping.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Kartu merah TOTAL TAGIHAN (halaman Tagihan Iuran).
class WargaTagihanHeroCard extends StatelessWidget {
  final double total;
  final int bulanTertunggak;
  final int daysLate;

  const WargaTagihanHeroCard({
    super.key,
    required this.total,
    required this.bulanTertunggak,
    required this.daysLate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE24B4A), Color(0xFFB91C1C)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: WargaBerandaColors.dangerRed.withValues(alpha: 0.35),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.white.withValues(alpha: 0.9), size: 16),
              const SizedBox(width: 6),
              Text(
                'TOTAL TAGIHAN',
                style: GoogleFonts.poppins(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            AppTheme.formatRupiah(total),
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w700,
              height: 1.1,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '$bulanTertunggak bulan tertunggak',
                style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.88), fontSize: 12),
              ),
              if (daysLate > 0) ...[
                Text(' · ', style: TextStyle(color: Colors.white.withValues(alpha: 0.6))),
                Icon(Icons.calendar_today_outlined, size: 12, color: Colors.white.withValues(alpha: 0.88)),
                const SizedBox(width: 4),
                Text(
                  'Terlambat $daysLate hari',
                  style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.88), fontSize: 12),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

/// Strip kuning — menunggu verifikasi Bendahara.
class WargaMenungguVerifikasiCard extends StatelessWidget {
  final IuranRecordModel bill;
  final VoidCallback? onTap;

  const WargaMenungguVerifikasiCard({super.key, required this.bill, this.onTap});

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3E0),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.schedule_rounded, color: Color(0xFFEA580C), size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(iuranPeriodTitle(bill), style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
                  const SizedBox(height: 4),
                  Text(
                    '${bill.paymentMethodLabel} · Diajukan ${bill.submittedDateLabel}',
                    style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  AppTheme.formatRupiah(bill.amount),
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'VERIFIKASI',
                    style: GoogleFonts.poppins(
                      fontSize: 9,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFEA580C),
                    ),
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

/// Item tagihan bulanan — pilih, expand rincian, bayar.
class WargaTagihanBillTile extends StatelessWidget {
  final IuranRecordModel bill;
  final bool selected;
  final bool expanded;
  final VoidCallback onToggleSelect;
  final VoidCallback onToggleExpand;

  const WargaTagihanBillTile({
    super.key,
    required this.bill,
    required this.selected,
    required this.expanded,
    required this.onToggleSelect,
    required this.onToggleExpand,
  });

  static List<({String label, double amount})> lineItems(IuranRecordModel bill) {
    final half = bill.amount / 2;
    return [
      (label: 'Keamanan', amount: half),
      (label: 'Kebersihan', amount: half),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final late = daysLateFromPeriodKey(bill.periodKey);
    final items = lineItems(bill);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: WargaBerandaColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: selected ? WargaBerandaColors.dangerRed : WargaBerandaColors.border,
          width: selected ? 1.5 : 1,
        ),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onToggleExpand,
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Row(
                children: [
                  ScalePress(
                    onTap: onToggleSelect,
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: selected ? WargaBerandaColors.dangerRed : Colors.transparent,
                        border: Border.all(
                          color: selected ? WargaBerandaColors.dangerRed : WargaBerandaColors.border,
                          width: 2,
                        ),
                      ),
                      child: selected
                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                          : null,
                    ),
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
                                iuranPeriodTitle(bill),
                                style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15),
                              ),
                            ),
                            if (late > 0) ...[
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: WargaBerandaColors.lightRed,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  'TERLAMBAT ${late}H',
                                  style: GoogleFonts.poppins(
                                    fontSize: 8,
                                    fontWeight: FontWeight.w700,
                                    color: WargaBerandaColors.dangerRed,
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text('${items.length} item', style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        AppTheme.formatRupiah(bill.amount),
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        expanded ? 'Sembunyikan ∨' : 'Lihat Rincian >',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: WargaBerandaColors.dangerRed,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (expanded) ...[
            const Divider(height: 1, color: WargaBerandaColors.border),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 10, 14, 14),
              child: Column(
                children: [
                  for (final item in items)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Icon(
                            item.label == 'Keamanan' ? Icons.shield_outlined : Icons.auto_awesome_outlined,
                            size: 18,
                            color: WargaBerandaColors.textSecondary,
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(item.label, style: WargaBerandaText.greeting())),
                          Text(
                            AppTheme.formatRupiah(item.amount),
                            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  const Divider(height: 1, color: WargaBerandaColors.border),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Subtotal', style: WargaBerandaText.greeting().copyWith(fontWeight: FontWeight.w600)),
                      Text(
                        AppTheme.formatRupiah(bill.amount),
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

/// Bar bawah — bayar tagihan terpilih.
class WargaTagihanPayBar extends StatelessWidget {
  final int count;
  final double total;
  final VoidCallback onPay;

  const WargaTagihanPayBar({
    super.key,
    required this.count,
    required this.total,
    required this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(20, 14, 20, 14 + MediaQuery.paddingOf(context).bottom),
      decoration: BoxDecoration(
        color: WargaBerandaColors.dangerRed,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$count TAGIHAN DIPILIH',
                  style: GoogleFonts.poppins(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.3,
                  ),
                ),
                Text(
                  AppTheme.formatRupiah(total),
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          ScalePress(
            onTap: onPay,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withValues(alpha: 0.35)),
              ),
              child: Row(
                children: [
                  Text('Bayar', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right_rounded, color: Colors.white),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class WargaPaymentMethodTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const WargaPaymentMethodTile({
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
    return ScalePress(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: wargaCardDecoration(),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: iconColor, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
                  Text(subtitle, style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: WargaBerandaColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

class WargaUploadBuktiBox extends StatelessWidget {
  final VoidCallback onTap;
  final String? imagePath;

  const WargaUploadBuktiBox({super.key, required this.onTap, this.imagePath});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: imagePath != null ? 160 : 120,
        decoration: BoxDecoration(
          color: const Color(0xFFF0F9FF),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBAE6FD), width: 1.5, strokeAlign: BorderSide.strokeAlignInside),
        ),
        child: imagePath != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(File(imagePath!), fit: BoxFit.cover, width: double.infinity, height: double.infinity),
              )
            : _placeholder(),
      ),
    );
  }

  Widget _placeholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(color: Color(0xFFE0F2FE), shape: BoxShape.circle),
          child: const Icon(Icons.upload_rounded, color: Color(0xFF0284C7), size: 28),
        ),
        const SizedBox(height: 10),
        Text('Tap untuk upload bukti', style: WargaBerandaText.greeting().copyWith(fontWeight: FontWeight.w600)),
        Text('JPG, PNG — maks 5MB', style: WargaBerandaText.greeting().copyWith(fontSize: 11)),
      ],
    );
  }
}
