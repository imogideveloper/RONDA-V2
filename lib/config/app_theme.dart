import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// RT OS Indonesia — Emerald, ringan, mudah dibaca usia 35–60
///
/// Tipografi isi/teks paragraf mengikuti [abisena.netlify.app](https://abisena.netlify.app/):
/// font **Outfit** (body 15px). Judul hero web memakai DM Serif Display — tidak dipakai di app.
class AppTheme {
  AppTheme._();

  // Emerald palette
  static const emerald = Color(0xFF059669);
  static const emeraldLight = Color(0xFF10B981);
  static const emeraldDark = Color(0xFF047857);
  static const emeraldSoft = Color(0xFFD1FAE5);
  static const emeraldMuted = Color(0xFFECFDF5);

  static const background = Color(0xFFF8FAF9);
  static const surface = Color(0xFFFFFFFF);
  static const textPrimary = Color(0xFF1F2937);
  static const textSecondary = Color(0xFF6B7280);
  static const textHint = Color(0xFF9CA3AF);
  static const border = Color(0xFFE5E7EB);
  static const warning = Color(0xFFF59E0B);
  static const danger = Color(0xFFEF4444);
  static const success = Color(0xFF10B981);

  static ThemeData get theme {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: emerald,
        primary: emerald,
        onPrimary: Colors.white,
        surface: surface,
        onSurface: textPrimary,
      ),
      scaffoldBackgroundColor: background,
    );
    final outfitBase = GoogleFonts.outfitTextTheme(base.textTheme).apply(
      bodyColor: textPrimary,
      displayColor: textPrimary,
    );

    // Skala paragraf & label — selaras dengan body 15px / weight ringan di portfolio.
    final textTheme = outfitBase.copyWith(
      bodyLarge: outfitBase.bodyLarge?.copyWith(
        fontSize: 16,
        height: 1.55,
        fontWeight: FontWeight.w400,
      ),
      bodyMedium: outfitBase.bodyMedium?.copyWith(
        fontSize: 15,
        height: 1.5,
        fontWeight: FontWeight.w400,
      ),
      bodySmall: outfitBase.bodySmall?.copyWith(
        fontSize: 13,
        height: 1.45,
        fontWeight: FontWeight.w400,
      ),
      labelLarge: outfitBase.labelLarge?.copyWith(
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      labelMedium: outfitBase.labelMedium?.copyWith(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
      labelSmall: outfitBase.labelSmall?.copyWith(
        fontSize: 11,
        fontWeight: FontWeight.w500,
      ),
      titleLarge: outfitBase.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
      ),
      titleMedium: outfitBase.titleMedium?.copyWith(fontWeight: FontWeight.w600),
      titleSmall: outfitBase.titleSmall?.copyWith(fontWeight: FontWeight.w600),
      headlineSmall: outfitBase.headlineSmall?.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: -0.25,
      ),
      headlineMedium: outfitBase.headlineMedium?.copyWith(fontWeight: FontWeight.w700),
      headlineLarge: outfitBase.headlineLarge?.copyWith(fontWeight: FontWeight.w700),
    );

    return base.copyWith(
      textTheme: textTheme,
      primaryTextTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: textTheme.titleMedium?.copyWith(
          color: textPrimary,
          fontWeight: FontWeight.w700,
          fontSize: 17,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: emerald,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: emerald, width: 1.5),
        ),
        hintStyle: textTheme.bodyMedium?.copyWith(color: textHint),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: border, width: 0.5),
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: emerald,
        unselectedItemColor: textHint,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700),
        unselectedLabelStyle: textTheme.labelSmall,
      ),
    );
  }

  /// Teks paragraf eksplisit (Outfit) — untuk konten panjang / deskripsi.
  static TextStyle paragraph(BuildContext context, {Color? color, double? fontSize}) =>
      GoogleFonts.outfit(
        fontSize: fontSize ?? 15,
        height: 1.5,
        fontWeight: FontWeight.w400,
        color: color ?? textPrimary,
      );

  /// Gaya teks khusus dashboard warga (keluarga Outfit, bukan heading serif web).
  static TextStyle wargaGreeting(BuildContext context) =>
      GoogleFonts.outfit(
        fontSize: 13,
        height: 1.4,
        fontWeight: FontWeight.w400,
        color: textSecondary,
      );

  static TextStyle wargaName(BuildContext context) =>
      GoogleFonts.outfit(
        fontSize: 21,
        height: 1.2,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
        color: textPrimary,
      );

  static TextStyle wargaSectionTitle(BuildContext context) =>
      GoogleFonts.outfit(
        fontSize: 17,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.2,
        color: textPrimary,
      );

  static TextStyle wargaLabelCaps(BuildContext context) =>
      GoogleFonts.outfit(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.55,
        color: textSecondary,
      );

  static BoxShadow get softShadow => BoxShadow(
        color: Colors.black.withValues(alpha: 0.06),
        blurRadius: 12,
        offset: const Offset(0, 4),
      );

  static String formatRupiah(num amount) {
    final s = amount.round().toString();
    final buf = StringBuffer('Rp ');
    for (var i = 0; i < s.length; i++) {
      if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
      buf.write(s[i]);
    }
    return buf.toString();
  }
}

enum UserRole { ketuaRt, bendahara, warga, unknown }

extension UserRoleX on UserRole {
  String get value {
    switch (this) {
      case UserRole.ketuaRt:
        return 'ketua_rt';
      case UserRole.bendahara:
        return 'bendahara';
      case UserRole.warga:
        return 'warga';
      case UserRole.unknown:
        return 'warga';
    }
  }

  String get label {
    switch (this) {
      case UserRole.ketuaRt:
        return 'Ketua RT';
      case UserRole.bendahara:
        return 'Bendahara RT';
      case UserRole.warga:
        return 'Warga';
      case UserRole.unknown:
        return 'Pengguna';
    }
  }

  static UserRole fromString(String? role) {
    switch (role) {
      case 'ketua_rt':
      case 'ketua_rw':
        return UserRole.ketuaRt;
      case 'bendahara':
        return UserRole.bendahara;
      case 'warga':
        return UserRole.warga;
      default:
        return UserRole.unknown;
    }
  }
}
