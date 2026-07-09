import 'package:flutter/material.dart';

import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../widgets/rt_shell_nav.dart';
import '../../widgets/smooth_tab_shell_body.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../warga/warga_home_view.dart';
import '../warga/warga_info_view.dart';
import '../warga/warga_iuran_view.dart';
import '../warga/warga_profil_view.dart';

/// Shell navigasi khusus warga: Beranda, Iuran, Info, Profil.
class WargaMainShell extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onProfileOrRtChanged;

  const WargaMainShell({
    super.key,
    required this.profile,
    required this.rt,
    this.onProfileOrRtChanged,
  });

  @override
  State<WargaMainShell> createState() => _WargaMainShellState();
}

class _WargaMainShellState extends State<WargaMainShell> {
  int _index = 0;
  Future<void> Function()? _refreshHomeBadge;

  /// Tab dibangun ulang di [build] agar foto/nama profil sinkron ke Beranda.
  List<Widget> _buildTabs() => [
        WargaHomeView(
          key: ValueKey('home-${widget.rt.id}-${widget.profile.avatarUrl}'),
          profile: widget.profile,
          rt: widget.rt,
          onNavigateTab: _goTab,
          onRtSwitched: widget.onProfileOrRtChanged,
          onRegisterBadgeRefresh: (fn) => _refreshHomeBadge = fn,
        ),
        WargaIuranView(
          key: ValueKey('iuran-${widget.rt.id}-${widget.profile.id}'),
          profile: widget.profile,
          rt: widget.rt,
          onRtSwitched: widget.onProfileOrRtChanged,
        ),
        WargaInfoView(
          key: ValueKey('info-${widget.rt.id}-${widget.profile.id}'),
          profile: widget.profile,
          rt: widget.rt,
          onAnnouncementRead: () => _refreshHomeBadge?.call(),
          onRtSwitched: widget.onProfileOrRtChanged,
        ),
        WargaProfilView(
          key: ValueKey('profil-${widget.profile.id}-${widget.profile.avatarUrl}'),
          profile: widget.profile,
          rt: widget.rt,
          onProfileUpdated: widget.onProfileOrRtChanged,
        ),
      ];

  void _goTab(int index) {
    if (index == _index) return;
    setState(() => _index = index);
    if (index == 0) _refreshHomeBadge?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WargaBerandaColors.background,
      body: SmoothTabShellBody(
        index: _index,
        children: _buildTabs(),
      ),
      bottomNavigationBar: RtShellBottomNav(
        selectedIndex: _index,
        onSelected: _goTab,
        items: RtShellBottomNav.wargaItems,
      ),
    );
  }
}
