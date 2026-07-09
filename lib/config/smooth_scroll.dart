import 'dart:io';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

/// Scroll halus di seluruh app — tanpa overscroll glow yang bikin jank di Android.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.stylus,
        PointerDeviceKind.trackpad,
      };

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return AppScroll.physics;
  }

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return child;
  }
}

/// Scroll behavior khusus bottom sheet / form (lebih ringan & halus).
class SheetScrollBehavior extends MaterialScrollBehavior {
  const SheetScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => const {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.stylus,
        PointerDeviceKind.trackpad,
      };

  @override
  ScrollPhysics getScrollPhysics(BuildContext context) {
    return AppScroll.sheetPhysics;
  }

  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return child;
  }
}

abstract final class AppScroll {
  /// Daftar halaman utama — geser lebih lembut (iOS-style bounce di semua platform).
  static ScrollPhysics get physics {
    return const AlwaysScrollableScrollPhysics(
      parent: BouncingScrollPhysics(
        decelerationRate: ScrollDecelerationRate.normal,
      ),
    );
  }

  /// Bottom sheet & form — clamp + spring lembut, tanpa lompat di ujung.
  static ScrollPhysics get sheetPhysics {
    if (Platform.isIOS) {
      return const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(
          decelerationRate: ScrollDecelerationRate.normal,
        ),
      );
    }
    return const AlwaysScrollableScrollPhysics(
      parent: SmoothClampingScrollPhysics(),
    );
  }
}

/// Clamping dengan spring lebih empuk (kurangi keras di Android).
class SmoothClampingScrollPhysics extends ClampingScrollPhysics {
  const SmoothClampingScrollPhysics({super.parent});

  @override
  SmoothClampingScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return SmoothClampingScrollPhysics(parent: buildParent(ancestor));
  }

  @override
  SpringDescription get spring => const SpringDescription(
        mass: 0.35,
        stiffness: 90,
        damping: 1.15,
      );
}
