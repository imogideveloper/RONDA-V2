import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

import '../config/app_animations.dart';
import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Item navigasi bawah (gaya sama di semua role).
class RtShellNavItem {
  final IconData activeIcon;
  final IconData inactiveIcon;
  final String label;

  const RtShellNavItem({
    required this.activeIcon,
    required this.inactiveIcon,
    required this.label,
  });
}

/// Bottom nav — palet Warga, animasi halus, haptic saat tap.
class RtShellBottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelected;
  final List<RtShellNavItem> items;

  const RtShellBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onSelected,
    required this.items,
  });

  static List<RtShellNavItem> get wargaItems => const [
        RtShellNavItem(
          activeIcon: Icons.home_rounded,
          inactiveIcon: Icons.home_outlined,
          label: 'Beranda',
        ),
        RtShellNavItem(
          activeIcon: Icons.payments_rounded,
          inactiveIcon: Icons.payments_outlined,
          label: 'Iuran',
        ),
        RtShellNavItem(
          activeIcon: Icons.campaign_rounded,
          inactiveIcon: Icons.campaign_outlined,
          label: 'Info',
        ),
        RtShellNavItem(
          activeIcon: Icons.person_rounded,
          inactiveIcon: Icons.person_outline_rounded,
          label: 'Profil',
        ),
      ];

  static List<RtShellNavItem> get officerItems => const [
        RtShellNavItem(
          activeIcon: Icons.home_rounded,
          inactiveIcon: Icons.home_outlined,
          label: 'Beranda',
        ),
        RtShellNavItem(
          activeIcon: Icons.receipt_long_rounded,
          inactiveIcon: Icons.receipt_long_outlined,
          label: 'Iuran',
        ),
        RtShellNavItem(
          activeIcon: Icons.account_balance_wallet_rounded,
          inactiveIcon: Icons.account_balance_wallet_outlined,
          label: 'Kas',
        ),
        RtShellNavItem(
          activeIcon: Icons.campaign_rounded,
          inactiveIcon: Icons.campaign_outlined,
          label: 'Info',
        ),
        RtShellNavItem(
          activeIcon: Icons.person_rounded,
          inactiveIcon: Icons.person_outline_rounded,
          label: 'Profil',
        ),
      ];

  void _handleTap(int index) {
    if (index == selectedIndex) return;
    HapticFeedback.selectionClick();
    onSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: WargaBerandaColors.card,
        border: Border(top: BorderSide(color: WargaBerandaColors.border)),
        boxShadow: [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 12,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
          child: Row(
            children: List.generate(items.length, (i) {
              return Expanded(
                child: _RtShellNavTile(
                  selected: i == selectedIndex,
                  item: items[i],
                  onTap: () => _handleTap(i),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}

class _RtShellNavTile extends StatelessWidget {
  final bool selected;
  final RtShellNavItem item;
  final VoidCallback onTap;

  const _RtShellNavTile({
    required this.selected,
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ScalePress(
      onTap: onTap,
      pressedScale: 0.92,
      child: AnimatedContainer(
        duration: AppMotion.normal,
        curve: AppMotion.enterCurve,
        margin: const EdgeInsets.symmetric(horizontal: 2),
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        decoration: BoxDecoration(
          color: selected ? WargaBerandaColors.lightGreen.withValues(alpha: 0.65) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedScale(
              scale: selected ? 1.08 : 1.0,
              duration: AppMotion.normal,
              curve: AppMotion.enterCurve,
              child: AnimatedSwitcher(
                duration: AppMotion.fast,
                switchInCurve: AppMotion.enterCurve,
                switchOutCurve: AppMotion.exitCurve,
                transitionBuilder: (child, animation) => FadeTransition(
                  opacity: animation,
                  child: ScaleTransition(scale: animation, child: child),
                ),
                child: Icon(
                  selected ? item.activeIcon : item.inactiveIcon,
                  key: ValueKey<bool>(selected),
                  size: 24,
                  color: selected ? WargaBerandaColors.primaryGreen : WargaBerandaColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 4),
            AnimatedDefaultTextStyle(
              duration: AppMotion.normal,
              curve: AppMotion.enterCurve,
              style: GoogleFonts.poppins(
                fontSize: selected ? 11 : 10,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                color: selected ? WargaBerandaColors.primaryGreen : WargaBerandaColors.textSecondary,
                height: 1.1,
              ),
              child: Text(item.label, maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            const SizedBox(height: 4),
            AnimatedContainer(
              duration: AppMotion.normal,
              curve: AppMotion.enterCurve,
              width: selected ? 20 : 0,
              height: 3,
              decoration: BoxDecoration(
                color: selected ? WargaBerandaColors.primaryGreen : Colors.transparent,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
