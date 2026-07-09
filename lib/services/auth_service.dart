import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/profile_model.dart';

class AuthService {
  final SupabaseClient _supabase = Supabase.instance.client;

  String? lastProfileError;
  String? _pendingPhone;

  Session? get currentSession => _supabase.auth.currentSession;
  User? get currentUser => _supabase.auth.currentUser;
  bool get isLoggedIn => currentSession != null;
  String? get pendingPhone => _pendingPhone;

  /// 0838... / 838... / +62838... → +62838...
  static String normalizePhone(String raw) {
    var p = raw.replaceAll(RegExp(r'\D'), '');
    if (p.startsWith('62')) p = p.substring(2);
    if (p.startsWith('0')) p = p.substring(1);
    if (p.isEmpty) return '+62';
    return '+62$p';
  }

  /// Tampilan ramah untuk UI (tanpa perlu user ketik +)
  static String displayPhone(String raw) {
    final n = normalizePhone(raw);
    if (n == '+62') return '';
    return n;
  }

  /// Pesan error OTP yang lebih mudah dipahami
  static String mapAuthError(String message) {
    final m = message.toLowerCase();
    if (m.contains('unsupported phone provider')) {
      return 'SMS belum diatur di Supabase. Aktifkan Phone Auth + provider (Twilio), '
          'atau pakai login Email untuk development.';
    }
    if (m.contains('signups not allowed')) {
      return 'Pendaftaran OTP dinonaktifkan. Aktifkan "Allow new signups" di Supabase Auth.';
    }
    return message;
  }

  Future<void> sendOtp(String phone) async {
    final normalized = normalizePhone(phone);
    _pendingPhone = normalized;
    await _supabase.auth.signInWithOtp(phone: normalized);
  }

  Future<AuthResponse> loginWithEmail({
    required String email,
    required String password,
  }) async {
    return _supabase.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> registerWithEmail({
    required String email,
    required String password,
    required String fullName,
    required String phone,
  }) async {
    final normalizedPhone = phone.trim().isEmpty ? '' : normalizePhone(phone);
    final response = await _supabase.auth.signUp(
      email: email.trim(),
      password: password,
      data: {
        'full_name': fullName.trim(),
        'phone': normalizedPhone,
        'role': 'warga',
      },
    );

    // Trigger DB handle_new_user → role warga; pastikan profil terbaca
    if (response.user != null && response.session != null) {
      await getProfile();
    }
    return response;
  }

  /// true jika perlu konfirmasi email sebelum bisa masuk
  bool needsEmailConfirmation(AuthResponse response) =>
      response.user != null && response.session == null;

  Future<AuthResponse> verifyOtp(String phone, String otp) async {
    final normalized = normalizePhone(phone);
    final response = await _supabase.auth.verifyOTP(
      phone: normalized,
      token: otp.trim(),
      type: OtpType.sms,
    );
    _pendingPhone = null;

    // Simpan nomor di metadata untuk profil
    if (response.user != null) {
      await _supabase.auth.updateUser(
        UserAttributes(data: {'phone': normalized, 'full_name': 'Warga RT'}),
      );
    }
    return response;
  }

  Future<void> logout() async {
    await _supabase.auth.signOut();
    _pendingPhone = null;
  }

  Future<void> updateMyProfile({
    required String fullName,
    required String phone,
    String? avatarUrl,
  }) async {
    final user = currentUser;
    if (user == null) return;

    final payload = <String, dynamic>{
      'full_name': fullName.trim(),
      'phone': phone.trim(),
    };
    if (avatarUrl != null) payload['avatar_url'] = avatarUrl;

    await _supabase.from('profiles').update(payload).eq('id', user.id);

    final meta = <String, dynamic>{
      'full_name': fullName.trim(),
      'phone': phone.trim(),
    };
    if (avatarUrl != null) meta['avatar_url'] = avatarUrl;

    await _supabase.auth.updateUser(UserAttributes(data: meta));
  }

  Future<ProfileModel?> getProfile() async {
    lastProfileError = null;
    final user = currentUser;
    if (user == null) return null;

    final fromRpc = await _fetchViaRpc();
    if (fromRpc != null) return fromRpc;

    try {
      final data = await _supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

      if (data != null) {
        return ProfileModel.fromMap(Map<String, dynamic>.from(data));
      }
    } catch (e) {
      lastProfileError = e.toString();
      debugPrint('getProfile select error: $e');
    }

    return _upsertProfileFromAuth(user);
  }

  Future<ProfileModel?> _fetchViaRpc() async {
    try {
      final rpc = await _supabase.rpc('ensure_my_profile');
      return _parseProfileData(rpc);
    } catch (e) {
      lastProfileError = e.toString();
      debugPrint('ensure_my_profile error: $e');
    }
    return null;
  }

  ProfileModel? _parseProfileData(dynamic data) {
    if (data == null) return null;
    try {
      if (data is Map) {
        return ProfileModel.fromMap(Map<String, dynamic>.from(data));
      }
    } catch (e) {
      lastProfileError = 'Parse profil gagal: $e';
    }
    return null;
  }

  Future<ProfileModel?> _upsertProfileFromAuth(User user) async {
    try {
      final phone = user.phone ?? user.userMetadata?['phone'] ?? '';
      // Jangan set role/rt_id dari client — trigger DB akan menolak
      await _supabase.from('profiles').upsert({
        'id': user.id,
        'full_name': user.userMetadata?['full_name'] ?? 'Warga RT',
        'phone': phone,
        'is_active': true,
      });

      final data = await _supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle();

      if (data != null) {
        return ProfileModel.fromMap(Map<String, dynamic>.from(data));
      }
      lastProfileError = 'Profil tidak terbaca setelah upsert';
    } catch (e) {
      lastProfileError = e.toString();
    }
    return null;
  }

  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;
}
