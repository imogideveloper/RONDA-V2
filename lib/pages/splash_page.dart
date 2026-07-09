import 'package:flutter/material.dart';
import '../config/app_animations.dart';
import '../config/app_theme.dart';
import '../services/auth_service.dart';
import '../widgets/animated_rt_widgets.dart';
import 'auth/login_otp_page.dart';
import 'role_home_router.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> with SingleTickerProviderStateMixin {
  final _auth = AuthService();
  late AnimationController _controller;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _controller, curve: AppMotion.enterCurve);
    _controller.forward();
    _boot();
  }

  Future<void> _boot() async {
    await Future.delayed(const Duration(milliseconds: 2000));
    if (!mounted) return;
    final page = _auth.isLoggedIn ? const RoleHomeRouter() : const LoginOtpPage();
    Navigator.of(context).pushReplacement(AppRoutes.fade(page));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.emeraldMuted,
      body: FadeTransition(
        opacity: _fade,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              PopInIcon(
                child: Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: AppTheme.emerald,
                    borderRadius: BorderRadius.circular(22),
                    boxShadow: [AppTheme.softShadow],
                  ),
                  child: const Icon(Icons.home_work_rounded, color: Colors.white, size: 44),
                ),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                index: 1,
                child: const Text(
                  'RT OS',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.emeraldDark,
                    letterSpacing: 1,
                  ),
                ),
              ),
              FadeSlideIn(
                index: 2,
                child: const Text(
                  'Indonesia',
                  style: TextStyle(fontSize: 16, color: AppTheme.textSecondary, letterSpacing: 4),
                ),
              ),
              const SizedBox(height: 40),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: AppTheme.emerald),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
