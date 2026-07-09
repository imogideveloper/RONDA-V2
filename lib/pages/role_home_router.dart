import 'package:flutter/material.dart';
import '../config/app_animations.dart';
import '../config/app_theme.dart';
import '../widgets/animated_rt_widgets.dart';
import '../models/profile_model.dart';
import '../models/rt_unit_model.dart';
import '../services/auth_service.dart';
import '../services/rt_service.dart';
import '../services/warga_directory_service.dart';
import '../config/app_toast.dart';
import 'auth/login_otp_page.dart';
import 'onboarding/onboarding_page.dart';
import 'shell/main_shell.dart';
import 'shell/warga_main_shell.dart';

class RoleHomeRouter extends StatefulWidget {
  const RoleHomeRouter({super.key});

  static Future<void> navigate(BuildContext context) {
    return Navigator.of(context).pushReplacement(AppRoutes.fadeSlide(const RoleHomeRouter()));
  }

  @override
  State<RoleHomeRouter> createState() => _RoleHomeRouterState();
}

class _RoleHomeRouterState extends State<RoleHomeRouter> {
  final _authService = AuthService();
  final _rtService = RtService();

  ProfileModel? _profile;
  RtUnitModel? _rt;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    var profile = await _authService.getProfile();
    var autoJoined = false;
    if (profile != null && !profile.hasRt) {
      autoJoined = await WargaDirectoryService().tryAutoJoinRt();
      if (autoJoined) profile = await _authService.getProfile();
    }
    RtUnitModel? rt;
    if (profile?.rtId != null) {
      rt = await _rtService.getMyRt();
    }
    if (mounted) {
      setState(() {
        _profile = profile;
        _rt = rt;
        _isLoading = false;
      });
      if (autoJoined && rt != null) {
        AppToast.success(context, 'Anda terhubung ke ${rt.name} (data import RT)');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        body: Center(
          child: FadeSlideIn(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const PulseLoader(height: 56, width: 56, borderRadius: BorderRadius.all(Radius.circular(16))),
                const SizedBox(height: 20),
                Text('Memuat RT Anda...', style: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.9))),
              ],
            ),
          ),
        ),
      );
    }

    if (_profile == null) {
      return _buildError();
    }

    if (!_profile!.hasRt || _rt == null) {
      return OnboardingPage(profile: _profile!);
    }

    if (_profile!.isWarga) {
      return WargaMainShell(
        profile: _profile!,
        rt: _rt!,
        onProfileOrRtChanged: _load,
      );
    }

    return MainShell(
      profile: _profile!,
      rt: _rt!,
      onProfileUpdated: _load,
    );
  }

  Widget _buildError() {
    final detail = _authService.lastProfileError;
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppTheme.danger),
              const SizedBox(height: 16),
              const Text('Profil tidak ditemukan', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              if (detail != null) ...[
                const SizedBox(height: 8),
                Text(detail, textAlign: TextAlign.center, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              ],
              const SizedBox(height: 24),
              ElevatedButton(onPressed: _load, child: const Text('Coba Lagi')),
              TextButton(
                onPressed: () async {
                  await _authService.logout();
                  if (mounted) {
                    Navigator.pushAndRemoveUntil(
                      context,
                      AppRoutes.fadeSlide(const LoginOtpPage()),
                      (_) => false,
                    );
                  }
                },
                child: const Text('Kembali ke Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
