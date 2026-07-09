import 'package:flutter/material.dart';

import '../config/app_theme.dart';

/// AppBar dengan tombol panah kembali (pop atau callback kustom).
class RtAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<Widget>? actions;
  final VoidCallback? onBack;
  final bool forceBack;

  const RtAppBar({
    super.key,
    required this.title,
    this.actions,
    this.onBack,
    this.forceBack = false,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  bool _showBack(BuildContext context) {
    if (forceBack || onBack != null) return true;
    return Navigator.canPop(context);
  }

  @override
  Widget build(BuildContext context) {
    final showBack = _showBack(context);

    return AppBar(
      title: Text(title),
      centerTitle: true,
      automaticallyImplyLeading: false,
      leading: showBack
          ? IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              color: AppTheme.textPrimary,
              tooltip: 'Kembali',
              onPressed: onBack ?? () => Navigator.maybePop(context),
            )
          : null,
      actions: actions,
    );
  }
}
