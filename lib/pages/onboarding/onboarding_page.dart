import 'package:flutter/material.dart';
import '../../config/app_animations.dart';
import '../../config/app_theme.dart';
import '../../models/profile_model.dart';
import '../../services/auth_service.dart';
import '../../widgets/rt_ui_widgets.dart';
import '../auth/login_otp_page.dart';
import '../role_home_router.dart';
import 'create_rt_page.dart';
import 'join_rt_page.dart';

class OnboardingPage extends StatelessWidget {
  final ProfileModel profile;

  const OnboardingPage({super.key, required this.profile});

  Future<void> _logout(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Keluar dari akun?'),
        content: const Text('Anda akan kembali ke halaman login.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('Keluar')),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;

    await AuthService().logout();
    if (context.mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        AppRoutes.fadeSlide(const LoginOtpPage()),
        (_) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              const CommunityIllustration(height: 130),
              const SizedBox(height: 24),
              Text(
                'Halo, ${profile.fullName.split(' ').first}!',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              const Text(
                'Pilih cara bergabung dengan RT Anda',
                style: TextStyle(fontSize: 15, color: AppTheme.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 32),
              _OptionCard(
                icon: Icons.add_home_work_rounded,
                title: 'Buat RT Baru',
                desc: 'Anda otomatis jadi Ketua RT',
                onTap: () async {
                  if (await Navigator.push<bool>(context, AppRoutes.fadeSlide(const CreateRtPage())) == true &&
                      context.mounted) {
                    RoleHomeRouter.navigate(context);
                  }
                },
              ),
              const SizedBox(height: 14),
              _OptionCard(
                icon: Icons.group_add_rounded,
                title: 'Gabung RT',
                desc: 'Pakai kode undangan jika belum di-import Ketua RT',
                onTap: () async {
                  if (await Navigator.push<bool>(context, AppRoutes.fadeSlide(const JoinRtPage())) == true &&
                      context.mounted) {
                    RoleHomeRouter.navigate(context);
                  }
                },
              ),
              const SizedBox(height: 24),
              RtCard(
                color: AppTheme.emeraldMuted,
                child: const Text(
                  'Warga yang sudah di-import Ketua RT akan otomatis masuk RT saat login (nomor HP sama). '
                  'Jika belum di-import, gunakan kode undangan.',
                  style: TextStyle(fontSize: 13, color: AppTheme.emeraldDark, height: 1.5),
                ),
              ),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => _logout(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppTheme.danger,
                  side: const BorderSide(color: AppTheme.danger),
                  minimumSize: const Size(double.infinity, 48),
                ),
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Keluar'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OptionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final VoidCallback onTap;

  const _OptionCard({required this.icon, required this.title, required this.desc, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppTheme.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
            boxShadow: [AppTheme.softShadow],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppTheme.emeraldSoft, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: AppTheme.emerald, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                    Text(desc, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: AppTheme.textHint),
            ],
          ),
        ),
      ),
    );
  }
}
