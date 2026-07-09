import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_animations.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/auth/login_otp_page.dart';
import '../../pages/warga/data_warga_page.dart';
import '../../pages/surat/surat_pengantar_page.dart';
import '../../services/auth_service.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_dashboard_widgets.dart';
import '../../widgets/warga_edit_profile_sheet.dart';

class ProfilTab extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onProfileUpdated;

  const ProfilTab({
    super.key,
    required this.profile,
    required this.rt,
    this.onProfileUpdated,
  });

  @override
  State<ProfilTab> createState() => _ProfilTabState();
}

class _ProfilTabState extends State<ProfilTab> {
  late ProfileModel _profile;
  final _auth = AuthService();

  @override
  void initState() {
    super.initState();
    _profile = widget.profile;
  }

  @override
  void didUpdateWidget(covariant ProfilTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.profile.avatarUrl != widget.profile.avatarUrl ||
        oldWidget.profile.fullName != widget.profile.fullName) {
      _profile = widget.profile;
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

  void _showHelp() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Panduan RT OS', style: WargaBerandaText.sectionTitle()),
        content: Text(
          '• Beranda: ringkasan kas & pengumuman.\n'
          '• Iuran: kelola tagihan warga.\n'
          '• Kas: catat pemasukan & pengeluaran.\n'
          '• Info: buat & kelola pengumuman.\n'
          '• Profil: edit data & kelola warga.',
          style: WargaBerandaText.greeting().copyWith(height: 1.5),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Mengerti')),
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
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const LoginOtpPage()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final canManage = _profile.isKetua || _profile.isBendahara;

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
        const SizedBox(height: 16),
        WargaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('RT Anda', style: WargaBerandaText.sectionTitle()),
              const SizedBox(height: 8),
              WargaInfoRow(label: 'Nama', value: widget.rt.name),
              WargaInfoRow(label: 'RT / RW', value: widget.rt.displayLabel),
              if (widget.rt.address != null)
                WargaInfoRow(label: 'Alamat', value: widget.rt.address!),
              if (_profile.isKetua) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Kode undangan: ${widget.rt.inviteCode}',
                        style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy_rounded, color: WargaBerandaColors.primaryGreen),
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: widget.rt.inviteCode));
                        AppToast.success(context, 'Kode disalin');
                      },
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (canManage)
          WargaMenuTile(
            icon: Icons.people_alt_rounded,
            iconBg: WargaBerandaColors.lightGreen,
            iconColor: WargaBerandaColors.primaryGreen,
            title: 'Data Warga',
            subtitle: 'Direktori & kelola bendahara',
            onTap: () => context.pushAnimated(
              DataWargaPage(rt: widget.rt, profile: _profile),
            ),
          ),
        WargaMenuTile(
          icon: Icons.description_rounded,
          iconBg: WargaBerandaColors.accentLime,
          iconColor: const Color(0xFF3B6D11),
          title: 'Surat Pengantar',
          subtitle: 'Kelola permohonan surat warga',
          onTap: () => context.pushAnimated(
            SuratPengantarPage(profile: _profile, rt: widget.rt),
          ),
        ),
        WargaMenuTile(
          icon: Icons.help_outline_rounded,
          iconBg: WargaBerandaColors.accentBlue,
          iconColor: const Color(0xFF185FA5),
          title: 'Bantuan',
          subtitle: 'Panduan singkat RT OS',
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
        const SizedBox(height: 16),
        Center(
          child: Text('RT OS Indonesia v1.0', style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
        ),
      ],
    );
  }
}
