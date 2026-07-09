import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/app_theme.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Kartu statistik 2x2 untuk dashboard warga (legacy / ketua).
class WargaStatGrid extends StatelessWidget {
  final String iuranStatus;
  final bool iuranLunas;
  final String pengumumanLabel;
  final String suratLabel;
  final String iuranBulanLabel;

  const WargaStatGrid({
    super.key,
    required this.iuranStatus,
    required this.iuranLunas,
    required this.pengumumanLabel,
    required this.suratLabel,
    required this.iuranBulanLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _LegacyStat(
                icon: Icons.credit_card_rounded,
                color: iuranLunas ? WargaBerandaColors.primaryGreen : WargaBerandaColors.dangerRed,
                value: iuranStatus,
                label: 'Status Iuran',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _LegacyStat(
                icon: Icons.campaign_rounded,
                color: const Color(0xFF185FA5),
                value: pengumumanLabel,
                label: 'Pengumuman',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _LegacyStat(
                icon: Icons.description_rounded,
                color: const Color(0xFFBA7517),
                value: suratLabel,
                label: 'Surat Aktif',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _LegacyStat(
                icon: Icons.payments_rounded,
                color: WargaBerandaColors.primaryGreen,
                value: iuranBulanLabel,
                label: 'Iuran Bulan Ini',
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _LegacyStat extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const _LegacyStat({
    required this.icon,
    required this.color,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: wargaCardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15, color: WargaBerandaColors.textPrimary),
          ),
          Text(label, style: WargaBerandaText.labelCaps()),
        ],
      ),
    );
  }
}

class WargaProfileHeaderCard extends StatelessWidget {
  final String fullName;
  final String phone;
  final String roleLabel;
  final String? avatarUrl;
  final VoidCallback? onEditProfile;

  const WargaProfileHeaderCard({
    super.key,
    required this.fullName,
    required this.phone,
    required this.roleLabel,
    this.avatarUrl,
    this.onEditProfile,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [WargaBerandaColors.primaryGreen, WargaBerandaColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                WargaProfileAvatar(
                  imageUrl: avatarUrl,
                  fullName: fullName,
                  radius: 32,
                  onTap: onEditProfile,
                  showCameraBadge: onEditProfile != null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        fullName,
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.person_rounded, size: 14, color: Colors.white),
                            const SizedBox(width: 4),
                            Text(
                              roleLabel,
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(Icons.phone_rounded, size: 14, color: Colors.white.withValues(alpha: 0.85)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              phone,
                              style: GoogleFonts.poppins(
                                color: Colors.white.withValues(alpha: 0.88),
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
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

class WargaMembershipCard extends StatelessWidget {
  final String displayLabel;
  final String subtitle;
  final bool isActive;
  final VoidCallback? onTap;

  const WargaMembershipCard({
    super.key,
    required this.displayLabel,
    required this.subtitle,
    required this.isActive,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: wargaCardDecoration().copyWith(
          border: Border.all(
            color: isActive ? WargaBerandaColors.primaryGreen : WargaBerandaColors.border,
            width: isActive ? 1.5 : 1,
          ),
          color: isActive ? WargaBerandaColors.lightGreen.withValues(alpha: 0.35) : WargaBerandaColors.card,
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: WargaBerandaColors.lightGreen,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.home_rounded, color: WargaBerandaColors.primaryGreen, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    displayLabel,
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                      color: WargaBerandaColors.textPrimary,
                    ),
                  ),
                  Text(subtitle, style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                ],
              ),
            ),
            if (isActive)
              const Icon(Icons.check_circle_rounded, color: WargaBerandaColors.primaryGreen)
            else
              const Icon(Icons.chevron_right_rounded, color: WargaBerandaColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

class WargaAccessRow extends StatelessWidget {
  final String label;
  final bool active;

  const WargaAccessRow({super.key, required this.label, required this.active});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: GoogleFonts.poppins(fontSize: 14, color: WargaBerandaColors.textPrimary),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: active ? WargaBerandaColors.lightGreen : WargaBerandaColors.border.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              active ? 'Aktif' : 'Tidak',
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: active ? WargaBerandaColors.primaryGreen : WargaBerandaColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class WargaInfoRow extends StatelessWidget {
  final String label;
  final String value;

  const WargaInfoRow({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: WargaBerandaText.greeting().copyWith(fontSize: 14))),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: WargaBerandaColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class WargaIuranStatusCard extends StatelessWidget {
  final String periodLabel;
  final bool isPaid;
  final String? paidDateLabel;
  final double amount;
  final String houseLabel;

  const WargaIuranStatusCard({
    super.key,
    required this.periodLabel,
    required this.isPaid,
    this.paidDateLabel,
    required this.amount,
    required this.houseLabel,
  });

  @override
  Widget build(BuildContext context) {
    final gradient = isPaid
        ? const [WargaBerandaColors.primaryGreen, WargaBerandaColors.primaryDark]
        : const [WargaBerandaColors.dangerRed, Color(0xFFB91C1C)];

    return ClipRRect(
      borderRadius: BorderRadius.circular(18),
      child: Stack(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient, begin: Alignment.topLeft, end: Alignment.bottomRight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Status Iuran $periodLabel',
                  style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.88), fontSize: 13),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      isPaid ? Icons.check_circle_outline : Icons.warning_amber_rounded,
                      color: Colors.white,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isPaid ? 'Lunas' : 'Belum bayar',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                if (isPaid && paidDateLabel != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Dibayar $paidDateLabel',
                    style: GoogleFonts.poppins(color: Colors.white.withValues(alpha: 0.85), fontSize: 13),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _meta('Nominal', '${AppTheme.formatRupiah(amount)}/bulan'),
                    ),
                    Expanded(child: _meta('RT/RW', houseLabel)),
                  ],
                ),
              ],
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
        ],
      ),
    );
  }

  Widget _meta(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.poppins(color: Colors.white60, fontSize: 11)),
        Text(
          value,
          style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ],
    );
  }
}

class WargaRtProgressCard extends StatelessWidget {
  final int paidCount;
  final int totalWarga;

  const WargaRtProgressCard({super.key, required this.paidCount, required this.totalWarga});

  @override
  Widget build(BuildContext context) {
    final ratio = totalWarga <= 0 ? 0.0 : paidCount / totalWarga;
    final unpaid = (totalWarga - paidCount).clamp(0, totalWarga);

    return WargaCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Ringkasan RT', style: WargaBerandaText.sectionTitle()),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: Text('Warga sudah bayar', style: WargaBerandaText.greeting())),
              Text(
                '$paidCount / $totalWarga',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  color: WargaBerandaColors.primaryGreen,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: ratio,
              minHeight: 8,
              backgroundColor: WargaBerandaColors.accentYellow,
              color: WargaBerandaColors.primaryGreen,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            paidCount > 0
                ? (unpaid > 0 ? '$unpaid warga belum bayar bulan ini.' : 'Semua warga sudah bayar bulan ini.')
                : 'Belum ada pembayaran iuran bulan ini di RT Anda.',
            style: WargaBerandaText.greeting().copyWith(fontSize: 12, height: 1.4),
          ),
        ],
      ),
    );
  }
}

void showHubungiRtSheet(BuildContext context, {required String ketuaName, required String phone}) {
  showModalBottomSheet(
    context: context,
    backgroundColor: WargaBerandaColors.card,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Hubungi RT', style: WargaBerandaText.sectionTitle()),
          const SizedBox(height: 12),
          Text(ketuaName, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text(phone, style: WargaBerandaText.greeting()),
          const SizedBox(height: 20),
          WargaPrimaryButton(
            label: 'Salin Nomor',
            icon: Icons.copy_rounded,
            onPressed: phone.isEmpty
                ? null
                : () {
                    Clipboard.setData(ClipboardData(text: phone));
                    Navigator.pop(context);
                  },
          ),
        ],
      ),
    ),
  );
}
