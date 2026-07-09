import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/app_theme.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../services/storage_service.dart';
import '../../utils/period_grouping.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_tagihan_flow_widgets.dart';

enum _PayStep { list, confirm, methods, paymentDetail, success }

enum _PayMethod { qris, transfer, cash }

/// Alur Tagih Iuran: pilih tagihan → bayar → upload bukti → menunggu verifikasi → Papan info.
class WargaTagihanIuranPage extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;

  const WargaTagihanIuranPage({
    super.key,
    required this.profile,
    required this.rt,
  });

  @override
  State<WargaTagihanIuranPage> createState() => _WargaTagihanIuranPageState();
}

class _WargaTagihanIuranPageState extends State<WargaTagihanIuranPage> {
  final _rtService = RtService();
  final _storage = StorageService();
  static const _defaultAmount = 50000.0;

  List<IuranRecordModel> _bills = [];
  bool _loading = true;
  _PayStep _step = _PayStep.list;
  _PayMethod? _method;
  final Set<String> _selectedIds = {};
  String? _expandedId;
  String? _proofPath;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      await _rtService.ensureMyIuran(amount: _defaultAmount);
    } catch (_) {}
    final bills = await _rtService.getIuranRecords(widget.rt.id, forUserId: widget.profile.id);
    if (mounted) {
      setState(() {
        _bills = bills;
        _loading = false;
        _selectedIds.removeWhere((id) => !_bills.any((b) => b.id == id && b.isPending));
      });
    }
  }

  List<IuranRecordModel> get _pending => _bills.where((b) => b.isPending).toList();
  List<IuranRecordModel> get _awaiting => _bills.where((b) => b.isAwaitingVerification).toList();
  List<IuranRecordModel> get _selected =>
      _pending.where((b) => _selectedIds.contains(b.id)).toList();

  double get _totalUnpaid => _pending.fold<double>(0, (s, b) => s + b.amount);
  double get _selectedTotal => _selected.fold<double>(0, (s, b) => s + b.amount);
  int get _daysLate => maxDaysLate(_pending);

  void _toggleSelectAll() {
    setState(() {
      if (_selectedIds.length == _pending.length) {
        _selectedIds.clear();
      } else {
        _selectedIds
          ..clear()
          ..addAll(_pending.map((b) => b.id));
      }
    });
  }

  Future<void> _pickProof() async {
    final file = await _storage.pickImageFromGallery();
    if (file != null && mounted) setState(() => _proofPath = file.path);
  }

  Future<void> _submitPayments() async {
    if (_selected.isEmpty || _method == null) return;
    setState(() => _submitting = true);
    try {
      for (final bill in _selected) {
        String? proofUrl;
        if (_proofPath != null && bill == _selected.first) {
          proofUrl = await _storage.uploadIuranPaymentProof(
            rtId: widget.rt.id,
            userId: widget.profile.id,
            file: XFile(_proofPath!),
          );
        }
        await _rtService.submitIuranPayment(
          iuranId: bill.id,
          paymentMethod: _method!.name,
          paymentProofUrl: proofUrl,
        );
      }
      if (!mounted) return;
      setState(() {
        _step = _PayStep.success;
        _submitting = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _submitting = false);
        final msg = e.toString().contains('row-level security') ||
                e.toString().contains('StorageException')
            ? 'Gagal upload bukti. Jalankan migration 013 di Supabase SQL Editor.'
            : 'Gagal mengirim bukti pembayaran.';
        AppToast.error(context, '$msg\n$e');
      }
    }
  }

  PreferredSizeWidget _appBar(String title) {
    return AppBar(
      backgroundColor: WargaBerandaColors.bgColor,
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: WargaBerandaColors.card,
            shape: BoxShape.circle,
            border: Border.all(color: WargaBerandaColors.border),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: WargaBerandaColors.textPrimary),
        ),
        onPressed: () {
          if (_step == _PayStep.list) {
            Navigator.pop(context);
          } else if (_step == _PayStep.success) {
            Navigator.pop(context, true);
          } else {
            setState(() {
              if (_step == _PayStep.paymentDetail) {
                _step = _PayStep.methods;
              } else if (_step == _PayStep.methods) {
                _step = _PayStep.confirm;
              } else {
                _step = _PayStep.list;
              }
            });
          }
        },
      ),
      title: Text(title, style: WargaBerandaText.sectionTitle()),
      centerTitle: true,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: WargaBerandaColors.bgColor,
        appBar: _appBar('Tagihan Iuran'),
        body: const Center(child: PulseLoader(height: 64, width: 64)),
      );
    }

    return Scaffold(
      backgroundColor: WargaBerandaColors.bgColor,
      appBar: _appBar('Tagihan Iuran'),
      body: switch (_step) {
        _PayStep.list => _buildList(),
        _PayStep.confirm => _buildConfirm(),
        _PayStep.methods => _buildMethods(),
        _PayStep.paymentDetail => _buildPaymentDetail(),
        _PayStep.success => _buildSuccess(),
      },
      bottomNavigationBar: _step == _PayStep.list && _selectedIds.isNotEmpty
          ? WargaTagihanPayBar(
              count: _selectedIds.length,
              total: _selectedTotal,
              onPay: () => setState(() => _step = _PayStep.confirm),
            )
          : null,
    );
  }

  Widget _hero() => WargaTagihanHeroCard(
        total: _totalUnpaid,
        bulanTertunggak: _pending.length,
        daysLate: _daysLate,
      );

  Widget _buildList() {
    final yearGroups = groupIuranByYearMonth(_pending);

    return WargaPullRefresh(
      onRefresh: _load,
      child: ListView(
        physics: WargaPullRefresh.listPhysics(),
        padding: EdgeInsets.fromLTRB(20, 8, 20, _selectedIds.isNotEmpty ? 100 : 24),
        children: [
          _hero(),
          if (_awaiting.isNotEmpty) ...[
            const SizedBox(height: 20),
            Row(
              children: [
                const Icon(Icons.schedule_rounded, color: Color(0xFFEA580C), size: 18),
                const SizedBox(width: 6),
                Text(
                  'Menunggu Verifikasi',
                  style: WargaBerandaText.sectionTitle().copyWith(color: const Color(0xFFEA580C)),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ..._awaiting.map((b) => WargaMenungguVerifikasiCard(bill: b)),
          ],
          const SizedBox(height: 20),
          Row(
            children: [
              Text('Belum Dibayar', style: WargaBerandaText.sectionTitle()),
              const Spacer(),
              if (_pending.isNotEmpty)
                ScalePress(
                  onTap: _toggleSelectAll,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: WargaBerandaColors.dangerRed),
                    ),
                    child: Text(
                      'Pilih Semua',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: WargaBerandaColors.dangerRed,
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (_pending.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: Text(
                  _awaiting.isNotEmpty
                      ? 'Semua tagihan sedang diverifikasi Bendahara.'
                      : 'Tidak ada tagihan belum dibayar.',
                  style: WargaBerandaText.greeting(),
                ),
              ),
            )
          else
            ...yearGroups.map((yg) {
              final selectedInYear = yg.months
                  .expand((m) => m.items)
                  .where((b) => _selectedIds.contains(b.id))
                  .length;
              return _YearGroupSection(
                year: yg.year,
                billCount: yg.months.expand((m) => m.items).length,
                total: yg.totalAmount,
                selectedCount: selectedInYear,
                months: yg.months,
                selectedIds: _selectedIds,
                expandedId: _expandedId,
                onSelect: (id) => setState(() {
                  if (_selectedIds.contains(id)) {
                    _selectedIds.remove(id);
                  } else {
                    _selectedIds.add(id);
                  }
                }),
                onExpand: (id) => setState(() {
                  _expandedId = _expandedId == id ? null : id;
                }),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildConfirm() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _hero(),
        const SizedBox(height: 20),
        Text('Konfirmasi Pembayaran', style: WargaBerandaText.sectionTitle()),
        const SizedBox(height: 6),
        Text('Anda akan membayar tagihan berikut:', style: WargaBerandaText.greeting()),
        const SizedBox(height: 16),
        ..._selected.map(
          (b) => Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: wargaCardDecoration(),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(iuranPeriodTitle(b), style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
                      Text('Keamanan + Kebersihan', style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                    ],
                  ),
                ),
                Text(AppTheme.formatRupiah(b.amount), style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: wargaCardDecoration(),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total Pembayaran', style: WargaBerandaText.greeting().copyWith(fontWeight: FontWeight.w600)),
              Text(
                AppTheme.formatRupiah(_selectedTotal),
                style: GoogleFonts.poppins(fontWeight: FontWeight.w700, fontSize: 16),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        WargaPrimaryButton(
          label: 'Pilih Metode Pembayaran',
          onPressed: () => setState(() => _step = _PayStep.methods),
        ),
      ],
    );
  }

  Widget _buildMethods() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _hero(),
        const SizedBox(height: 20),
        Text('Metode Pembayaran', style: WargaBerandaText.sectionTitle()),
        Text(
          '${AppTheme.formatRupiah(_selectedTotal)} — ${_selected.length} tagihan',
          style: WargaBerandaText.greeting(),
        ),
        const SizedBox(height: 16),
        WargaPaymentMethodTile(
          icon: Icons.qr_code_2_rounded,
          iconBg: WargaBerandaColors.lightGreen,
          iconColor: WargaBerandaColors.primaryGreen,
          title: 'QRIS',
          subtitle: 'Scan QR — semua e-wallet & bank',
          onTap: () => setState(() {
            _method = _PayMethod.qris;
            _step = _PayStep.paymentDetail;
          }),
        ),
        WargaPaymentMethodTile(
          icon: Icons.account_balance_rounded,
          iconBg: WargaBerandaColors.accentBlue,
          iconColor: const Color(0xFF185FA5),
          title: 'Transfer Bank',
          subtitle: 'Transfer via ATM/mobile banking BRI',
          onTap: () => setState(() {
            _method = _PayMethod.transfer;
            _step = _PayStep.paymentDetail;
          }),
        ),
        WargaPaymentMethodTile(
          icon: Icons.payments_rounded,
          iconBg: WargaBerandaColors.accentYellow,
          iconColor: const Color(0xFFBA7517),
          title: 'Bayar Tunai',
          subtitle: 'Serahkan ke Bendahara RT',
          onTap: () => setState(() {
            _method = _PayMethod.cash;
            _step = _PayStep.paymentDetail;
          }),
        ),
      ],
    );
  }

  Widget _buildPaymentDetail() {
    final method = _method ?? _PayMethod.qris;
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _hero(),
        const SizedBox(height: 16),
        if (method == _PayMethod.qris) ...[
          WargaCard(
            child: Column(
              children: [
                Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    color: WargaBerandaColors.lightGreen,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.qr_code_2_rounded, size: 120, color: WargaBerandaColors.primaryGreen),
                ),
                const SizedBox(height: 12),
                Text(widget.rt.displayLabel, style: WargaBerandaText.sectionTitle().copyWith(fontSize: 14)),
                Text(AppTheme.formatRupiah(_selectedTotal), style: WargaBerandaText.greeting()),
                const SizedBox(height: 12),
                Text(
                  'Scan QR lalu upload bukti pembayaran di bawah.',
                  textAlign: TextAlign.center,
                  style: WargaBerandaText.greeting().copyWith(fontSize: 12, height: 1.4),
                ),
              ],
            ),
          ),
        ] else if (method == _PayMethod.transfer) ...[
          WargaCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: WargaBerandaColors.accentBlue,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.credit_card_rounded, color: Color(0xFF185FA5)),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Transfer Bank BRI', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 14)),
                          Text('${widget.rt.name} Kas Iuran', style: WargaBerandaText.greeting()),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: WargaBerandaColors.bgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('NOMOR REKENING', style: WargaBerandaText.labelCaps()),
                      const SizedBox(height: 6),
                      Text(
                        '0089 0100 5003 510',
                        style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: 1.2),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ] else ...[
          WargaCard(
            color: const Color(0xFFFFFBEB),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.payments_rounded, color: Color(0xFFBA7517), size: 28),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Pembayaran Tunai',
                        style: WargaBerandaText.sectionTitle().copyWith(color: const Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Serahkan uang tunai ke Bendahara RT dan minta tanda terima. Upload foto tanda terima sebagai bukti.',
                  style: WargaBerandaText.greeting().copyWith(height: 1.4),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 20),
        Text('Upload Bukti Pembayaran', style: WargaBerandaText.sectionTitle()),
        const SizedBox(height: 4),
        Text(
          'Upload screenshot/foto bukti transfer atau tanda terima',
          style: WargaBerandaText.greeting().copyWith(fontSize: 12),
        ),
        const SizedBox(height: 10),
        WargaUploadBuktiBox(
          onTap: _pickProof,
          imagePath: _proofPath,
        ),
        const SizedBox(height: 20),
        WargaPrimaryButton(
          label: _submitting ? 'Mengirim...' : 'Kirim Bukti Pembayaran',
          onPressed: _proofPath == null || _submitting ? null : _submitPayments,
        ),
      ],
    );
  }

  Widget _buildSuccess() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _hero(),
        const SizedBox(height: 32),
        Center(
          child: Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: WargaBerandaColors.lightGreen,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.check_circle_rounded, color: WargaBerandaColors.primaryGreen, size: 48),
          ),
        ),
        const SizedBox(height: 16),
        Center(child: Text('Bukti Terkirim!', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 22))),
        const SizedBox(height: 8),
        Text(
          'Bukti pembayaran sedang diverifikasi Bendahara RT. Setelah disetujui, status tagihan berubah menjadi lunas dan akan tampil di Papan info Beranda.',
          textAlign: TextAlign.center,
          style: WargaBerandaText.greeting().copyWith(height: 1.5),
        ),
        const SizedBox(height: 20),
        WargaCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('RINGKASAN', style: WargaBerandaText.labelCaps()),
              const SizedBox(height: 12),
              _summaryRow('Metode', _method?.name.toUpperCase() ?? 'QRIS'),
              _summaryRow('Jumlah Tagihan', '${_selected.length} periode'),
              _summaryRow('Total', AppTheme.formatRupiah(_selectedTotal)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Text('Status', style: WargaBerandaText.greeting()),
                  const Spacer(),
                  const Icon(Icons.schedule_rounded, color: Color(0xFFEA580C), size: 16),
                  const SizedBox(width: 4),
                  Text(
                    'Menunggu Verifikasi',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFEA580C),
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        WargaPrimaryButton(
          label: 'Kembali ke Beranda',
          onPressed: () => Navigator.pop(context, true),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Expanded(child: Text(label, style: WargaBerandaText.greeting())),
          Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }
}

class WargaCard extends StatelessWidget {
  final Widget child;
  final Color? color;

  const WargaCard({super.key, required this.child, this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color ?? WargaBerandaColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: WargaBerandaColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _YearGroupSection extends StatefulWidget {
  final int year;
  final int billCount;
  final double total;
  final int selectedCount;
  final List<PeriodMonthGroup<IuranRecordModel>> months;
  final Set<String> selectedIds;
  final String? expandedId;
  final ValueChanged<String> onSelect;
  final ValueChanged<String> onExpand;

  const _YearGroupSection({
    required this.year,
    required this.billCount,
    required this.total,
    required this.selectedCount,
    required this.months,
    required this.selectedIds,
    required this.expandedId,
    required this.onSelect,
    required this.onExpand,
  });

  @override
  State<_YearGroupSection> createState() => _YearGroupSectionState();
}

class _YearGroupSectionState extends State<_YearGroupSection> {
  bool _open = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ScalePress(
          onTap: () => setState(() => _open = !_open),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF5F5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Row(
              children: [
                Icon(_open ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded, size: 20),
                const SizedBox(width: 6),
                Text('${widget.year}', style: GoogleFonts.poppins(fontWeight: FontWeight.w700)),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: WargaBerandaColors.lightRed,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${widget.billCount} tagihan',
                    style: GoogleFonts.poppins(fontSize: 10, fontWeight: FontWeight.w600, color: WargaBerandaColors.dangerRed),
                  ),
                ),
                if (widget.selectedCount > 0) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: WargaBerandaColors.lightGreen,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${widget.selectedCount} dipilih',
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: WargaBerandaColors.primaryGreen,
                      ),
                    ),
                  ),
                ],
                const Spacer(),
                Text(
                  AppTheme.formatRupiah(widget.total),
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: WargaBerandaColors.dangerRed),
                ),
              ],
            ),
          ),
        ),
        if (_open)
          ...widget.months.expand((m) => m.items).map(
                (b) => WargaTagihanBillTile(
                  bill: b,
                  selected: widget.selectedIds.contains(b.id),
                  expanded: widget.expandedId == b.id,
                  onToggleSelect: () => widget.onSelect(b.id),
                  onToggleExpand: () => widget.onExpand(b.id),
                ),
              ),
      ],
    );
  }
}
