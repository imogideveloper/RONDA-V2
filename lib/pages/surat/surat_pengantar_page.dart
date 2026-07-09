import 'package:flutter/material.dart';

import '../../config/app_theme.dart';
import '../../config/app_toast.dart';

import '../../config/smooth_scroll.dart';

import '../../models/profile_model.dart';

import '../../models/rt_unit_model.dart';

import '../../services/rt_service.dart';

import '../../widgets/rt_app_bar.dart';
import '../../widgets/rt_ui_widgets.dart';



class SuratPengantarPage extends StatefulWidget {

  final ProfileModel profile;

  final RtUnitModel rt;



  final String? initialSuratType;

  const SuratPengantarPage({
    super.key,
    required this.profile,
    required this.rt,
    this.initialSuratType,
  });



  @override

  State<SuratPengantarPage> createState() => _SuratPengantarPageState();

}



class _SuratPengantarPageState extends State<SuratPengantarPage> {

  final _rtService = RtService();

  String? _selectedType;

  final _keperluanCtrl = TextEditingController();

  int _tab = 0;

  List<SuratRequestModel> _requests = [];

  bool _loadingStatus = true;

  bool _submitting = false;



  static const _types = [

    'Surat Pengantar KTP',

    'Surat Domisili',

    'Surat Kerja Bakti',

    'Surat Keterangan Usaha',

    'Surat Pengantar Nikah',

  ];



  bool get _isKetua => widget.profile.isKetua;



  @override

  void initState() {

    super.initState();

    if (widget.initialSuratType != null &&
        _types.contains(widget.initialSuratType)) {
      _selectedType = widget.initialSuratType;
    }

    _loadStatus();

  }



  @override

  void dispose() {

    _keperluanCtrl.dispose();

    super.dispose();

  }



  Future<void> _loadStatus() async {

    setState(() => _loadingStatus = true);

    final list = await _rtService.getSuratRequests(

      widget.rt.id,

      allRt: _isKetua,

    );

    if (mounted) setState(() { _requests = list; _loadingStatus = false; });

  }



  Future<void> _submit() async {

    if (_selectedType == null || _keperluanCtrl.text.trim().isEmpty) return;

    setState(() => _submitting = true);

    try {

      await _rtService.submitSuratRequest(

        rtId: widget.rt.id,

        suratType: _selectedType!,

        purpose: _keperluanCtrl.text.trim(),

      );

      _keperluanCtrl.clear();

      setState(() => _selectedType = null);

      await _loadStatus();

      if (mounted) {

        setState(() => _tab = 1);

        AppToast.success(context, 'Permohonan surat terkirim');

      }

    } catch (e) {

      if (mounted) {

        AppToast.error(context, '$e');

      }

    } finally {

      if (mounted) setState(() => _submitting = false);

    }

  }



  Future<void> _setStatus(SuratRequestModel req, String status) async {

    try {

      await _rtService.updateSuratStatus(req.id, status);

      await _loadStatus();

      if (mounted) {

        AppToast.success(context, 'Status: $status');

      }

    } catch (e) {

      if (mounted) {

        AppToast.error(context, '$e');

      }

    }

  }



  @override

  Widget build(BuildContext context) {

    return Scaffold(

      backgroundColor: AppTheme.background,

      appBar: const RtAppBar(title: 'Surat Pengantar'),

      body: Column(

        children: [

          Padding(

            padding: const EdgeInsets.all(16),

            child: SegmentedButton<int>(

              segments: const [

                ButtonSegment(value: 0, label: Text('Ajukan')),

                ButtonSegment(value: 1, label: Text('Status')),

              ],

              selected: {_tab},

              onSelectionChanged: (s) => setState(() => _tab = s.first),

            ),

          ),

          Expanded(

            child: _tab == 0 ? _buildForm() : _buildStatusList(),

          ),

        ],

      ),

    );

  }



  Widget _buildForm() {

    return ListView(

      physics: AppScroll.physics,

      padding: const EdgeInsets.all(16),

      children: [

        const Text('Jenis Surat', style: TextStyle(fontWeight: FontWeight.w600)),

        const SizedBox(height: 8),

        ..._types.map((t) => Padding(

              padding: const EdgeInsets.only(bottom: 8),

              child: RadioListTile<String>(

                value: t,

                groupValue: _selectedType,

                onChanged: (v) => setState(() => _selectedType = v),

                title: Text(t, style: const TextStyle(fontSize: 14)),

                activeColor: AppTheme.emerald,

                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),

                tileColor: AppTheme.surface,

              ),

            )),

        const SizedBox(height: 16),

        const Text('Keperluan', style: TextStyle(fontWeight: FontWeight.w600)),

        const SizedBox(height: 8),

        TextField(

          controller: _keperluanCtrl,

          maxLines: 3,

          decoration: const InputDecoration(hintText: 'Jelaskan keperluan surat...'),

        ),

        const SizedBox(height: 24),

        ElevatedButton(

          onPressed: _selectedType == null || _submitting ? null : _submit,

          child: _submitting

              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))

              : const Text('Kirim Permohonan'),

        ),

      ],

    );

  }



  Widget _buildStatusList() {

    if (_loadingStatus) {

      return const Center(child: CircularProgressIndicator(color: AppTheme.emerald));

    }



    return RefreshIndicator(

      onRefresh: _loadStatus,

      color: AppTheme.emerald,

      child: ListView(

        physics: AppScroll.physics,

        padding: const EdgeInsets.all(16),

        children: [

          if (_requests.isEmpty)

            const Center(

              child: Padding(

                padding: EdgeInsets.all(32),

                child: Text('Belum ada permohonan surat', style: TextStyle(color: AppTheme.textSecondary)),

              ),

            ),

          ..._requests.map((r) => Padding(

                padding: const EdgeInsets.only(bottom: 12),

                child: RtCard(

                  child: Column(

                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [

                      Row(

                        children: [

                          Expanded(

                            child: Column(

                              crossAxisAlignment: CrossAxisAlignment.start,

                              children: [

                                Text(r.suratType, style: const TextStyle(fontWeight: FontWeight.w700)),

                                if (r.userName != null && _isKetua)

                                  Text(r.userName!, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),

                              ],

                            ),

                          ),

                          StatusChip(

                            label: r.statusLabel,

                            color: r.isApproved

                                ? AppTheme.success

                                : r.status == 'rejected'

                                    ? AppTheme.danger

                                    : AppTheme.warning,

                          ),

                        ],

                      ),

                      const SizedBox(height: 6),

                      Text(r.purpose, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),

                      if (_isKetua && r.isPending) ...[

                        const SizedBox(height: 12),

                        Row(

                          children: [

                            Expanded(

                              child: OutlinedButton(

                                onPressed: () => _setStatus(r, 'rejected'),

                                style: OutlinedButton.styleFrom(foregroundColor: AppTheme.danger),

                                child: const Text('Tolak'),

                              ),

                            ),

                            const SizedBox(width: 8),

                            Expanded(

                              child: ElevatedButton(

                                onPressed: () => _setStatus(r, 'approved'),

                                child: const Text('Setujui'),

                              ),

                            ),

                          ],

                        ),

                      ],

                      if (r.isApproved) ...[

                        const SizedBox(height: 12),

                        SizedBox(

                          width: double.infinity,

                          child: OutlinedButton.icon(

                            onPressed: () {

                              AppToast.show(context, 'Unduh PDF — segera hadir');

                            },

                            icon: const Icon(Icons.download_rounded, size: 18),

                            label: const Text('Unduh PDF (demo)'),

                            style: OutlinedButton.styleFrom(foregroundColor: AppTheme.emerald),

                          ),

                        ),

                      ],

                    ],

                  ),

                ),

              )),

        ],

      ),

    );

  }

}


