import 'package:flutter/material.dart';

import '../../config/iuran_navigation.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../widgets/rt_shell_nav.dart';
import '../../widgets/smooth_tab_shell_body.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../tabs/home_tab.dart';
import '../tabs/iuran_tab.dart';
import '../tabs/kas_tab.dart';
import '../tabs/pengumuman_tab.dart';
import '../tabs/profil_tab.dart';

/// Shell Ketua RT / Bendahara — UI & navigasi selaras dengan Warga.
class MainShell extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onProfileUpdated;

  const MainShell({
    super.key,
    required this.profile,
    required this.rt,
    this.onProfileUpdated,
  });

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  IuranKetuaMode _iuranMode = IuranKetuaMode.semua;
  Future<void> Function()? _refreshHomeBadge;

  void _goTab(int index, {IuranKetuaMode? iuranMode}) {
    if (index == _index && (index != 1 || iuranMode == null || iuranMode == _iuranMode)) {
      if (index == 0) _refreshHomeBadge?.call();
      return;
    }
    setState(() {
      _index = index;
      if (index == 1) {
        _iuranMode = iuranMode ?? IuranKetuaMode.semua;
      }
    });
    if (index == 0) _refreshHomeBadge?.call();
  }

  List<Widget> _buildTabs() => [
        HomeTab(
          key: ValueKey('officer-home-${widget.rt.id}-${widget.profile.avatarUrl}'),
          profile: widget.profile,
          rt: widget.rt,
          onNavigateTab: _goTab,
          onRegisterBadgeRefresh: (fn) => _refreshHomeBadge = fn,
          onAnnouncementRead: () => _refreshHomeBadge?.call(),
        ),
        IuranTab(
          key: ValueKey('officer-iuran-${widget.rt.id}-${_iuranMode.name}'),
          profile: widget.profile,
          rt: widget.rt,
          ketuaMode: _iuranMode,
          onBack: _iuranMode == IuranKetuaMode.tagih || _iuranMode == IuranKetuaMode.verifikasi
              ? () => _goTab(0)
              : null,
        ),
        KasTab(
          key: ValueKey('officer-kas-${widget.rt.id}'),
          profile: widget.profile,
          rt: widget.rt,
        ),
        PengumumanTab(
          key: ValueKey('officer-info-${widget.rt.id}'),
          profile: widget.profile,
          rt: widget.rt,
          onAnnouncementRead: () => _refreshHomeBadge?.call(),
        ),
        ProfilTab(
          key: ValueKey('officer-profil-${widget.profile.id}-${widget.profile.avatarUrl}'),
          profile: widget.profile,
          rt: widget.rt,
          onProfileUpdated: widget.onProfileUpdated,
        ),
      ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WargaBerandaColors.bgColor,
      body: SmoothTabShellBody(
        index: _index,
        children: _buildTabs(),
      ),
      bottomNavigationBar: RtShellBottomNav(
        selectedIndex: _index,
        onSelected: (i) {
          if (i == 1) {
            _goTab(i, iuranMode: IuranKetuaMode.semua);
          } else {
            _goTab(i);
          }
        },
        items: RtShellBottomNav.officerItems,
      ),
    );
  }
}
