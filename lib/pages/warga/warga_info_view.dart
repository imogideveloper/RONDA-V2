import 'package:flutter/material.dart';

import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/pengumuman/announcement_detail_page.dart';
import '../../services/announcement_read_service.dart';
import '../../services/rt_service.dart';
import '../../utils/announcement_category.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_info_widgets.dart';
import '../../widgets/warga_rt_switcher.dart';
import '../../widgets/warga_tab_skeletons.dart';

/// Tab Informasi warga — daftar pengumuman RT sesuai desain mockup.
class WargaInfoView extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onAnnouncementRead;
  final VoidCallback? onRtSwitched;

  const WargaInfoView({
    super.key,
    required this.profile,
    required this.rt,
    this.onAnnouncementRead,
    this.onRtSwitched,
  });

  @override
  State<WargaInfoView> createState() => _WargaInfoViewState();
}

class _WargaInfoViewState extends State<WargaInfoView> with AutomaticKeepAliveClientMixin {
  final _rtService = RtService();
  List<AnnouncementModel> _items = [];
  Set<String> _readIds = {};
  int _unreadCount = 0;
  bool _loading = true;
  bool _initialLoaded = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(covariant WargaInfoView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.rt.id != widget.rt.id) {
      _initialLoaded = false;
      _load();
    }
  }

  Future<void> _load() async {
    if (!_initialLoaded && mounted) setState(() => _loading = true);
    try {
      final items = await _rtService.getAnnouncements(widget.rt.id);
      final readIds = await AnnouncementReadService.instance.readIdsForRt(widget.rt.id);
      final unread = await AnnouncementReadService.instance.unreadCount(widget.rt.id, items);
      if (mounted) {
        setState(() {
          _items = items;
          _readIds = readIds;
          _unreadCount = unread;
          _loading = false;
          _initialLoaded = true;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _loading = false;
          _initialLoaded = true;
        });
      }
    }
  }

  int _countByKind(AnnouncementCategoryKind kind) {
    return _items.where((a) => categoryKindFor(a) == kind).length;
  }

  bool _isUnread(AnnouncementModel a) => !_readIds.contains(a.id);

  Future<void> _openAnnouncement(AnnouncementModel a) async {
    await openAnnouncementDetail(
      context,
      a,
      rtId: widget.rt.id,
      onMarkedRead: () async {
        await _load();
        widget.onAnnouncementRead?.call();
      },
    );
    if (mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    if (_loading && !_initialLoaded) {
      return const ColoredBox(
        color: WargaBerandaColors.bgColor,
        child: SafeArea(child: WargaInfoSkeleton()),
      );
    }

    final bottomPad = MediaQuery.paddingOf(context).bottom + 88;

    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: Text(
                'Informasi',
                textAlign: TextAlign.center,
                style: WargaBerandaText.sectionTitle().copyWith(fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 10),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Align(
                alignment: Alignment.centerLeft,
                child: WargaRtSwitcher(
                  activeRt: widget.rt,
                  onSwitched: widget.onRtSwitched ?? () {},
                ),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _load,
                color: WargaBerandaColors.primaryGreen,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: EdgeInsets.fromLTRB(20, 0, 20, bottomPad),
                  children: [
                    WargaInfoHeroCard(
                      activeCount: _items.length,
                      unreadCount: _unreadCount,
                      infoCount: _countByKind(AnnouncementCategoryKind.info),
                      kerjaBaktiCount: _countByKind(AnnouncementCategoryKind.kerjaBakti),
                      daruratCount: _countByKind(AnnouncementCategoryKind.darurat),
                    ),
                    const SizedBox(height: 20),
                    if (_items.isEmpty)
                      WargaCard(
                        child: Column(
                          children: [
                            const Icon(
                              Icons.campaign_outlined,
                              size: 48,
                              color: WargaBerandaColors.textSecondary,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Belum ada informasi dari pengurus RT.',
                              textAlign: TextAlign.center,
                              style: WargaBerandaText.greeting(),
                            ),
                          ],
                        ),
                      )
                    else
                      ..._items.asMap().entries.map(
                            (e) => FadeSlideIn(
                              index: e.key,
                              child: WargaInfoAnnouncementCard(
                                item: e.value,
                                isUnread: _isUnread(e.value),
                                onTap: () => _openAnnouncement(e.value),
                              ),
                            ),
                          ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
