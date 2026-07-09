import 'package:flutter/material.dart';

import '../../config/app_animations.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../pages/warga/warga_tagihan_iuran_page.dart' hide WargaCard;
import '../../services/rt_service.dart';
import '../../services/warga_home_loader.dart';
import '../../utils/period_grouping.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_iuran_widgets.dart';
import '../../widgets/warga_rt_switcher.dart';
import '../../widgets/warga_tab_skeletons.dart';

/// Tab Iuran warga — hero tetap, konten scroll + pull-to-refresh.
class WargaIuranView extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final VoidCallback? onRtSwitched;

  const WargaIuranView({
    super.key,
    required this.profile,
    required this.rt,
    this.onRtSwitched,
  });

  @override
  State<WargaIuranView> createState() => _WargaIuranViewState();
}

class _WargaIuranViewState extends State<WargaIuranView> with AutomaticKeepAliveClientMixin {
  final _rtService = RtService();
  static const _defaultAmount = 50000.0;

  List<IuranRecordModel> _bills = [];
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
  void didUpdateWidget(covariant WargaIuranView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.rt.id != widget.rt.id) {
      _initialLoaded = false;
      _load();
    }
  }

  Future<void> _load() async {
    if (!_initialLoaded && mounted) setState(() => _loading = true);
    try {
      await _rtService.ensureMyIuran(amount: _defaultAmount).catchError((_) => null);
      final bills = await _rtService.getIuranRecords(widget.rt.id, forUserId: widget.profile.id);
      if (mounted) {
        setState(() {
          _bills = bills;
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

  IuranRecordModel? get _currentBill => _bills.isNotEmpty ? _bills.first : null;

  double get _payAmount => _currentBill?.amount ?? _defaultAmount;

  List<IuranRecordModel> get _paidBills => _bills.where((b) => b.isPaid).toList();

  List<IuranRecordModel> get _unpaidBills => _bills.where((b) => !b.isPaid).toList();

  double get _paidTotal => _paidBills.fold<double>(0, (s, b) => s + b.amount);

  double get _unpaidTotal => _unpaidBills.fold<double>(0, (s, b) => s + b.amount);

  String get _vaNumber {
    final digits = widget.rt.rtNumber.replaceAll(RegExp(r'\D'), '').padLeft(3, '0');
    return '0089-01-005-$digits-510';
  }

  String get _ewalletPhone {
    final p = widget.profile.phone.replaceAll(RegExp(r'\D'), '');
    if (p.length >= 10) return p;
    return '081234567891';
  }

  Future<void> _openBayarFlow() async {
    final ok = await Navigator.push<bool>(
      context,
      AppRoutes.fadeSlide(
        WargaTagihanIuranPage(profile: widget.profile, rt: widget.rt),
      ),
    );
    if (ok == true) {
      WargaHomeLoader.instance.invalidate();
      await _load();
      if (mounted) {
        AppToast.success(context, 'Bukti pembayaran terkirim. Menunggu verifikasi.');
      }
    }
  }

  void _onDownloadBukti() {
    final last = _paidBills.isNotEmpty ? _paidBills.first : null;
    if (last == null) {
      AppToast.show(context, 'Belum ada bukti pembayaran');
      return;
    }
    if (last.paymentProofUrl != null && last.paymentProofUrl!.isNotEmpty) {
      AppToast.show(context, 'Buka bukti: ${last.paymentProofUrl}');
    } else {
      AppToast.show(context, 'Bukti ${iuranPeriodTitle(last)} — unduh PDF segera hadir');
    }
  }

  Widget? _buildRtSwitcher() {
    if (widget.onRtSwitched == null) return null;
    return Align(
      alignment: Alignment.centerLeft,
      child: WargaRtSwitcher(
        activeRt: widget.rt,
        onSwitched: () {
          WargaHomeLoader.instance.invalidate();
          widget.onRtSwitched?.call();
          _load();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    if (_loading && !_initialLoaded) {
      return const ColoredBox(
        color: WargaBerandaColors.bgColor,
        child: SafeArea(bottom: false, child: WargaIuranSkeleton()),
      );
    }

    final current = _currentBill;
    final rtLine = '${widget.rt.displayLabel} · ${widget.rt.name}';
    final bottomPad = MediaQuery.paddingOf(context).bottom + 100;
    final canPay = current != null && current.isUnpaid;
    final paidCount = _paidBills.length;
    final lastPaidLabel = paidCount > 0 ? iuranPeriodTitle(_paidBills.first) : '—';

    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            WargaIuranHeroSection(
              currentBill: current,
              rtLabel: widget.rt.displayLabel,
              rtSwitcher: _buildRtSwitcher(),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _load,
                color: WargaBerandaColors.primaryGreen,
                displacement: 48,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  padding: EdgeInsets.fromLTRB(20, 20, 20, bottomPad),
                  children: [
                    WargaIuranSection(
                      title: 'Metode Pembayaran',
                      children: [
                        WargaIuranQrisCard(
                          rtLabel: rtLine,
                          amount: _payAmount,
                          onScan: canPay
                              ? _openBayarFlow
                              : () => AppToast.show(context, 'Tidak ada tagihan aktif'),
                        ),
                        const SizedBox(height: 12),
                        WargaIuranVirtualAccountCard(
                          rtNumber: widget.rt.rtNumber,
                          accountNumber: _vaNumber,
                          accountName: 'a.n. RT ${widget.rt.rtNumber} Kas Iuran',
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            WargaIuranEwalletTile(
                              label: 'OVO',
                              phone: _ewalletPhone,
                              icon: Icons.account_balance_wallet_outlined,
                              color: const Color(0xFF5B21B6),
                            ),
                            const SizedBox(width: 10),
                            WargaIuranEwalletTile(
                              label: 'GOPAY',
                              phone: _ewalletPhone,
                              icon: Icons.payments_outlined,
                              color: const Color(0xFF0D9488),
                            ),
                            const SizedBox(width: 10),
                            WargaIuranEwalletTile(
                              label: 'DANA',
                              phone: _ewalletPhone,
                              icon: Icons.smartphone_rounded,
                              color: const Color(0xFF2563EB),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    WargaIuranSection(
                      title: 'Riwayat Pembayaran',
                      trailing: paidCount > 0 ? '$paidCount bulan lunas' : null,
                      children: [
                        if (_bills.isEmpty)
                          WargaCard(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Text(
                                'Belum ada riwayat. Tarik ke bawah untuk memuat ulang.',
                                textAlign: TextAlign.center,
                                style: WargaBerandaText.greeting(),
                              ),
                            ),
                          )
                        else ...[
                          ..._bills.map(
                            (b) => WargaIuranHistoryCard(
                              record: b,
                              onPay: b.isUnpaid ? _openBayarFlow : null,
                            ),
                          ),
                          const SizedBox(height: 12),
                          WargaIuranTotalsCard(
                            paidTotal: _paidTotal,
                            paidMonths: _paidBills.length,
                            unpaidTotal: _unpaidTotal,
                            unpaidMonths: _unpaidBills.length,
                          ),
                          const SizedBox(height: 12),
                          WargaIuranDownloadCard(
                            lastPaidLabel: lastPaidLabel,
                            onTap: paidCount > 0 ? _onDownloadBukti : null,
                          ),
                        ],
                      ],
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
