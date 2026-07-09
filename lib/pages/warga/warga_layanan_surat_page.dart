import 'package:flutter/material.dart';

import '../../config/app_animations.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_surat_widgets.dart';
import 'warga_surat_form_page.dart';

/// Layanan surat warga — katalog jenis surat & permohonan.
class WargaLayananSuratPage extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final String? initialSuratType;

  const WargaLayananSuratPage({
    super.key,
    required this.profile,
    required this.rt,
    this.initialSuratType,
  });

  @override
  State<WargaLayananSuratPage> createState() => _WargaLayananSuratPageState();
}

class _WargaLayananSuratPageState extends State<WargaLayananSuratPage> {
  final _rtService = RtService();
  List<SuratRequestModel> _requests = [];
  bool _requestsLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRequests().then((_) => _openInitialTypeIfNeeded());
  }

  Future<void> _loadRequests() async {
    if (mounted) setState(() => _requestsLoading = true);
    try {
      final list = await _rtService.getSuratRequests(widget.rt.id);
      if (mounted) {
        setState(() {
          _requests = list;
          _requestsLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _requestsLoading = false);
    }
  }

  void _openInitialTypeIfNeeded() {
    final key = widget.initialSuratType;
    if (key == null || !mounted) return;
    final item = WargaLayananSuratItem.byTypeKey(key);
    if (item != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _openForm(item));
    }
  }

  int get _pendingCount => _requests.where((r) => r.isPending).length;
  int get _approvedCount => _requests.where((r) => r.isApproved).length;

  List<SuratRequestModel> get _activeRequests =>
      _requests.where((r) => !r.isApproved).toList();

  List<SuratRequestModel> get _approvedRequests =>
      _requests.where((r) => r.isApproved).toList();

  Future<void> _openForm(WargaLayananSuratItem item, {SuratRequestModel? reapply}) async {
    final ok = await Navigator.push<bool>(
      context,
      AppRoutes.fadeSlide(
        WargaSuratFormPage(
          profile: widget.profile,
          rt: widget.rt,
          suratItem: item,
          reapplyPurpose: reapply?.purpose,
        ),
      ),
    );
    if (ok == true) {
      await _loadRequests();
      if (mounted) {
        setState(() => _segment = 0);
        AppToast.success(context, 'Permohonan surat terkirim');
      }
    }
  }

  int _segment = 0;

  @override
  Widget build(BuildContext context) {
    final catalog = WargaLayananSuratItem.catalog;

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
        title: Text('Layanan Surat', style: WargaBerandaText.sectionTitle()),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _loadRequests,
        color: WargaBerandaColors.primaryGreen,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          children: [
            WargaSuratHeroCard(
              jenisCount: catalog.length,
              pendingCount: _pendingCount,
              approvedCount: _approvedCount,
            ),
            const SizedBox(height: 16),
            WargaSuratSegmentToggle(
              selected: _segment,
              pendingBadge: _activeRequests.length,
              approvedBadge: _approvedCount,
              onChanged: (i) => setState(() => _segment = i),
            ),
            const SizedBox(height: 20),
            if (_segment == 0) ...[
              Row(
                children: [
                  Text('Jenis Surat', style: WargaBerandaText.sectionTitle()),
                  const Spacer(),
                  Text(
                    '${catalog.length} tersedia',
                    style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ...catalog.map(
                (item) => WargaSuratTypeCard(
                  item: item,
                  onTap: () => _openForm(item),
                ),
              ),
              if (_requestsLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Center(child: PulseLoader(height: 40, width: 40)),
                )
              else if (_activeRequests.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text('Permohonan Saya', style: WargaBerandaText.sectionTitle()),
                    const SizedBox(width: 8),
                    if (_pendingCount > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '$_pendingCount MENUNGGU',
                          style: WargaBerandaText.greeting().copyWith(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: const Color(0xFF92400E),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                ..._activeRequests.map(
                  (r) => WargaSuratRequestCard(
                    request: r,
                    rtNumber: widget.rt.rtNumber,
                    onReapply: r.isRejected
                        ? () {
                            final item = WargaLayananSuratItem.byTypeKey(r.suratType) ??
                                catalog.firstWhere(
                                  (c) => c.title == r.suratType,
                                  orElse: () => catalog.first,
                                );
                            _openForm(item, reapply: r);
                          }
                        : null,
                  ),
                ),
              ],
            ] else ...[
              if (_requestsLoading)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: PulseLoader(height: 40, width: 40)),
                )
              else if (_approvedRequests.isEmpty)
                WargaCard(
                  child: Text(
                    'Belum ada surat yang disetujui. Setelah Ketua RT menyetujui permohonan, surat akan muncul di sini.',
                    style: WargaBerandaText.greeting(),
                  ),
                )
              else
                ..._approvedRequests.map(
                  (r) => WargaSuratRequestCard(
                    request: r,
                    rtNumber: widget.rt.rtNumber,
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
