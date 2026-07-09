import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../config/app_animations.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_membership_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/auth/login_otp_page.dart';
import '../../pages/onboarding/join_rt_page.dart';
import '../../pages/warga/warga_layanan_surat_page.dart';
import '../../services/auth_service.dart';
import '../../services/rt_membership_service.dart';
import '../../services/warga_home_loader.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_edit_profile_sheet.dart';
import '../../widgets/warga_dashboard_widgets.dart';
import '../../widgets/warga_tab_skeletons.dart';

class WargaProfilView extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onProfileUpdated;

  const WargaProfilView({
    super.key,
    required this.profile,
    required this.rt,
    this.onProfileUpdated,
  });

  @override
  State<WargaProfilView> createState() => _WargaProfilViewState();
}

class _WargaProfilViewState extends State<WargaProfilView> {
  late ProfileModel _profile;
  final _auth = AuthService();
  final _membership = RtMembershipService();
  List<RtMembershipModel> _memberships = [];
  bool _loadingMemberships = true;

  @override
  void initState() {
    super.initState();
    _profile = widget.profile;
    _loadMemberships();
  }

  @override
  void didUpdateWidget(covariant WargaProfilView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile.avatarUrl != widget.profile.avatarUrl ||
        oldWidget.profile.fullName != widget.profile.fullName ||
        oldWidget.profile.phone != widget.profile.phone) {
      _profile = widget.profile;
    }
  }

  Future<void> _loadMemberships() async {
    setState(() => _loadingMemberships = true);
    final list = await _membership.listMyMemberships();
    if (mounted) {
      setState(() {
        _memberships = list;
        _loadingMemberships = false;
      });
    }
  }

  Future<void> _editProfile() async {
    final ok = await showWargaEditProfileSheet(
      context,
      userId: _profile.id,
      initialName: _profile.fullName,
      initialPhone: _profile.phone,
      initialAvatarUrl: _profile.avatarUrl,
    );
    if (ok == true) {
      final updated = await _auth.getProfile();
      if (updated != null && mounted) {
        setState(() => _profile = updated);
        widget.onProfileUpdated?.call();
        AppToast.success(context, 'Profil diperbarui');
      }
    }
  }

  Future<void> _joinAnotherRt() async {
    final ok = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => const JoinRtPage(additionalMembership: true)),
    );
    if (ok == true) {
      await _loadMemberships();
      widget.onProfileUpdated?.call();
      if (mounted) AppToast.success(context, 'Berhasil gabung / ganti ke RT baru');
    }
  }

  Future<void> _switchRt(RtMembershipModel m) async {
    if (m.isActive) return;
    try {
      await _membership.switchActiveRt(m.rtId);
      WargaHomeLoader.instance.invalidate();
      widget.onProfileUpdated?.call();
      if (mounted) AppToast.success(context, 'Beralih ke ${m.displayLabel}. Data iuran & info diperbarui.');
    } on PostgrestException catch (e) {
      if (mounted) AppToast.error(context, e.message);
    }
  }

  void _showHelp() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Panduan Warga', style: WargaBerandaText.sectionTitle()),
        content: Text(
          '• Beranda: ringkasan iuran, pengumuman, dan aksi cepat.\n'
          '• Iuran: bayar tagihan bulanan (demo QRIS).\n'
          '• Info: baca pengumuman RT.\n'
          '• Profil: kelola keanggotaan RT & ajukan surat.\n\n'
          'Punya rumah di 2 RT? Gunakan "Gabung RT Lain" dengan kode undangan Ketua RT.',
          style: WargaBerandaText.greeting().copyWith(height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Mengerti')),
        ],
      ),
    );
  }

  String _parseKelurahan() {
    final addr = widget.rt.address ?? widget.rt.name;
    if (addr.contains('-')) return addr.split('-').first.trim();
    return widget.rt.name;
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingMemberships) {
      return const WargaPageBody(
        loading: true,
        loadingWidget: WargaProfilSkeleton(),
        children: [],
      );
    }

    return WargaPageBody(
      children: [
        const WargaPageHeader(
          title: 'Profil',
          subtitle: 'Ketuk foto untuk ubah profil & unggah foto',
        ),
        const SizedBox(height: 16),
        FadeSlideIn(
          child: WargaProfileHeaderCard(
            fullName: _profile.fullName,
            phone: _profile.phone.isNotEmpty ? _profile.phone : '-',
            roleLabel: _profile.roleLabel,
            avatarUrl: _profile.avatarUrl,
            onEditProfile: _editProfile,
          ),
        ),
        const SizedBox(height: 24),
        Row(
          children: [
            const Expanded(child: WargaSectionHeader(title: 'Keanggotaan RT')),
            OutlinedButton.icon(
              onPressed: _joinAnotherRt,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: Text(
                'Gabung RT Lain',
                style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w500),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: WargaBerandaColors.primaryGreen,
                side: const BorderSide(color: WargaBerandaColors.primaryGreen),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        if (_memberships.isEmpty)
          WargaMembershipCard(
            displayLabel: widget.rt.displayLabel,
            subtitle: '${widget.rt.name} · Warga',
            isActive: true,
          )
        else
          ..._memberships.map(
            (m) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: WargaMembershipCard(
                displayLabel: m.displayLabel,
                subtitle: '${m.locationLine} · Warga',
                isActive: m.isActive,
                onTap: () => _switchRt(m),
              ),
            ),
          ),
        Padding(
          padding: const EdgeInsets.only(top: 4, bottom: 16),
          child: Text(
            'Iuran dihitung terpisah untuk setiap RT',
            style: WargaBerandaText.greeting().copyWith(
              fontSize: 12,
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
        WargaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Cara kerja role di RONDA', style: WargaBerandaText.sectionTitle()),
              const SizedBox(height: 12),
              _roleRow(Icons.shield_rounded, WargaBerandaColors.primaryGreen, 'Ketua RT', 'Membuat RT & verifikasi warga.'),
              _roleRow(
                Icons.account_balance_wallet_rounded,
                const Color(0xFFBA7517),
                'Bendahara',
                'Ditunjuk Ketua RT, kelola kas.',
              ),
              _roleRow(Icons.person_rounded, const Color(0xFF185FA5), 'Warga', 'Gabung pakai kode. Bisa di beberapa RT.'),
            ],
          ),
        ),
        const SizedBox(height: 12),
        WargaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              _ProfilSectionTitle('Akses Anda sebagai Warga'),
              SizedBox(height: 4),
              WargaAccessRow(label: 'Kelola Iuran', active: false),
              WargaAccessRow(label: 'Kelola Kas RT', active: false),
              WargaAccessRow(label: 'Buat Pengumuman', active: false),
              WargaAccessRow(label: 'Kelola Data Warga', active: false),
              WargaAccessRow(label: 'Lihat Laporan Kas', active: false),
              WargaAccessRow(label: 'Request Surat', active: true),
            ],
          ),
        ),
        const SizedBox(height: 12),
        WargaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Informasi RT', style: WargaBerandaText.sectionTitle()),
              const SizedBox(height: 8),
              WargaInfoRow(label: 'RT / RW', value: widget.rt.displayLabel),
              WargaInfoRow(label: 'Kelurahan', value: _parseKelurahan()),
              WargaInfoRow(label: 'Kecamatan', value: widget.rt.address ?? '-'),
              WargaInfoRow(label: 'Kota', value: widget.rt.name),
              WargaInfoRow(label: 'Jumlah Warga', value: '${widget.rt.memberCount} orang'),
            ],
          ),
        ),
        const SizedBox(height: 16),
        WargaMenuTile(
          icon: Icons.description_rounded,
          iconBg: WargaBerandaColors.accentLime,
          iconColor: const Color(0xFF3B6D11),
          title: 'Surat Pengantar',
          subtitle: 'Ajukan & cek status surat',
          onTap: () => context.pushAnimated(
            WargaLayananSuratPage(profile: _profile, rt: widget.rt),
          ),
        ),
        WargaMenuTile(
          icon: Icons.help_outline_rounded,
          iconBg: WargaBerandaColors.accentBlue,
          iconColor: const Color(0xFF185FA5),
          title: 'Bantuan',
          subtitle: 'FAQ dan panduan penggunaan',
          onTap: _showHelp,
        ),
        const SizedBox(height: 20),
        OutlinedButton.icon(
          onPressed: _logout,
          style: OutlinedButton.styleFrom(
            foregroundColor: WargaBerandaColors.dangerRed,
            side: const BorderSide(color: WargaBerandaColors.dangerRed),
            minimumSize: const Size(double.infinity, 48),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: const Icon(Icons.logout_rounded),
          label: Text('Keluar', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
        ),
      ],
    );
  }

  Widget _roleRow(IconData icon, Color color, String title, String desc) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13, color: WargaBerandaColors.textPrimary),
                ),
                Text(desc, style: WargaBerandaText.greeting().copyWith(fontSize: 12, height: 1.35)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Keluar?', style: WargaBerandaText.sectionTitle()),
        content: Text('Anda akan keluar dari aplikasi.', style: WargaBerandaText.greeting()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: WargaBerandaColors.dangerRed),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );
    if (ok != true) return;
    await _auth.logout();
    if (!context.mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginOtpPage()),
      (_) => false,
    );
  }
}

class _ProfilSectionTitle extends StatelessWidget {
  final String text;
  const _ProfilSectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(text, style: WargaBerandaText.sectionTitle());
  }
}
