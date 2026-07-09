import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../config/app_toast.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/warga_beranda_widgets.dart';

class CreateAnnouncementPage extends StatefulWidget {
  final String rtId;

  const CreateAnnouncementPage({super.key, required this.rtId});

  @override
  State<CreateAnnouncementPage> createState() => _CreateAnnouncementPageState();
}

class _CreateAnnouncementPageState extends State<CreateAnnouncementPage> {
  final _rtService = RtService();
  final _storage = StorageService();
  final _titleCtrl = TextEditingController();
  final _contentCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  DateTime? _eventDate;
  XFile? _imageFile;
  bool _pinned = false;
  bool _saving = false;

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  InputDecoration _fieldDecoration(String label, {String? hint, bool multiline = false}) {
    return InputDecoration(
      labelText: label,
      hintText: hint,
      alignLabelWithHint: multiline,
      filled: true,
      fillColor: WargaBerandaColors.card,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WargaBerandaColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WargaBerandaColors.primaryGreen, width: 1.5),
      ),
      labelStyle: WargaBerandaText.greeting(),
    );
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _eventDate ?? now,
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365 * 2)),
      helpText: 'Tanggal kegiatan',
      cancelText: 'Batal',
      confirmText: 'Pilih',
    );
    if (picked != null) setState(() => _eventDate = picked);
  }

  Future<void> _pickImage(ImageSource source) async {
    final file = source == ImageSource.camera
        ? await _storage.pickImageFromCamera()
        : await _storage.pickImageFromGallery();
    if (file != null && mounted) setState(() => _imageFile = file);
  }

  void _showImageOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: WargaBerandaColors.card,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: WargaBerandaColors.primaryGreen),
              title: const Text('Pilih dari galeri'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt_outlined, color: WargaBerandaColors.primaryGreen),
              title: const Text('Ambil foto'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            if (_imageFile != null)
              ListTile(
                leading: const Icon(Icons.delete_outline, color: WargaBerandaColors.dangerRed),
                title: const Text('Hapus foto'),
                onTap: () {
                  Navigator.pop(context);
                  setState(() => _imageFile = null);
                },
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      String? imageUrl;
      if (_imageFile != null) {
        imageUrl = await _storage.uploadAnnouncementImage(
          rtId: widget.rtId,
          file: _imageFile!,
        );
      }

      await _rtService.createAnnouncement(
        rtId: widget.rtId,
        title: _titleCtrl.text.trim(),
        content: _contentCtrl.text.trim(),
        isPinned: _pinned,
        eventDate: _eventDate,
        imageUrl: imageUrl,
      );

      if (mounted) {
        AppToast.success(context, 'Pengumuman dipublikasikan');
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        AppToast.error(context, 'Gagal: $e\nPastikan migration 006 & bucket storage sudah dijalankan.');
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WargaBerandaColors.bgColor,
      appBar: AppBar(
        backgroundColor: WargaBerandaColors.bgColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        iconTheme: const IconThemeData(color: WargaBerandaColors.primaryGreen),
        title: Text('Buat Pengumuman', style: WargaBerandaText.sectionTitle()),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _titleCtrl,
              decoration: _fieldDecoration('Judul', hint: 'Contoh: Kerja Bakti Lingkungan'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Judul wajib' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _contentCtrl,
              maxLines: 5,
              decoration: _fieldDecoration(
                'Isi pengumuman',
                hint: 'Jelaskan kegiatan, lokasi, dan hal yang perlu disiapkan warga…',
                multiline: true,
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Isi wajib' : null,
            ),
            const SizedBox(height: 16),
            Text('Tanggal kegiatan (opsional)', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 14)),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _pickDate,
              style: OutlinedButton.styleFrom(
                foregroundColor: WargaBerandaColors.primaryGreen,
                side: const BorderSide(color: WargaBerandaColors.primaryGreen),
                minimumSize: const Size(double.infinity, 48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.event_rounded),
              label: Text(
                _eventDate == null
                    ? 'Pilih tanggal pelaksanaan'
                    : AnnouncementModel.formatDate(_eventDate!),
                style: GoogleFonts.poppins(fontWeight: FontWeight.w500),
              ),
            ),
            if (_eventDate != null)
              TextButton(
                onPressed: () => setState(() => _eventDate = null),
                child: Text('Hapus tanggal kegiatan', style: WargaBerandaText.greeting()),
              ),
            const SizedBox(height: 16),
            Text('Foto lokasi / bukti (opsional)', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 14)),
            const SizedBox(height: 4),
            Text(
              'Misal: foto tempat kerja bakti agar warga tahu lokasinya.',
              style: WargaBerandaText.greeting().copyWith(fontSize: 12),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _showImageOptions,
              child: Container(
                width: double.infinity,
                height: _imageFile != null ? 180 : 120,
                decoration: BoxDecoration(
                  color: WargaBerandaColors.lightGreen,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: WargaBerandaColors.primaryGreen.withValues(alpha: 0.3)),
                ),
                child: _imageFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.file(File(_imageFile!.path), fit: BoxFit.cover, width: double.infinity),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.add_photo_alternate_outlined, color: WargaBerandaColors.primaryGreen, size: 40),
                          const SizedBox(height: 8),
                          Text('Ketuk untuk tambah foto', style: WargaBerandaText.greeting().copyWith(
                            color: WargaBerandaColors.primaryGreen,
                            fontWeight: FontWeight.w600,
                          )),
                        ],
                      ),
              ),
            ),
            const SizedBox(height: 16),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('Tandai penting (pin)', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
              subtitle: Text('Muncul di badge notifikasi Home', style: WargaBerandaText.greeting()),
              value: _pinned,
              activeThumbColor: WargaBerandaColors.primaryGreen,
              onChanged: (v) => setState(() => _pinned = v),
            ),
            const SizedBox(height: 24),
            WargaPrimaryButton(
              label: _saving ? 'Menyimpan...' : 'Publikasikan',
              onPressed: _saving ? null : _submit,
            ),
          ],
        ),
      ),
    );
  }
}
