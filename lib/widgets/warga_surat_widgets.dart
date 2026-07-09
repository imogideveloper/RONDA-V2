import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/rt_unit_model.dart';
import '../utils/period_grouping.dart';
import 'warga_beranda_widgets.dart';

/// Hero biru — ringkasan layanan surat RT.
class WargaSuratHeroCard extends StatelessWidget {
  final int jenisCount;
  final int pendingCount;
  final int approvedCount;

  const WargaSuratHeroCard({
    super.key,
    required this.jenisCount,
    required this.pendingCount,
    required this.approvedCount,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF60A5FA)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.3),
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
                        Icon(Icons.description_outlined, color: Colors.white.withValues(alpha: 0.9), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'LAYANAN SURAT RT',
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
                      '$jenisCount Jenis',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      pendingCount > 0
                          ? '$pendingCount permohonan menunggu'
                          : 'Ajukan surat untuk keperluan administrasi',
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.9),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.assignment_outlined, color: Colors.white, size: 32),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              _pill(Icons.description_outlined, '$jenisCount Jenis'),
              const SizedBox(width: 8),
              _pill(Icons.schedule_rounded, '$pendingCount Menunggu', highlight: pendingCount > 0),
              const SizedBox(width: 8),
              _pill(Icons.check_circle_outline, '$approvedCount Disetujui', success: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _pill(IconData icon, String label, {bool highlight = false, bool success = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: success ? 0.22 : 0.14),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 14,
              color: highlight ? const Color(0xFFFDE68A) : Colors.white.withValues(alpha: 0.95),
            ),
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

/// Toggle Permohonan Saya / Surat Disetujui.
class WargaSuratSegmentToggle extends StatelessWidget {
  final int selected;
  final int pendingBadge;
  final int approvedBadge;
  final ValueChanged<int> onChanged;

  const WargaSuratSegmentToggle({
    super.key,
    required this.selected,
    required this.pendingBadge,
    required this.approvedBadge,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE8ECE8),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          _tab(0, 'Permohonan Saya', pendingBadge),
          _tab(1, 'Surat Disetujui', approvedBadge),
        ],
      ),
    );
  }

  Widget _tab(int index, String label, int badge) {
    final active = selected == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => onChanged(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: active
                ? [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2))]
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  label,
                  style: GoogleFonts.poppins(
                    fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                    fontSize: 12,
                    color: active ? WargaBerandaColors.textPrimary : WargaBerandaColors.textSecondary,
                  ),
                ),
              ),
              if (badge > 0) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: index == 0 ? const Color(0xFFFEF3C7) : const Color(0xFFE5E7EB),
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    '$badge',
                    style: GoogleFonts.poppins(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: index == 0 ? const Color(0xFF92400E) : WargaBerandaColors.textSecondary,
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

/// Kartu jenis surat (accent kiri, badge SURAT / POPULER).
class WargaSuratTypeCard extends StatelessWidget {
  final WargaLayananSuratItem item;
  final VoidCallback onTap;

  const WargaSuratTypeCard({super.key, required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            decoration: wargaCardDecoration(radius: 16),
            child: IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 4,
                    decoration: BoxDecoration(
                      color: item.accentColor,
                      borderRadius: const BorderRadius.horizontal(left: Radius.circular(16)),
                    ),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(12, 14, 12, 14),
                      child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: item.iconBg,
                            shape: BoxShape.circle,
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
                                  _badge('SURAT', const Color(0xFF7C3AED), const Color(0xFFF3E8FF)),
                                  if (item.isPopular) ...[
                                    const SizedBox(width: 6),
                                    _badge('POPULER', Colors.white, const Color(0xFFEA580C)),
                                  ],
                                  const Spacer(),
                                  Icon(Icons.schedule, size: 12, color: WargaBerandaColors.textSecondary.withValues(alpha: 0.8)),
                                  const SizedBox(width: 4),
                                  Text(item.sla, style: WargaBerandaText.greeting().copyWith(fontSize: 11)),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                item.title,
                                style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                item.description,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: WargaBerandaText.greeting().copyWith(fontSize: 12, height: 1.35),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right_rounded, color: WargaBerandaColors.textSecondary),
                      ],
                    ),
                  ),
                ),
                ],
              ),
            ),
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

/// Kartu permohonan surat (menunggu / ditolak / disetujui).
class WargaSuratRequestCard extends StatelessWidget {
  final SuratRequestModel request;
  final String rtNumber;
  final VoidCallback? onReapply;

  const WargaSuratRequestCard({
    super.key,
    required this.request,
    required this.rtNumber,
    this.onReapply,
  });

  String get _dateLabel {
    final d = request.createdAt;
    return '${d.day} ${monthLabel(d.month)} ${d.year}';
  }

  @override
  Widget build(BuildContext context) {
    final pending = request.isPending;
    final rejected = request.isRejected;
    final approved = request.isApproved;

    Color badgeBg;
    Color badgeFg;
    IconData badgeIcon;
    String badgeLabel;

    if (approved) {
      badgeBg = WargaBerandaColors.lightGreen;
      badgeFg = WargaBerandaColors.primaryGreen;
      badgeIcon = Icons.check_circle;
      badgeLabel = 'Disetujui';
    } else if (rejected) {
      badgeBg = const Color(0xFFFEE2E2);
      badgeFg = WargaBerandaColors.dangerRed;
      badgeIcon = Icons.cancel_outlined;
      badgeLabel = 'Ditolak';
    } else {
      badgeBg = const Color(0xFFFEF3C7);
      badgeFg = const Color(0xFF92400E);
      badgeIcon = Icons.circle;
      badgeLabel = 'Menunggu';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: wargaCardDecoration(radius: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      request.suratType,
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${request.referenceCode(rtNumber)} · $_dateLabel',
                      style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(20),
                  border: rejected ? Border.all(color: badgeFg.withValues(alpha: 0.4)) : null,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(badgeIcon, size: 12, color: badgeFg),
                    const SizedBox(width: 4),
                    Text(
                      badgeLabel,
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: badgeFg,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (pending) ...[
            const SizedBox(height: 10),
            Text(
              request.purpose,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: WargaBerandaText.greeting().copyWith(fontSize: 12),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                _step('Diajukan', true),
                _connector(),
                _step('Menunggu', true),
                _connector(),
                _step('Disetujui', false),
              ],
            ),
          ],
          if (rejected && onReapply != null) ...[
            const SizedBox(height: 10),
            TextButton.icon(
              onPressed: onReapply,
              icon: const Icon(Icons.refresh_rounded, size: 18, color: WargaBerandaColors.dangerRed),
              label: Text(
                'Ajukan Ulang',
                style: GoogleFonts.poppins(
                  color: WargaBerandaColors.dangerRed,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _step(String label, bool active) {
    return Text(
      label,
      style: GoogleFonts.poppins(
        fontSize: 10,
        fontWeight: active ? FontWeight.w600 : FontWeight.w400,
        color: active ? WargaBerandaColors.primaryGreen : WargaBerandaColors.textSecondary,
      ),
    );
  }

  Widget _connector() => Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Text('→', style: WargaBerandaText.greeting().copyWith(fontSize: 10)),
      );
}

/// Stepper 2 langkah di form surat.
class WargaSuratFormStepper extends StatelessWidget {
  final int step;

  const WargaSuratFormStepper({super.key, required this.step});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _dot(1, 'Isi Data', step >= 0),
        Expanded(child: Container(height: 2, color: step >= 1 ? const Color(0xFF3B82F6) : const Color(0xFFE5E7EB))),
        _dot(2, 'Preview', step >= 1),
      ],
    );
  }

  Widget _dot(int n, String label, bool active) {
    return Column(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? const Color(0xFF3B82F6) : Colors.transparent,
            border: Border.all(color: active ? const Color(0xFF3B82F6) : const Color(0xFFD1D5DB), width: 2),
          ),
          alignment: Alignment.center,
          child: Text(
            '$n',
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: active ? Colors.white : WargaBerandaColors.textSecondary,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 11,
            fontWeight: active ? FontWeight.w600 : FontWeight.w500,
            color: active ? const Color(0xFF3B82F6) : WargaBerandaColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
