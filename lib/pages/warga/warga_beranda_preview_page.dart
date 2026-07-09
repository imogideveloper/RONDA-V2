import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../widgets/warga_beranda_widgets.dart';
import 'warga_home_view.dart';

/// Preview / demo halaman Beranda — bisa di-push untuk uji desain.
/// Produksi memakai [WargaHomeView] di [WargaMainShell].
class WargaBerandaPreviewPage extends StatelessWidget {
  const WargaBerandaPreviewPage({super.key});

  static ProfileModel get _mockProfile => ProfileModel(
        id: 'preview',
        fullName: 'Ahmad Hidayat',
        phone: '08123456789',
        role: 'warga',
        rtId: 'rt-preview',
        isActive: true,
        createdAt: DateTime.now(),
      );

  static RtUnitModel get _mockRt => RtUnitModel(
        id: 'rt-preview',
        name: 'Sukamaju',
        rtNumber: '03',
        rwNumber: '02',
        address: 'Depok',
        inviteCode: 'PREVIEW',
        ketuaId: 'k1',
        memberCount: 42,
        createdAt: DateTime.now(),
      );

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: Theme.of(context).copyWith(
        scaffoldBackgroundColor: WargaBerandaColors.background,
        textTheme: GoogleFonts.poppinsTextTheme(Theme.of(context).textTheme),
      ),
      child: Scaffold(
        backgroundColor: WargaBerandaColors.background,
        body: WargaHomeView(profile: _mockProfile, rt: _mockRt),
        bottomNavigationBar: _PreviewBottomNav(),
      ),
    );
  }
}

class _PreviewBottomNav extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: WargaBerandaColors.card,
        border: Border(top: BorderSide(color: WargaBerandaColors.border)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(icon: Icons.home_rounded, label: 'Beranda', active: true),
              _NavItem(icon: Icons.payments_outlined, label: 'Iuran'),
              _NavItem(icon: Icons.campaign_outlined, label: 'Info'),
              _NavItem(icon: Icons.person_outline_rounded, label: 'Profil'),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active;

  const _NavItem({required this.icon, required this.label, this.active = false});

  @override
  Widget build(BuildContext context) {
    final color = active ? WargaBerandaColors.primary : WargaBerandaColors.textSecondary;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (active)
          Container(
            width: 6,
            height: 6,
            margin: const EdgeInsets.only(bottom: 4),
            decoration: const BoxDecoration(
              color: WargaBerandaColors.primary,
              shape: BoxShape.circle,
            ),
          )
        else
          const SizedBox(height: 10),
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: color)),
      ],
    );
  }
}
