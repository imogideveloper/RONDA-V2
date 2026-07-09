import 'package:flutter/material.dart';
import '../../config/app_animations.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/pengumuman/announcement_detail_page.dart';
import '../../pages/pengumuman/create_announcement_page.dart';
import '../../services/announcement_read_service.dart';
import '../../services/rt_service.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_tab_skeletons.dart';

class PengumumanTab extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onAnnouncementRead;

  const PengumumanTab({
    super.key,
    required this.profile,
    required this.rt,
    this.onAnnouncementRead,
  });

  @override
  State<PengumumanTab> createState() => _PengumumanTabState();
}

class _PengumumanTabState extends State<PengumumanTab> with AutomaticKeepAliveClientMixin {
  final _rtService = RtService();
  List<AnnouncementModel> _items = [];
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

  Future<void> _load() async {
    if (!_initialLoaded) setState(() => _loading = true);
    final items = await _rtService.getAnnouncements(widget.rt.id);
    final unread = await AnnouncementReadService.instance.unreadCount(widget.rt.id, items);
    if (mounted) {
      setState(() {
        _items = items;
        _unreadCount = unread;
        _loading = false;
        _initialLoaded = true;
      });
    }
  }

  bool get _canPost => widget.profile.isKetua || widget.profile.isBendahara;

  Future<void> _openCreate() async {
    final ok = await context.pushAnimated<bool>(
      CreateAnnouncementPage(rtId: widget.rt.id),
    );
    if (ok == true) {
      await _load();
      widget.onAnnouncementRead?.call();
      if (mounted) AppToast.success(context, 'Pengumuman dipublikasikan');
    }
  }

  Future<void> _openItem(AnnouncementModel a) async {
    await openAnnouncementDetail(
      context,
      a,
      rtId: widget.rt.id,
      onMarkedRead: () {
        _load();
        widget.onAnnouncementRead?.call();
      },
    );
    if (mounted) await _load();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final showSkeleton = _loading && !_initialLoaded;

    return WargaPageBody(
      loading: showSkeleton,
      loadingWidget: const WargaInfoSkeleton(),
      onRefresh: _load,
      children: [
        WargaPageHeader(
          title: 'Pengumuman RT',
          subtitle: 'Informasi untuk ${widget.rt.displayLabel}',
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_unreadCount > 0) ...[
                WargaCountBadge(count: _unreadCount),
                const SizedBox(width: 8),
              ],
              if (_canPost)
                ScalePress(
                  onTap: _openCreate,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: WargaBerandaColors.lightGreen,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.add_rounded, color: WargaBerandaColors.primaryGreen, size: 22),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        if (!_canPost)
          WargaCard(
            child: Text(
              'Pengumuman dari Ketua RT / Bendahara akan muncul di sini.',
              style: WargaBerandaText.greeting(),
            ),
          ),
        if (_items.isEmpty)
          const WargaEmptyState(
            icon: Icons.campaign_outlined,
            iconColor: Color(0xFF185FA5),
            iconBg: WargaBerandaColors.accentBlue,
            message: 'Belum ada pengumuman.\nKetua/Bendahara bisa buat lewat tombol +',
          )
        else
          ..._items.asMap().entries.map(
                (e) => FadeSlideIn(
                  index: e.key,
                  child: WargaPengumumanFeedCard(
                    item: e.value,
                    onTap: () => _openItem(e.value),
                  ),
                ),
              ),
      ],
    );
  }
}
