import 'package:flutter/material.dart';

import '../../config/iuran_navigation.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/announcement_read_service.dart';
import '../../services/rt_service.dart';
import '../../widgets/warga_home_skeleton.dart';
import 'bendahara_home_view.dart';
import 'ketua_rt_home_view.dart';

class HomeTab extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final ShellNavigateCallback? onNavigateTab;
  final void Function(Future<void> Function() refreshBadge)? onRegisterBadgeRefresh;
  final VoidCallback? onAnnouncementRead;

  const HomeTab({
    super.key,
    required this.profile,
    required this.rt,
    this.onNavigateTab,
    this.onRegisterBadgeRefresh,
    this.onAnnouncementRead,
  });

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> with AutomaticKeepAliveClientMixin {
  final _rtService = RtService();
  KasSummaryModel _kas = KasSummaryModel.empty();
  List<AnnouncementModel> _announcements = [];
  int _belumBayar = 0;
  int _suratPending = 0;
  int _unreadNotif = 0;
  bool _loading = true;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onRegisterBadgeRefresh?.call(_refreshUnreadBadge);
    });
  }

  Future<void> _refreshUnreadBadge() async {
    final unread = await AnnouncementReadService.instance.unreadCount(
      widget.rt.id,
      _announcements,
    );
    if (mounted) setState(() => _unreadNotif = unread);
  }

  Future<void> _load() async {
    if (!_loading) setState(() => _loading = true);
    final kas = await _rtService.getKasSummary(widget.rt.id);
    final ann = await _rtService.getAnnouncements(widget.rt.id);
    var unpaid = 0;
    var suratPending = 0;
    if (widget.profile.isKetua || widget.profile.isBendahara) {
      final bills = await _rtService.getIuranRecords(widget.rt.id);
      unpaid = bills.where((b) => !b.isPaid).length;
      if (widget.profile.isKetua) {
        final surat = await _rtService.getSuratRequests(widget.rt.id, allRt: true);
        suratPending = surat.where((s) => s.isPending).length;
      }
    }
    final unread = await AnnouncementReadService.instance.unreadCount(widget.rt.id, ann);
    if (mounted) {
      setState(() {
        _kas = kas;
        _announcements = ann;
        _belumBayar = unpaid;
        _suratPending = suratPending;
        _unreadNotif = unread;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    if (_loading) {
      return const WargaHomeSkeleton();
    }

    if (widget.profile.isKetua) {
      return KetuaRtHomeView(
        profile: widget.profile,
        rt: widget.rt,
        kas: _kas,
        announcements: _announcements,
        belumBayar: _belumBayar,
        suratPending: _suratPending,
        unreadNotif: _unreadNotif,
        onRefresh: _load,
        onRefreshBadge: _refreshUnreadBadge,
        onAnnouncementRead: widget.onAnnouncementRead,
        onNavigateTab: widget.onNavigateTab,
      );
    }

    return BendaharaHomeView(
      profile: widget.profile,
      rt: widget.rt,
      kas: _kas,
      announcements: _announcements,
      belumBayar: _belumBayar,
      unreadNotif: _unreadNotif,
      onRefresh: _load,
      onRefreshBadge: _refreshUnreadBadge,
      onAnnouncementRead: widget.onAnnouncementRead,
      onNavigateTab: widget.onNavigateTab,
    );
  }
}
