import 'package:flutter/material.dart';

/// Durasi & kurva animasi konsisten di seluruh app.
class AppMotion {
  AppMotion._();

  static const fast = Duration(milliseconds: 200);
  static const normal = Duration(milliseconds: 320);
  static const slow = Duration(milliseconds: 480);
  static const staggerStep = Duration(milliseconds: 45);
  static const maxStaggerDelay = Duration(milliseconds: 360);

  static const enterCurve = Curves.easeOutCubic;
  static const exitCurve = Curves.easeInCubic;
  static const bounceCurve = Curves.elasticOut;

  static Duration staggerDelay(int index) {
    final ms = (staggerStep.inMilliseconds * index).clamp(0, maxStaggerDelay.inMilliseconds);
    return Duration(milliseconds: ms);
  }
}

/// Route fade + slide halus (push halaman baru).
class AppRoutes {
  AppRoutes._();

  static Route<T> fadeSlide<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, _, _) => page,
      transitionDuration: AppMotion.normal,
      reverseTransitionDuration: AppMotion.fast,
      transitionsBuilder: (_, animation, _, child) {
        final curved = CurvedAnimation(parent: animation, curve: AppMotion.enterCurve);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 0.06), end: Offset.zero).animate(curved),
            child: child,
          ),
        );
      },
    );
  }

  static Route<T> fade<T>(Widget page) {
    return PageRouteBuilder<T>(
      pageBuilder: (_, _, _) => page,
      transitionDuration: AppMotion.normal,
      transitionsBuilder: (_, animation, _, child) =>
          FadeTransition(opacity: CurvedAnimation(parent: animation, curve: AppMotion.enterCurve), child: child),
    );
  }
}

extension AppNavigator on BuildContext {
  Future<T?> pushAnimated<T>(Widget page) => Navigator.push<T>(this, AppRoutes.fadeSlide(page));

  void pushReplacementAnimated(Widget page) {
    Navigator.pushReplacement(this, AppRoutes.fadeSlide(page));
  }
}

/// Transisi tab bawah (fade + geser tipis).
Widget tabTransitionBuilder(Widget child, Animation<double> animation) {
  final curved = CurvedAnimation(parent: animation, curve: AppMotion.enterCurve);
  return FadeTransition(
    opacity: curved,
    child: SlideTransition(
      position: Tween<Offset>(begin: const Offset(0, 0.025), end: Offset.zero).animate(curved),
      child: child,
    ),
  );
}

/// Page transition theme untuk MaterialApp.
class AppPageTransitions extends PageTransitionsBuilder {
  @override
  Widget buildTransitions<T>(
    PageRoute<T> route,
    BuildContext context,
    Animation<double> animation,
    Animation<double> secondaryAnimation,
    Widget child,
  ) {
    final curved = CurvedAnimation(parent: animation, curve: AppMotion.enterCurve);
    return FadeTransition(
      opacity: curved,
      child: SlideTransition(
        position: Tween<Offset>(begin: const Offset(0.12, 0), end: Offset.zero).animate(curved),
        child: child,
      ),
    );
  }
}
