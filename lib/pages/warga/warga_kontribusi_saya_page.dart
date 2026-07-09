import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../utils/period_grouping.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_detail_widgets.dart';

/// Riwayat iuran lunas warga — dibuka dari kartu TOTAL KONTRIBUSI di beranda.
class WargaKontribusiSayaPage extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;

  const WargaKontribusiSayaPage({
    super.key,
    required this.profile,
    required this.rt,
  });

  @override
  State<WargaKontribusiSayaPage> createState() => _WargaKontribusiSayaPageState();
}

class _WargaKontribusiSayaPageState extends State<WargaKontribusiSayaPage> {
  final _rtService = RtService();
  List<IuranRecordModel> _paid = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final all = await _rtService.getIuranRecords(
      widget.rt.id,
      forUserId: widget.profile.id,
    );
    if (mounted) {
      setState(() {
        _paid = all.where((b) => b.isPaid).toList();
        _loading = false;
      });
    }
  }

  double get _total => _paid.fold<double>(0, (s, b) => s + b.amount);

  @override
  Widget build(BuildContext context) {
    final yearGroups = groupIuranByYearMonth(_paid);

    return Scaffold(
      backgroundColor: WargaBerandaColors.bgColor,
      appBar: AppBar(
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
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('Kontribusi Saya', style: WargaBerandaText.sectionTitle()),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: PulseLoader(height: 64, width: 64))
          : WargaPullRefresh(
              onRefresh: _load,
              child: ListView(
                physics: WargaPullRefresh.listPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                children: [
                  WargaKontribusiHeroCard(total: _total, bulanCount: _paid.length),
                  const SizedBox(height: 20),
                  if (yearGroups.isEmpty)
                    WargaCard(
                      child: Text(
                        'Belum ada iuran yang lunas. Setelah Bendahara memverifikasi pembayaran, riwayat akan muncul di sini.',
                        style: WargaBerandaText.greeting(),
                      ),
                    )
                  else
                    ...yearGroups.map((yg) {
                      final cards = <Widget>[];
                      for (final mg in yg.months) {
                        for (final record in mg.items) {
                          cards.add(WargaPaidIuranCard(record: record));
                        }
                      }
                      return WargaYearExpansionTile(
                        year: yg.year,
                        monthCount: yg.monthCount,
                        trailingAmount: AppTheme.formatRupiah(yg.totalAmount),
                        trailingColor: WargaBerandaColors.primaryGreen,
                        accentBadge: true,
                        children: cards,
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
