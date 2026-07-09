import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../config/app_theme.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/feature_sheets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_tab_skeletons.dart';

class KasTab extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;

  const KasTab({super.key, required this.profile, required this.rt});

  @override
  State<KasTab> createState() => _KasTabState();
}

class _KasTabState extends State<KasTab> {
  final _rtService = RtService();
  KasSummaryModel _kas = KasSummaryModel.empty();
  List<KasTransactionModel> _transactions = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final kas = await _rtService.getKasSummary(widget.rt.id);
    final txs = await _rtService.getKasTransactions(widget.rt.id);
    if (mounted) {
      setState(() {
        _kas = kas;
        _transactions = txs;
        _loading = false;
      });
    }
  }

  bool get _canEdit => widget.profile.isKetua || widget.profile.isBendahara;

  Future<void> _openForm(bool isIncome) async {
    final ok = await showKasFormSheet(
      context,
      isIncome: isIncome,
      onSubmit: (amount, desc) => _rtService.addKasTransaction(
        rtId: widget.rt.id,
        type: isIncome ? 'masuk' : 'keluar',
        amount: amount,
        description: desc,
        category: isIncome ? 'pemasukan' : 'pengeluaran',
      ),
    );
    if (ok == true) {
      await _load();
      if (mounted) {
        AppToast.success(context, 'Transaksi tersimpan');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const WargaPageBody(loading: true, loadingWidget: WargaIuranSkeleton(), children: []);
    }

    return WargaPageBody(
      onRefresh: _load,
      children: [
        WargaPageHeader(
          title: 'Kas RT',
          subtitle: widget.rt.displayLabel,
          trailing: _canEdit
              ? ScalePress(
                  onTap: () => _showAddDialog(context),
                  child: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: WargaBerandaColors.lightGreen,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.add_rounded, color: WargaBerandaColors.primaryGreen, size: 22),
                  ),
                )
              : null,
        ),
        const SizedBox(height: 16),
        FadeSlideIn(
          child: WargaCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Saldo kas', style: WargaBerandaText.labelCaps()),
                const SizedBox(height: 8),
                AnimatedCountText(
                  value: _kas.saldo,
                  formatter: AppTheme.formatRupiah,
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.w600,
                    color: WargaBerandaColors.primaryGreen,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: _KasMini(label: 'Pemasukan', value: _kas.totalMasuk, positive: true)),
                    const SizedBox(width: 12),
                    Expanded(child: _KasMini(label: 'Pengeluaran', value: _kas.totalKeluar, positive: false)),
                  ],
                ),
              ],
            ),
          ),
        ),
        if (!_canEdit) ...[
          const SizedBox(height: 12),
          WargaCard(
            child: Text(
              'Hanya Ketua RT / Bendahara yang dapat mencatat transaksi.',
              style: WargaBerandaText.greeting(),
            ),
          ),
        ],
        const SizedBox(height: 20),
        const WargaSectionHeader(title: 'Riwayat transaksi'),
        const SizedBox(height: 10),
        if (_transactions.isEmpty)
          const WargaEmptyState(
            icon: Icons.receipt_long_outlined,
            message: 'Belum ada transaksi.\nTambah lewat tombol + di atas.',
          )
        else
          ..._transactions.map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: WargaHistoryRow(
                title: t.description,
                subtitle: t.dateLabel,
                amountLabel: '${t.isIncome ? '+' : '-'}${AppTheme.formatRupiah(t.amount)}',
                success: t.isIncome,
              ),
            ),
          ),
      ],
    );
  }

  void _showAddDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: WargaBerandaColors.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.add_circle, color: WargaBerandaColors.primaryGreen),
              title: Text('Catat Pemasukan', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
              onTap: () {
                Navigator.pop(context);
                _openForm(true);
              },
            ),
            ListTile(
              leading: const Icon(Icons.remove_circle, color: WargaBerandaColors.dangerRed),
              title: Text('Catat Pengeluaran', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
              onTap: () {
                Navigator.pop(context);
                _openForm(false);
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _KasMini extends StatelessWidget {
  final String label;
  final double value;
  final bool positive;

  const _KasMini({required this.label, required this.value, required this.positive});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: WargaBerandaColors.lightGreen,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: WargaBerandaText.labelCaps()),
          AnimatedCountText(
            value: value,
            formatter: AppTheme.formatRupiah,
            duration: const Duration(milliseconds: 700),
            style: GoogleFonts.poppins(
              fontWeight: FontWeight.w600,
              fontSize: 14,
              color: positive ? WargaBerandaColors.primaryGreen : WargaBerandaColors.dangerRed,
            ),
          ),
        ],
      ),
    );
  }
}
