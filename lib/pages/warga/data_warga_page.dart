import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../config/app_theme.dart';
import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../models/warga_directory_entry.dart';
import '../../services/rt_service.dart';
import '../../services/warga_directory_service.dart';
import '../../widgets/rt_app_bar.dart';
import '../../widgets/rt_ui_widgets.dart';

class DataWargaPage extends StatefulWidget {
  final RtUnitModel rt;
  final ProfileModel profile;

  const DataWargaPage({super.key, required this.rt, required this.profile});

  @override
  State<DataWargaPage> createState() => _DataWargaPageState();
}

class _DataWargaPageState extends State<DataWargaPage> {
  final _rtService = RtService();
  final _directory = WargaDirectoryService();
  final _searchCtrl = TextEditingController();
  List<WargaDirectoryEntry> _all = [];
  List<WargaDirectoryEntry> _filtered = [];
  bool _loading = true;

  bool get _isKetua => widget.profile.isKetua;

  @override
  void initState() {
    super.initState();
    _load();
    _searchCtrl.addListener(_filter);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final list = await _directory.getDirectory(widget.rt.id);
      if (mounted) {
        setState(() {
          _all = list;
          _filtered = list;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        AppToast.error(context, 'Gagal memuat: $e');
      }
    }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? _all
          : _all
              .where((m) =>
                  m.fullName.toLowerCase().contains(q) ||
                  m.phone.contains(q) ||
                  (m.email?.toLowerCase().contains(q) ?? false))
              .toList();
    });
  }

  Future<void> _downloadTemplate() async {
    try {
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/template_data_warga_rt.csv');
      await file.writeAsString(WargaDirectoryService.templateCsv);
      await Share.shareXFiles(
        [XFile(file.path)],
        subject: 'Template Data Warga RT',
        text: 'Isi data warga sesuai kolom, lalu import di aplikasi RT OS.',
      );
      if (mounted) AppToast.success(context, 'Template siap dibagikan');
    } catch (e) {
      if (mounted) AppToast.error(context, 'Gagal membagikan template: $e');
    }
  }

  Future<void> _importCsv() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv', 'txt'],
      withData: true,
    );
    if (result == null || result.files.isEmpty) return;

    final file = result.files.first;
    final raw = file.bytes != null
        ? String.fromCharCodes(file.bytes!)
        : await File(file.path!).readAsString();

    final rows = WargaDirectoryService.parseCsv(raw);
    if (rows.isEmpty) {
      if (mounted) AppToast.error(context, 'File kosong atau format tidak dikenali');
      return;
    }

    try {
      final stats = await _directory.importFromRows(rows);
      await _load();
      if (mounted) {
        AppToast.success(
          context,
          'Import selesai: ${stats['inserted']} baru, ${stats['updated']} diperbarui, ${stats['skipped']} dilewati',
          duration: const Duration(seconds: 4),
        );
      }
    } catch (e) {
      if (mounted) AppToast.error(context, '$e');
    }
  }

  Future<void> _editEntry(WargaDirectoryEntry entry) async {
    if (!_isKetua || entry.id == widget.profile.id) return;

    final nameCtrl = TextEditingController(text: entry.fullName);
    final phoneCtrl = TextEditingController(text: entry.phone.replaceFirst('+62', ''));
    final emailCtrl = TextEditingController(text: entry.email ?? '');
    final blokCtrl = TextEditingController(text: entry.blokRumah ?? '');
    var selectedRole = entry.role;

    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(entry.fullName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                Text(
                  entry.isPendingImport ? 'Belum punya akun — akan auto gabung saat login' : entry.roleLabel,
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Nama lengkap'),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Nomor HP',
                    prefixText: '+62 ',
                  ),
                ),
                if (entry.isPendingImport) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: emailCtrl,
                    decoration: const InputDecoration(labelText: 'Email (opsional)'),
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: blokCtrl,
                    decoration: const InputDecoration(labelText: 'Blok / rumah (opsional)'),
                  ),
                ],
                if (!entry.isPendingImport && !entry.isKetua) ...[
                  const SizedBox(height: 16),
                  const Text('Peran di RT', style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'warga', label: Text('Warga')),
                      ButtonSegment(value: 'bendahara', label: Text('Bendahara')),
                    ],
                    selected: {selectedRole == 'bendahara' ? 'bendahara' : 'warga'},
                    onSelectionChanged: (s) => setModal(() => selectedRole = s.first),
                  ),
                ],
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () async {
                    try {
                      if (entry.isPendingImport) {
                        await _directory.updateRegistryEntry(
                          id: entry.id,
                          fullName: nameCtrl.text.trim(),
                          phone: phoneCtrl.text.trim(),
                          email: emailCtrl.text.trim(),
                          blokRumah: blokCtrl.text.trim(),
                        );
                      } else {
                        await _directory.updateMemberName(entry.id, nameCtrl.text.trim());
                        if (selectedRole == 'bendahara' && entry.isWarga) {
                          await _rtService.appointBendahara(entry.id);
                        } else if (selectedRole == 'warga' && entry.isBendahara) {
                          await _rtService.revokeBendahara(entry.id);
                        }
                      }
                      if (ctx.mounted) Navigator.pop(ctx, true);
                    } catch (e) {
                      AppToast.error(ctx, '$e');
                    }
                  },
                  child: const Text('Simpan'),
                ),
                if (entry.isPendingImport) ...[
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () async {
                      final ok = await showDialog<bool>(
                        context: ctx,
                        builder: (_) => AlertDialog(
                          title: const Text('Hapus dari daftar import?'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                            ElevatedButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.danger),
                              child: const Text('Hapus'),
                            ),
                          ],
                        ),
                      );
                      if (ok == true) {
                        await _directory.deleteRegistryEntry(entry.id);
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      }
                    },
                    style: OutlinedButton.styleFrom(foregroundColor: AppTheme.danger),
                    child: const Text('Hapus dari daftar'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );

    nameCtrl.dispose();
    phoneCtrl.dispose();
    emailCtrl.dispose();
    blokCtrl.dispose();

    if (saved == true) {
      await _load();
      if (mounted) AppToast.success(context, 'Data warga diperbarui');
    }
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _all.where((e) => e.isPendingImport).length;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: RtAppBar(
        title: 'Data Warga',
        actions: [
          if (_isKetua)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded, color: AppTheme.emerald),
              onSelected: (v) {
                if (v == 'template') _downloadTemplate();
                if (v == 'import') _importCsv();
              },
              itemBuilder: (_) => const [
                PopupMenuItem(
                  value: 'template',
                  child: ListTile(
                    leading: Icon(Icons.download_rounded, color: AppTheme.emerald),
                    title: Text('Unduh template CSV'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                PopupMenuItem(
                  value: 'import',
                  child: ListTile(
                    leading: Icon(Icons.upload_file_rounded, color: AppTheme.emerald),
                    title: Text('Import data warga'),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          if (_isKetua && pendingCount > 0)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: RtCard(
                color: AppTheme.emeraldMuted,
                child: Text(
                  '$pendingCount warga di-import menunggu daftar app. Saat login dengan nomor yang sama, mereka otomatis masuk RT tanpa kode undangan.',
                  style: const TextStyle(fontSize: 12, color: AppTheme.emeraldDark, height: 1.45),
                ),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'Cari nama atau nomor HP...',
                prefixIcon: Icon(Icons.search_rounded, color: AppTheme.emerald),
              ),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.emerald))
                : _filtered.isEmpty
                    ? const Center(
                        child: Text('Tidak ada warga ditemukan', style: TextStyle(color: AppTheme.textSecondary)),
                      )
                    : RefreshIndicator(
                        onRefresh: _load,
                        color: AppTheme.emerald,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: _filtered.length,
                          itemBuilder: (_, i) {
                            final m = _filtered[i];
                            final chipColor = m.isPendingImport
                                ? AppTheme.warning
                                : m.isKetua
                                    ? AppTheme.emeraldDark
                                    : m.isBendahara
                                        ? const Color(0xFF3B82F6)
                                        : AppTheme.emerald;
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 10),
                              child: RtCard(
                                padding: const EdgeInsets.all(14),
                                child: InkWell(
                                  onTap: _isKetua ? () => _editEntry(m) : null,
                                  borderRadius: BorderRadius.circular(14),
                                  child: Row(
                                    children: [
                                      CircleAvatar(
                                        backgroundColor: AppTheme.emeraldSoft,
                                        child: Text(
                                          m.fullName.isNotEmpty ? m.fullName[0].toUpperCase() : '?',
                                          style: const TextStyle(
                                            color: AppTheme.emerald,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(m.fullName, style: const TextStyle(fontWeight: FontWeight.w600)),
                                            Text(
                                              m.phone,
                                              style: const TextStyle(
                                                fontSize: 13,
                                                color: AppTheme.textSecondary,
                                              ),
                                            ),
                                            if (m.blokRumah != null && m.blokRumah!.isNotEmpty)
                                              Text(
                                                m.blokRumah!,
                                                style: const TextStyle(fontSize: 12, color: AppTheme.textHint),
                                              ),
                                          ],
                                        ),
                                      ),
                                      StatusChip(label: m.roleLabel, color: chipColor),
                                      if (_isKetua && m.id != widget.profile.id)
                                        const Padding(
                                          padding: EdgeInsets.only(left: 4),
                                          child: Icon(Icons.edit_outlined, size: 18, color: AppTheme.emerald),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
