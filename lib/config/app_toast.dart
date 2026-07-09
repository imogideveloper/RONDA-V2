import 'package:flutter/material.dart';
import 'app_theme.dart';

/// Notifikasi di atas layar (lebih nyaman daripada snackbar bawah).
class AppToast {
  AppToast._();

  static void show(
    BuildContext context,
    String message, {
    bool isError = false,
    Duration duration = const Duration(seconds: 3),
  }) {
    final top = MediaQuery.paddingOf(context).top + 12;
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppTheme.danger : AppTheme.emeraldDark,
        behavior: SnackBarBehavior.floating,
        duration: duration,
        margin: EdgeInsets.only(left: 16, right: 16, top: top, bottom: 0),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 6,
      ),
    );
  }

  static void success(BuildContext context, String message, {Duration? duration}) =>
      show(context, message, isError: false, duration: duration ?? const Duration(seconds: 3));

  static void error(BuildContext context, String message, {Duration? duration}) =>
      show(context, message, isError: true, duration: duration ?? const Duration(seconds: 5));
}
