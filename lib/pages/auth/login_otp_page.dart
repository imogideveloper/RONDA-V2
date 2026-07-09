import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/app_animations.dart';
import '../../config/app_theme.dart';
import '../../config/app_toast.dart';
import '../../services/auth_service.dart';
import '../../utils/phone_input_formatter.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/rt_ui_widgets.dart';
import '../role_home_router.dart';

class LoginOtpPage extends StatefulWidget {
  const LoginOtpPage({super.key});

  @override
  State<LoginOtpPage> createState() => _LoginOtpPageState();
}

class _LoginOtpPageState extends State<LoginOtpPage> with SingleTickerProviderStateMixin {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _registerPhoneCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  final _auth = AuthService();
  late TabController _tabCtrl;
  bool _otpSent = false;
  bool _loading = false;
  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _isRegisterMode = false;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _phoneCtrl.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _nameCtrl.dispose();
    _registerPhoneCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    final normalized = AuthService.normalizePhone(phone);
    if (phone.length < 9 || normalized.length < 12) {
      _snack('Nomor HP tidak valid (min. 9 digit)', isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await _auth.sendOtp(phone);
      if (mounted) setState(() => _otpSent = true);
      _snack('Kode OTP dikirim (SMS/WhatsApp)');
    } on AuthException catch (e) {
      _snack(AuthService.mapAuthError(e.message), isError: true);
    } catch (_) {
      _snack('Gagal kirim OTP. Cek pengaturan Phone Auth di Supabase.', isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpCtrl.text.trim();
    if (otp.length < 4) {
      _snack('Masukkan kode OTP', isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await _auth.verifyOtp(_phoneCtrl.text.trim(), otp);
      if (mounted) RoleHomeRouter.navigate(context);
    } on AuthException catch (e) {
      _snack(AuthService.mapAuthError(e.message), isError: true);
    } catch (_) {
      _snack('Kode OTP salah atau kedaluwarsa', isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _registerEmail() async {
    final name = _nameCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final pass = _passwordCtrl.text;
    final confirm = _confirmPasswordCtrl.text;
    final phone = _registerPhoneCtrl.text.trim();

    if (name.length < 2) {
      _snack('Nama lengkap wajib diisi', isError: true);
      return;
    }
    if (email.isEmpty || !email.contains('@')) {
      _snack('Email tidak valid', isError: true);
      return;
    }
    if (phone.length < 9) {
      _snack('Nomor HP wajib (min. 9 digit)', isError: true);
      return;
    }
    if (pass.length < 6) {
      _snack('Password minimal 6 karakter', isError: true);
      return;
    }
    if (pass != confirm) {
      _snack('Konfirmasi password tidak sama', isError: true);
      return;
    }

    setState(() => _loading = true);
    try {
      final res = await _auth.registerWithEmail(
        email: email,
        password: pass,
        fullName: name,
        phone: phone,
      );

      if (_auth.needsEmailConfirmation(res)) {
        _snack('Daftar berhasil! Cek email untuk konfirmasi, lalu masuk.');
        if (mounted) setState(() => _isRegisterMode = false);
        return;
      }

      _snack('Selamat datang! Anda terdaftar sebagai Warga RT.');
      if (mounted) RoleHomeRouter.navigate(context);
    } on AuthException catch (e) {
      _snack(AuthService.mapAuthError(e.message), isError: true);
    } catch (_) {
      _snack('Pendaftaran gagal. Cek pengaturan Auth di Supabase.', isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loginEmail() async {
    final email = _emailCtrl.text.trim();
    final pass = _passwordCtrl.text;
    if (email.isEmpty || pass.length < 6) {
      _snack('Email dan password wajib diisi', isError: true);
      return;
    }
    setState(() => _loading = true);
    try {
      await _auth.loginWithEmail(email: email, password: pass);
      if (mounted) RoleHomeRouter.navigate(context);
    } on AuthException catch (e) {
      _snack(e.message, isError: true);
    } catch (_) {
      _snack('Login gagal', isError: true);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _snack(String msg, {bool isError = false}) {
    if (isError) {
      AppToast.error(context, msg);
    } else {
      AppToast.success(context, msg);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 24),
              FadeSlideIn(
                child: FloatingMotion(
                  child: const CommunityIllustration(height: 130),
                ),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                index: 1,
                child: const Text(
                  'RT OS Indonesia',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                ),
              ),
              const SizedBox(height: 8),
              FadeSlideIn(
                index: 2,
                child: const Text(
                  'Kelola iuran, kas RT, dan pengumuman\nlingkungan Anda dengan mudah',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 15, color: AppTheme.textSecondary, height: 1.5),
                ),
              ),
              const SizedBox(height: 28),
              FadeSlideIn(
                index: 3,
                child: TabBar(
                controller: _tabCtrl,
                labelColor: AppTheme.emerald,
                unselectedLabelColor: AppTheme.textSecondary,
                indicatorColor: AppTheme.emerald,
                onTap: (_) => setState(() {
                  _otpSent = false;
                  _isRegisterMode = false;
                }),
                tabs: const [
                  Tab(text: 'Nomor HP'),
                  Tab(text: 'Email (Dev)'),
                ],
                ),
              ),
              const SizedBox(height: 20),
              AnimatedSwitcher(
                duration: AppMotion.normal,
                switchInCurve: AppMotion.enterCurve,
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: SlideTransition(
                    position: Tween<Offset>(begin: const Offset(0.04, 0), end: Offset.zero).animate(animation),
                    child: child,
                  ),
                ),
                child: _tabCtrl.index == 0
                    ? KeyedSubtree(key: ValueKey('phone-$_otpSent'), child: _buildPhoneTab())
                    : KeyedSubtree(key: const ValueKey('email'), child: _buildEmailTab()),
              ),
              const SizedBox(height: 24),
              FadeSlideIn(
                index: 4,
                child: RtCard(
                color: AppTheme.emeraldMuted,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(
                      _tabCtrl.index == 0 ? Icons.sms_outlined : Icons.email_outlined,
                      color: AppTheme.emeraldDark,
                      size: 22,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _tabCtrl.index == 0
                            ? 'Nomor baru otomatis terdaftar sebagai Warga RT setelah verifikasi OTP.'
                            : _isRegisterMode
                                ? 'Daftar sebagai Warga RT. Role warga diset otomatis di database.'
                                : 'Login email untuk development. Belum punya akun? Ketuk Daftar di bawah.',
                        style: const TextStyle(fontSize: 12, color: AppTheme.emeraldDark, height: 1.45),
                      ),
                    ),
                  ],
                ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPhoneTab() {
    if (!_otpSent) {
      return Column(
        key: const ValueKey('phone-form'),
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Nomor WhatsApp / HP', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          const SizedBox(height: 4),
          const Text(
            'Tidak perlu ketik +62 — cukup 08xxxxxxxxxx',
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.number,
            inputFormatters: [IndonesiaPhoneFormatter()],
            decoration: InputDecoration(
              hintText: '83845509841',
              prefixIcon: const Icon(Icons.phone_android_rounded, color: AppTheme.emerald),
              prefixText: '+62 ',
              prefixStyle: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.emeraldDark,
              ),
            ),
          ),
          if (_phoneCtrl.text.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Akan dikirim ke: ${AuthService.displayPhone(_phoneCtrl.text)}',
              style: const TextStyle(fontSize: 12, color: AppTheme.emerald, fontWeight: FontWeight.w600),
            ),
          ],
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _loading ? null : _sendOtp,
            child: _loading
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Kirim Kode OTP'),
          ),
          const SizedBox(height: 8),
          const Text(
            'Belum punya akun? Masukkan nomor HP — setelah OTP Anda terdaftar otomatis sebagai Warga RT.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
          ),
        ],
      );
    }
    return Column(
      key: const ValueKey('otp-form'),
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Kode dikirim ke ${AuthService.normalizePhone(_phoneCtrl.text)}',
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
        ),
        const SizedBox(height: 16),
        const Text('Masukkan Kode OTP', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _otpCtrl,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 6,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: 8),
          decoration: const InputDecoration(hintText: '• • • • • •', counterText: ''),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _loading ? null : _verifyOtp,
          child: _loading
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Masuk'),
        ),
        TextButton(
          onPressed: () => setState(() {
            _otpSent = false;
            _otpCtrl.clear();
          }),
          child: const Text('Ganti nomor HP', style: TextStyle(color: AppTheme.emerald)),
        ),
      ],
    );
  }

  Widget _buildEmailTab() {
    return AnimatedSwitcher(
      duration: AppMotion.normal,
      child: _isRegisterMode
          ? _buildRegisterForm(key: const ValueKey('register'))
          : _buildLoginForm(key: const ValueKey('login')),
    );
  }

  Widget _buildLoginForm({required Key key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('Email', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            hintText: 'nama@email.com',
            prefixIcon: Icon(Icons.email_outlined, color: AppTheme.emerald),
          ),
        ),
        const SizedBox(height: 14),
        const Text('Password', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordCtrl,
          obscureText: _obscure,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: 'Minimal 6 karakter',
            prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.emerald),
            suffixIcon: IconButton(
              icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _loading ? null : _loginEmail,
          child: _loading
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Masuk dengan Email'),
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton(
            onPressed: _loading
                ? null
                : () => setState(() {
                      _isRegisterMode = true;
                      _confirmPasswordCtrl.clear();
                    }),
            child: const Text('Belum punya akun? Daftar sebagai Warga'),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterForm({required Key key}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppTheme.emeraldMuted,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.25)),
          ),
          child: const Row(
            children: [
              Icon(Icons.person_add_alt_1_rounded, color: AppTheme.emeraldDark, size: 22),
              SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Daftar akun baru — otomatis menjadi Warga RT',
                  style: TextStyle(fontSize: 13, color: AppTheme.emeraldDark, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Nama lengkap', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _nameCtrl,
          textInputAction: TextInputAction.next,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            hintText: 'Contoh: Budi Santoso',
            prefixIcon: Icon(Icons.person_outline, color: AppTheme.emerald),
          ),
        ),
        const SizedBox(height: 14),
        const Text('Nomor HP', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 4),
        const Text('Tanpa +62 — cukup 08xxxxxxxxxx', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        const SizedBox(height: 8),
        TextField(
          controller: _registerPhoneCtrl,
          keyboardType: TextInputType.number,
          inputFormatters: [IndonesiaPhoneFormatter()],
          decoration: const InputDecoration(
            hintText: '83845509841',
            prefixIcon: Icon(Icons.phone_android_rounded, color: AppTheme.emerald),
            prefixText: '+62 ',
            prefixStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.emeraldDark),
          ),
        ),
        const SizedBox(height: 14),
        const Text('Email', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(
            hintText: 'nama@email.com',
            prefixIcon: Icon(Icons.email_outlined, color: AppTheme.emerald),
          ),
        ),
        const SizedBox(height: 14),
        const Text('Password', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordCtrl,
          obscureText: _obscure,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            hintText: 'Minimal 6 karakter',
            prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.emerald),
            suffixIcon: IconButton(
              icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
        ),
        const SizedBox(height: 14),
        const Text('Konfirmasi password', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextField(
          controller: _confirmPasswordCtrl,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: 'Ulangi password',
            prefixIcon: const Icon(Icons.lock_outline, color: AppTheme.emerald),
            suffixIcon: IconButton(
              icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
          ),
        ),
        const SizedBox(height: 20),
        ElevatedButton(
          onPressed: _loading ? null : _registerEmail,
          child: _loading
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Daftar sebagai Warga'),
        ),
        const SizedBox(height: 12),
        Center(
          child: TextButton(
            onPressed: _loading ? null : () => setState(() => _isRegisterMode = false),
            child: const Text('Sudah punya akun? Masuk'),
          ),
        ),
      ],
    );
  }
}
