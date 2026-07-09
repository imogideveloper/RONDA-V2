import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../config/app_toast.dart';
import '../../config/iuran_navigation.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/ketua_iuran_bill_card.dart';
import '../../widgets/rt_ui_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_tab_skeletons.dart';

class IuranTab extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final IuranKetuaMode ketuaMode;
  final VoidCallback? onBack;

  const IuranTab({
    super.key,
    required this.profile,
    required this.rt,
    this.ketuaMode = IuranKetuaMode.semua,
    this.onBack,
  });



  @override

  State<IuranTab> createState() => _IuranTabState();

}



class _IuranTabState extends State<IuranTab> {

  final _rtService = RtService();

  List<IuranRecordModel> _bills = [];
  Map<String, ProfileModel> _memberById = {};
  String? _expandedBillId;
  String? _approvingBillId;
  bool _loading = true;
  String? _error;



  static const _defaultAmount = 50000.0;



  @override

  void initState() {

    super.initState();

    _load();

  }



  Future<void> _load() async {

    setState(() {

      _loading = true;

      _error = null;

    });



    try {

      if (widget.profile.isWarga) {

        try {

          await _rtService.ensureMyIuran(amount: _defaultAmount);

        } catch (_) {}

      }



      final userId = widget.profile.isWarga ? widget.profile.id : null;
      final bills = await _rtService.getIuranRecords(widget.rt.id, forUserId: userId);

      Map<String, ProfileModel> members = {};
      if (widget.profile.isKetua || widget.profile.isBendahara) {
        final list = await _rtService.getRtMembers();
        members = {for (final m in list) m.id: m};
      }

      if (mounted) {
        setState(() {
          _bills = bills;
          _memberById = members;
          _loading = false;
        });
      }

    } catch (e) {

      if (mounted) {

        setState(() {

          _error = e.toString();

          _loading = false;

        });

      }

    }

  }



  Future<void> _generateMonthly() async {

    try {

      final n = await _rtService.ensureMonthlyIuran(amount: _defaultAmount);

      if (mounted) {

        AppToast.success(context, n > 0 ? '$n tagihan baru dibuat' : 'Tagihan bulan ini sudah ada');

      }

      await _load();

    } catch (e) {

      if (mounted) {

        AppToast.error(context, '$e');

      }

    }

  }



  Future<void> _approveBill(IuranRecordModel bill) async {
    setState(() => _approvingBillId = bill.id);
    try {
      await _rtService.approveIuranAsOfficer(bill.id);
      if (mounted) {
        AppToast.success(context, 'Iuran ${bill.userName ?? 'warga'} disetujui');
      }
      await _load();
    } catch (e) {
      if (mounted) AppToast.error(context, '$e');
    } finally {
      if (mounted) setState(() => _approvingBillId = null);
    }
  }

  Future<void> _payBill(IuranRecordModel bill) async {

    final confirm = await showDialog<bool>(

      context: context,

      builder: (_) => AlertDialog(

        title: Text('Konfirmasi Pembayaran', style: WargaBerandaText.sectionTitle()),
        content: Text(
          'Bayar iuran ${bill.periodLabel} sebesar ${AppTheme.formatRupiah(bill.amount)}?\n\n(Demo: seperti scan QRIS, saldo kas RT akan bertambah.)',
          style: WargaBerandaText.greeting(),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: WargaBerandaColors.primaryGreen),
            child: const Text('Bayar'),
          ),
        ],

      ),

    );

    if (confirm != true) return;



    try {

      await _rtService.payIuran(bill.id);

      if (mounted) {

        AppToast.success(context, 'Pembayaran berhasil');

      }

      await _load();

    } catch (e) {

      if (mounted) {

        AppToast.error(context, '$e');

      }

    }

  }



  void _showQris(IuranRecordModel bill) {

    showModalBottomSheet(
      context: context,
      backgroundColor: WargaBerandaColors.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 180,
              height: 180,
              decoration: BoxDecoration(
                color: WargaBerandaColors.lightGreen,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: WargaBerandaColors.primaryGreen.withValues(alpha: 0.3)),
              ),
              child: const Icon(Icons.qr_code_2_rounded, size: 120, color: WargaBerandaColors.primaryGreen),
            ),
            const SizedBox(height: 16),
            Text('Bayar ${bill.periodLabel}', style: WargaBerandaText.sectionTitle()),
            const SizedBox(height: 8),
            Text(
              AppTheme.formatRupiah(bill.amount),
              style: WargaBerandaText.sectionTitle().copyWith(
                fontSize: 22,
                color: WargaBerandaColors.primaryGreen,
              ),
            ),
            const SizedBox(height: 20),
            WargaPrimaryButton(
              label: 'Konfirmasi Sudah Bayar',
              onPressed: () {
                Navigator.pop(context);
                _payBill(bill);
              },
            ),
          ],
        ),
      ),
    );

  }



  @override
  Widget build(BuildContext context) {
    final isWarga = widget.profile.isWarga;
    final canManage = widget.profile.isKetua || widget.profile.isBendahara;
    final unpaid = _bills.where((b) => !b.isPaid).toList();
    final paid = _bills.where((b) => b.isPaid).toList();
    final ketuaFocused = canManage &&
        (widget.ketuaMode == IuranKetuaMode.tagih || widget.ketuaMode == IuranKetuaMode.verifikasi);

    String appTitle = 'Iuran RT';
    if (widget.ketuaMode == IuranKetuaMode.tagih) appTitle = 'Tagih Iuran';
    if (widget.ketuaMode == IuranKetuaMode.verifikasi) appTitle = 'Verifikasi Iuran';

    return WargaPageBody(
      loading: _loading,
      loadingWidget: const WargaIuranSkeleton(),
      onRefresh: _load,
      children: [
        if (widget.onBack != null) ...[
          ScalePress(
            onTap: widget.onBack!,
            child: Row(
              children: [
                const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: WargaBerandaColors.primaryGreen),
                const SizedBox(width: 6),
                Text(
                  'Kembali ke Beranda',
                  style: WargaBerandaText.greeting().copyWith(
                    color: WargaBerandaColors.primaryGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        WargaPageHeader(
          title: appTitle,
          subtitle: widget.rt.displayLabel,
          trailing: canManage
              ? ScalePress(
                  onTap: _loading ? null : _generateMonthly,
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: WargaBerandaColors.lightGreen,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.refresh_rounded, color: WargaBerandaColors.primaryGreen, size: 22),
                  ),
                )
              : null,
        ),
        const SizedBox(height: 16),
        if (_error != null)
          WargaCard(
            child: Text(
              'Database belum siap. Jalankan migration 005 di Supabase SQL Editor.\n\n$_error',
              style: WargaBerandaText.greeting().copyWith(color: WargaBerandaColors.dangerRed, fontSize: 12),
            ),
          ),
        if (_error != null) const SizedBox(height: 12),
        WargaCard(
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: WargaBerandaColors.primaryGreen),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  isWarga
                      ? 'Iuran bulanan ${AppTheme.formatRupiah(_defaultAmount)}. Bayar via QRIS (demo).'
                      : ketuaFocused
                          ? widget.ketuaMode == IuranKetuaMode.tagih
                              ? 'Ketuk kartu warga untuk mention WhatsApp atau approve pembayaran.'
                              : 'Ketuk kartu warga untuk verifikasi pembayaran iuran.'
                          : 'Pantau status pembayaran iuran warga RT. Ketuk ↻ untuk buat tagihan bulan ini.',
                  style: WargaBerandaText.greeting().copyWith(height: 1.4),
                ),
              ),
            ],
          ),
        ),
        if (isWarga && unpaid.isNotEmpty) ...[
          const SizedBox(height: 16),
          WargaPrimaryButton(
            icon: Icons.qr_code_2_rounded,
            label: 'Bayar ${unpaid.first.periodLabel}',
            onPressed: () => _showQris(unpaid.first),
          ),
        ],
        const SizedBox(height: 20),
        if (canManage && ketuaFocused) ...[
          WargaSectionHeader(
            title: widget.ketuaMode == IuranKetuaMode.tagih ? 'Warga belum bayar' : 'Menunggu verifikasi',
          ),
          const SizedBox(height: 10),
          if (unpaid.isEmpty)
            const WargaEmptyState(
              icon: Icons.celebration_outlined,
              message: 'Semua iuran bulan ini sudah lunas.',
            )
          else
            ...unpaid.map(
              (b) => KetuaExpandableIuranCard(
                bill: b,
                warga: _memberById[b.userId],
                rt: widget.rt,
                mode: widget.ketuaMode,
                expanded: _expandedBillId == b.id,
                approving: _approvingBillId == b.id,
                onToggle: () => setState(() {
                  _expandedBillId = _expandedBillId == b.id ? null : b.id;
                }),
                onApprove: () => _approveBill(b),
              ),
            ),
          if (paid.isNotEmpty) ...[
            const SizedBox(height: 16),
            const WargaSectionHeader(title: 'Sudah lunas'),
            const SizedBox(height: 10),
            ...paid.take(6).map((b) => _BillCard(bill: b, showName: true, onPay: null)),
          ],
        ] else if (canManage) ...[
          const WargaSectionHeader(title: 'Semua Tagihan RT'),
          const SizedBox(height: 10),
          if (_bills.isEmpty)
            const WargaEmptyState(
              icon: Icons.receipt_long_outlined,
              message: 'Belum ada tagihan.\nKetuk ikon refresh di atas.',
            )
          else
            ..._bills.map((b) => _BillCard(bill: b, showName: true, onPay: null)),
        ] else ...[
          const WargaSectionHeader(title: 'Tagihan Bulanan'),
          const SizedBox(height: 10),
          if (_bills.isEmpty)
            const WargaEmptyState(icon: Icons.receipt_long_outlined, message: 'Belum ada tagihan.')
          else ...[
            ...unpaid.map((b) => _BillCard(bill: b, onPay: () => _showQris(b))),
            ...paid.map((b) => _BillCard(bill: b)),
          ],
          if (paid.isNotEmpty) ...[
            const SizedBox(height: 20),
            const WargaSectionHeader(title: 'Riwayat Transaksi'),
            const SizedBox(height: 10),
            Container(
              decoration: wargaCardDecoration(),
              child: Column(
                children: [
                  for (var i = 0; i < paid.length; i++) ...[
                    if (i > 0) const Divider(height: 1, color: WargaBerandaColors.border),
                    WargaHistoryRow(
                      title: paid[i].periodLabel,
                      subtitle: 'Dibayar ${paid[i].paidDateLabel}',
                      amountLabel: AppTheme.formatRupiah(paid[i].amount),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ],
    );
  }

}



class _BillCard extends StatelessWidget {

  final IuranRecordModel bill;

  final VoidCallback? onPay;

  final bool showName;



  const _BillCard({required this.bill, this.onPay, this.showName = false});



  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: WargaCard(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    showName && bill.userName != null ? '${bill.userName} — ${bill.periodLabel}' : bill.periodLabel,
                    style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Text(AppTheme.formatRupiah(bill.amount), style: WargaBerandaText.greeting()),
                ],
              ),
            ),
            StatusChip(
              label: bill.isPaid ? 'Lunas' : 'Belum bayar',
              color: bill.isPaid ? WargaBerandaColors.primaryGreen : const Color(0xFFBA7517),
            ),
            if (onPay != null) ...[
              const SizedBox(width: 8),
              IconButton(
                onPressed: onPay,
                icon: const Icon(Icons.qr_code_scanner_rounded, color: WargaBerandaColors.primaryGreen),
              ),
            ],
          ],
        ),
      ),
    );
  }

}


