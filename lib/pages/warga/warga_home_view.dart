import 'package:flutter/material.dart';

import '../../config/app_animations.dart';
import '../../config/app_toast.dart';
import '../../config/app_theme.dart';

import '../../models/profile_model.dart';

import '../../models/rt_unit_model.dart';

import '../../models/warga_home_data.dart';

import '../../pages/pengumuman/announcement_detail_page.dart';

import '../../pages/warga/warga_layanan_surat_page.dart';

import '../../pages/warga/warga_kontak_darurat_page.dart';
import '../../pages/warga/warga_kontribusi_saya_page.dart';

import '../../pages/warga/warga_riwayat_transaksi_page.dart';

import '../../pages/warga/warga_tagihan_iuran_page.dart';

import '../../services/announcement_read_service.dart';

import '../../services/warga_home_loader.dart';

import '../../widgets/warga_rt_switcher.dart';

import '../../utils/period_grouping.dart';

import '../../widgets/ketua_rt_dashboard_widgets.dart';

import '../../widgets/warga_beranda_widgets.dart';

import '../../widgets/warga_home_skeleton.dart';



/// Beranda Warga — layout sesuai desain Papan info + aksi cepat.

class WargaHomeView extends StatefulWidget {

  final ProfileModel profile;

  final RtUnitModel rt;

  final void Function(int tabIndex)? onNavigateTab;

  final VoidCallback? onRtSwitched;

  final void Function(Future<void> Function() refreshBadge)? onRegisterBadgeRefresh;



  const WargaHomeView({

    super.key,

    required this.profile,

    required this.rt,

    this.onNavigateTab,

    this.onRtSwitched,

    this.onRegisterBadgeRefresh,

  });



  @override

  State<WargaHomeView> createState() => _WargaHomeViewState();

}



class _WargaHomeViewState extends State<WargaHomeView>

    with AutomaticKeepAliveClientMixin, SingleTickerProviderStateMixin {

  final _loader = WargaHomeLoader.instance;



  WargaHomeData _data = WargaHomeData.empty;

  int _unreadNotif = 0;

  bool _loading = true;

  bool _initialLoaded = false;

  late AnimationController _fadeCtrl;

  late Animation<double> _fadeAnim;



  @override

  bool get wantKeepAlive => true;



  @override

  void initState() {

    super.initState();

    _fadeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 450));

    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);

    _load();

    WidgetsBinding.instance.addPostFrameCallback((_) {

      widget.onRegisterBadgeRefresh?.call(_refreshUnreadBadge);

    });

  }



  @override

  void didUpdateWidget(covariant WargaHomeView oldWidget) {

    super.didUpdateWidget(oldWidget);

    if (oldWidget.rt.id != widget.rt.id ||

        oldWidget.profile.id != widget.profile.id ||

        oldWidget.profile.avatarUrl != widget.profile.avatarUrl ||

        oldWidget.profile.fullName != widget.profile.fullName) {

      if (oldWidget.rt.id != widget.rt.id || oldWidget.profile.id != widget.profile.id) {

        _loader.invalidate();

        _load(force: true);

      }

    }

  }



  @override

  void dispose() {

    _fadeCtrl.dispose();

    super.dispose();

  }



  Future<void> _load({bool isRefresh = false, bool force = false}) async {

    if (!isRefresh && !force && !_initialLoaded) setState(() => _loading = true);



    try {

      final data = await _loader.load(

        rtId: widget.rt.id,

        userId: widget.profile.id,

        force: isRefresh || force,

      );

      if (!mounted) return;

      final unread = await AnnouncementReadService.instance.unreadCount(

        widget.rt.id,

        data.announcements,

      );

      if (!mounted) return;

      setState(() {

        _data = data;

        _unreadNotif = unread;

        _loading = false;

        _initialLoaded = true;

      });

      if (!isRefresh) _fadeCtrl.forward(from: 0);

    } catch (_) {

      if (mounted) setState(() => _loading = false);

    }

  }



  String get _greetingLine => '${greetingByTime()} 👋';



  Future<void> _refreshUnreadBadge() async {

    final unread = await AnnouncementReadService.instance.unreadCount(

      widget.rt.id,

      _data.announcements,

    );

    if (mounted) setState(() => _unreadNotif = unread);

  }



  List<IuranRecordModel> get _unpaid => _data.bills.where((b) => b.isUnpaid).toList();

  List<IuranRecordModel> get _awaiting => _data.awaitingVerification;



  int get _daysLate => maxDaysLate(_unpaid);



  static String _stripDate(DateTime d) {

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    return '${d.day} ${months[d.month - 1]}';

  }



  List<Widget> _buildPapanInfoStrips() {

    final strips = <Widget>[];



    for (final bill in _awaiting) {
      strips.add(
        WargaPapanInfoStrip(
          accentColor: const Color(0xFFF59E0B),
          icon: Icons.schedule_rounded,
          iconBg: WargaBerandaColors.accentYellow,
          iconColor: const Color(0xFFEA580C),
          badge: 'MENUNGGU',
          badgeBg: const Color(0xFFFFF3E0),
          badgeFg: const Color(0xFFEA580C),
          metaRight: bill.submittedAt != null ? _stripDate(bill.submittedAt!) : _stripDate(DateTime.now()),
          title: '${bill.periodLabel} — Menunggu Verifikasi',
          subtitle: '${bill.paymentMethodLabel} · ${AppTheme.formatRupiah(bill.amount)}',
          onTap: _openTagihIuranFlow,
        ),
      );
    }

    for (final bill in _unpaid.take(2)) {
      strips.add(
        WargaPapanInfoStrip(
          accentColor: const Color(0xFFF97316),
          icon: Icons.payments_rounded,
          iconBg: WargaBerandaColors.lightRed,
          iconColor: WargaBerandaColors.dangerRed,
          badge: 'TAGIHAN',
          badgeBg: const Color(0xFFFFF3E0),
          badgeFg: const Color(0xFFEA580C),
          metaRight: _stripDate(DateTime.now()),
          title: '${bill.periodLabel} — Belum lunas',
          subtitle: 'Segera bayar · ${AppTheme.formatRupiah(bill.amount)}',
          onTap: _openTagihIuranFlow,
        ),
      );
    }



    final pendingSurat = _data.mySuratRequests.where((s) => s.isPending).toList();

    if (pendingSurat.isNotEmpty) {

      final s = pendingSurat.first;

      strips.add(

        WargaPapanInfoStrip(

          accentColor: WargaBerandaColors.primaryGreen,

          icon: Icons.home_rounded,

          iconBg: WargaBerandaColors.accentBlue,

          iconColor: const Color(0xFF185FA5),

          badge: 'SURAT',

          badgeBg: WargaBerandaColors.lightGreen,

          badgeFg: WargaBerandaColors.primaryGreen,

          metaRight: s.statusLabel,

          title: s.suratType,

          subtitle: s.purpose.isNotEmpty ? s.purpose : 'Menunggu persetujuan RT',

          onTap: () => _openSurat(),

        ),

      );

    } else {

      final domisili = WargaLayananSuratItem.catalog.first;

      strips.add(

        WargaPapanInfoStrip(

          accentColor: WargaBerandaColors.primaryGreen,

          icon: domisili.icon,

          iconBg: domisili.iconBg,

          iconColor: domisili.iconColor,

          badge: 'SURAT',

          badgeBg: WargaBerandaColors.lightGreen,

          badgeFg: WargaBerandaColors.primaryGreen,

          metaRight: domisili.sla,

          title: domisili.title,

          subtitle: 'Pengajuan baru tersedia',

          onTap: () => _openSurat(initialType: domisili.suratTypeKey),

        ),

      );

    }



    for (final a in _data.announcements.take(4)) {

      strips.add(

        WargaPapanInfoStrip(

          accentColor: const Color(0xFF185FA5),

          icon: Icons.campaign_outlined,

          iconBg: WargaBerandaColors.accentBlue,

          iconColor: const Color(0xFF185FA5),

          badge: a.isPinned ? 'PENTING' : 'INFO',

          badgeBg: a.isPinned ? WargaBerandaColors.accentYellow : WargaBerandaColors.lightGreen,

          badgeFg: a.isPinned ? const Color(0xFFBA7517) : WargaBerandaColors.primaryGreen,

          metaRight: a.createdAtLabel,

          title: a.title,

          subtitle: a.content.length > 48 ? '${a.content.substring(0, 48)}…' : a.content,

          onTap: () => openAnnouncementDetail(

            context,

            a,

            rtId: widget.rt.id,

            onMarkedRead: _refreshUnreadBadge,

          ),

        ),

      );

    }



    return strips;

  }



  Future<void> _openSurat({String? initialType}) {

    return Navigator.push(

      context,

      AppRoutes.fadeSlide(

        WargaLayananSuratPage(

          profile: widget.profile,

          rt: widget.rt,

          initialSuratType: initialType,

        ),

      ),

    );

  }



  Future<void> _openKontakDarurat() {

    return Navigator.push(

      context,

      AppRoutes.fadeSlide(

        WargaKontakDaruratPage(profile: widget.profile, rt: widget.rt),

      ),

    );

  }



  Future<void> _callDarurat() => _openKontakDarurat();



  void _openRiwayatKas() {

    Navigator.push(

      context,

      AppRoutes.fadeSlide(

        WargaRiwayatTransaksiPage(profile: widget.profile, rt: widget.rt),

      ),

    );

  }



  Future<void> _openTagihIuranFlow() async {
    final ok = await Navigator.push<bool>(
      context,
      AppRoutes.fadeSlide(
        WargaTagihanIuranPage(profile: widget.profile, rt: widget.rt),
      ),
    );
    if (ok == true) {
      _loader.invalidate();
      await _load(isRefresh: true);
      if (mounted) {
        AppToast.success(
          context,
          'Bukti pembayaran terkirim! Menunggu verifikasi Bendahara.',
        );
      }
    }
  }

  void _openTagihanIuran({int initialTab = 0}) {
    _openTagihIuranFlow();
  }

  void _openKontribusiSaya() {
    Navigator.push(
      context,
      AppRoutes.fadeSlide(
        WargaKontribusiSayaPage(profile: widget.profile, rt: widget.rt),
      ),
    );
  }



  void _openLayananSurat() {

    _openSurat();

  }



  @override

  Widget build(BuildContext context) {

    super.build(context);



    if (_loading && !_initialLoaded) {

      return const WargaHomeSkeleton();

    }



    final hPad = MediaQuery.sizeOf(context).width * 0.05;

    final bottomPad = MediaQuery.paddingOf(context).bottom + 88;

    final statsLoading = _loading && _initialLoaded;

    final papanStrips = _buildPapanInfoStrips();

    final stripCount = papanStrips.length;



    return ColoredBox(

      color: WargaBerandaColors.bgColor,

      child: SafeArea(

        child: WargaPullRefresh(

          onRefresh: () => _load(isRefresh: true),

          child: FadeTransition(

            opacity: _fadeAnim,

            child: ListView(

              physics: WargaPullRefresh.listPhysics(),

              padding: EdgeInsets.fromLTRB(hPad.clamp(16, 24), 12, hPad.clamp(16, 24), bottomPad),

              children: [

                WargaBerandaHeader(

                  greetingLine: _greetingLine,

                  fullName: widget.profile.fullName,

                  roleRtLine: 'Warga · ${widget.rt.displayLabel}',

                  avatarUrl: widget.profile.avatarUrl,

                  notifCount: _unreadNotif,

                  onNotifTap: () => widget.onNavigateTab?.call(2),

                ),

                const SizedBox(height: 10),

                Align(

                  alignment: Alignment.centerLeft,

                  child: WargaRtSwitcher(

                    activeRt: widget.rt,

                    onSwitched: () {

                      _loader.invalidate();

                      widget.onRtSwitched?.call();

                    },

                  ),

                ),

                const SizedBox(height: 16),

                WargaTotalTagihanCard(

                  total: _data.totalTagihan,

                  bulanTertunggak: _data.bulanTertunggak,

                  daysLate: _daysLate > 0 ? _daysLate : null,

                  onTap: () => _openTagihanIuran(initialTab: 0),

                ),

                const SizedBox(height: 12),

                WargaHomeStatsRow(

                  saldoKas: _data.kas.saldo,

                  totalKontribusi: _data.totalKontribusi,

                  paidCount: _data.paidCount,

                  kasMasukBulanIni: _data.kas.totalMasuk,

                  isLoading: statsLoading,

                  onSaldoTap: _openRiwayatKas,

                  onKontribusiTap: _openKontribusiSaya,

                ),

                const SizedBox(height: 24),

                const WargaSectionHeader(title: 'Aksi cepat', showSparkle: true),

                const SizedBox(height: 14),

                WargaAksiCepatGrid(

                  tagihBadgeCount: _data.bulanTertunggak,

                  onTagihIuran: _openTagihIuranFlow,

                  onSuratRt: () => _openSurat(),

                  onInfo: () => widget.onNavigateTab?.call(2),

                  onLayanan: _openLayananSurat,

                ),

                const SizedBox(height: 12),

                WargaDaruratBanner(onTap: _callDarurat),

                const SizedBox(height: 24),

                WargaPapanInfoHeader(

                  stripCount: stripCount,

                  onLihatSemua: () => widget.onNavigateTab?.call(2),

                ),

                const SizedBox(height: 12),

                if (papanStrips.isEmpty)

                  Padding(

                    padding: const EdgeInsets.symmetric(vertical: 12),

                    child: Text(

                      'Belum ada aktivitas. Cek tab Info untuk pengumuman RT.',

                      style: WargaBerandaText.greeting(),

                    ),

                  )

                else

                  ...papanStrips.take(6),

              ],

            ),

          ),

        ),

      ),

    );

  }

}


