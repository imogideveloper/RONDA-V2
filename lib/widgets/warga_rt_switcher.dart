import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_toast.dart';
import '../models/rt_membership_model.dart';
import '../models/rt_unit_model.dart';
import '../services/rt_membership_service.dart';
import '../services/warga_home_loader.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Pilih / ganti RT aktif (untuk warga multi-RT).
class WargaRtSwitcher extends StatefulWidget {
  final RtUnitModel activeRt;
  final VoidCallback onSwitched;

  const WargaRtSwitcher({
    super.key,
    required this.activeRt,
    required this.onSwitched,
  });

  @override
  State<WargaRtSwitcher> createState() => _WargaRtSwitcherState();
}

class _WargaRtSwitcherState extends State<WargaRtSwitcher> {
  final _membership = RtMembershipService();
  List<RtMembershipModel> _memberships = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant WargaRtSwitcher oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.activeRt.id != widget.activeRt.id) _load();
  }

  Future<void> _load() async {
    final list = await _membership.listMyMemberships();
    if (mounted) setState(() { _memberships = list; _loading = false; });
  }

  Future<void> _openPicker() async {
    if (_loading) return;
    if (_memberships.length <= 1) {
      AppToast.show(context, 'Anda hanya terdaftar di satu RT');
      return;
    }

    final picked = await showModalBottomSheet<RtMembershipModel>(
      context: context,
      backgroundColor: WargaBerandaColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Pilih RT aktif', style: WargaBerandaText.sectionTitle()),
              const SizedBox(height: 6),
              Text(
                'Iuran, kas, dan pengumuman mengikuti RT yang dipilih.',
                style: WargaBerandaText.greeting().copyWith(fontSize: 13),
              ),
              const SizedBox(height: 16),
              ..._memberships.map((m) {
                final active = m.rtId == widget.activeRt.id || m.isActive;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Material(
                    color: active ? WargaBerandaColors.lightGreen : WargaBerandaColors.card,
                    borderRadius: BorderRadius.circular(14),
                    child: InkWell(
                      onTap: active ? null : () => Navigator.pop(ctx, m),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: active
                                ? WargaBerandaColors.primaryGreen
                                : WargaBerandaColors.border,
                            width: active ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.home_work_rounded,
                              color: active
                                  ? WargaBerandaColors.primaryGreen
                                  : WargaBerandaColors.textSecondary,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    m.displayLabel,
                                    style: GoogleFonts.poppins(
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                      color: WargaBerandaColors.textPrimary,
                                    ),
                                  ),
                                  Text(
                                    m.locationLine,
                                    style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                                  ),
                                ],
                              ),
                            ),
                            if (active)
                              const Icon(Icons.check_circle_rounded, color: WargaBerandaColors.primaryGreen)
                            else
                              const Icon(Icons.chevron_right_rounded, color: WargaBerandaColors.textSecondary),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      ),
    );

    if (picked == null || !mounted) return;
    if (picked.rtId == widget.activeRt.id) return;

    try {
      await _membership.switchActiveRt(picked.rtId);
      WargaHomeLoader.instance.invalidate();
      widget.onSwitched();
      if (mounted) {
        AppToast.success(context, 'Beralih ke ${picked.displayLabel}');
      }
    } on PostgrestException catch (e) {
      if (mounted) {
        AppToast.error(
          context,
          e.message.contains('fungsi resmi')
              ? 'Gagal ganti RT. Jalankan migration 011_fix_switch_active_rt.sql di Supabase.'
              : e.message,
        );
      }
    } catch (e) {
      if (mounted) AppToast.error(context, 'Gagal ganti RT. Coba lagi.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final multi = !_loading && _memberships.length > 1;

    return ScalePress(
      onTap: _openPicker,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: WargaBerandaColors.lightGreen,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: WargaBerandaColors.primaryGreen.withValues(alpha: 0.35),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.home_work_outlined, size: 16, color: WargaBerandaColors.primaryGreen),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                widget.activeRt.displayLabel,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: WargaBerandaColors.primaryGreen,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (multi) ...[
              const SizedBox(width: 4),
              const Icon(Icons.swap_horiz_rounded, size: 16, color: WargaBerandaColors.primaryGreen),
            ],
          ],
        ),
      ),
    );
  }
}
