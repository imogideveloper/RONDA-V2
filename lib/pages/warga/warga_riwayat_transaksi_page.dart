import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../config/smooth_scroll.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../utils/period_grouping.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/rt_app_bar.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_detail_widgets.dart';

class WargaRiwayatTransaksiPage extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;

  const WargaRiwayatTransaksiPage({
    super.key,
    required this.profile,
    required this.rt,
  });

  @override
  State<WargaRiwayatTransaksiPage> createState() => _WargaRiwayatTransaksiPageState();
}

class _WargaRiwayatTransaksiPageState extends State<WargaRiwayatTransaksiPage> {
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
    final txs = await _rtService.getKasTransactions(widget.rt.id, limit: 200);
    if (mounted) {
      setState(() {
        _kas = kas;
        _transactions = txs;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final yearGroups = groupKasKeluarByYearMonth(_transactions);

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const RtAppBar(title: 'Riwayat Transaksi RT', forceBack: true),
      body: _loading
          ? const Center(child: PulseLoader(height: 64, width: 64))
          : WargaPullRefresh(
              onRefresh: _load,
              child: ListView(
                physics: WargaPullRefresh.listPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                children: [
                  WargaPageSummaryDarkCard(
                    saldo: _kas.saldo,
                    totalKeluar: _kas.totalKeluar,
                  ),
                  const SizedBox(height: 8),
                  const Padding(
                    padding: EdgeInsets.only(bottom: 16),
                    child: Text(
                      'Pengeluaran dicatat Ketua RT & Bendahara. Ketuk tahun → bulan → detail transaksi.',
                      style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.35),
                    ),
                  ),
                  if (yearGroups.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text(
                          'Belum ada pengeluaran kas RT.',
                          style: TextStyle(color: AppTheme.textSecondary),
                        ),
                      ),
                    )
                  else
                    ...yearGroups.map((yg) {
                      return WargaYearExpansionTile(
                        year: yg.year,
                        monthCount: yg.monthCount,
                        trailingAmount: '- ${AppTheme.formatRupiah(yg.totalAmount)}',
                        trailingColor: AppTheme.danger,
                        children: yg.months.map((mg) {
                          return WargaMonthExpansionTile(
                            monthTitle: mg.monthTitleOnly,
                            itemCount: mg.items.length,
                            trailingAmount: '- ${AppTheme.formatRupiah(mg.totalAmount)}',
                            trailingColor: AppTheme.danger,
                            children: mg.items
                                .map((tx) => WargaKasTransactionCard(tx: tx))
                                .toList(),
                          );
                        }).toList(),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
