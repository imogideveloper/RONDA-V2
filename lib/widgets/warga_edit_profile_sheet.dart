import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../config/app_toast.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import 'keyboard_aware_sheet.dart';
import 'warga_beranda_widgets.dart';

/// Bottom sheet edit profil warga — nama, HP, foto profil.
Future<bool?> showWargaEditProfileSheet(
  BuildContext context, {
  required String userId,
  required String initialName,
  required String initialPhone,
  String? initialAvatarUrl,
}) {
  return showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: WargaBerandaColors.card,
    barrierColor: Colors.black.withValues(alpha: 0.45),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => _WargaEditProfileSheetBody(
      userId: userId,
      initialName: initialName,
      initialPhone: initialPhone,
      initialAvatarUrl: initialAvatarUrl,
    ),
  );
}

class _WargaEditProfileSheetBody extends StatefulWidget {
  final String userId;
  final String initialName;
  final String initialPhone;
  final String? initialAvatarUrl;

  const _WargaEditProfileSheetBody({
    required this.userId,
    required this.initialName,
    required this.initialPhone,
    this.initialAvatarUrl,
  });

  @override
  State<_WargaEditProfileSheetBody> createState() => _WargaEditProfileSheetBodyState();
}

class _WargaEditProfileSheetBodyState extends State<_WargaEditProfileSheetBody> {
  final _auth = AuthService();
  final _storage = StorageService();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _phoneCtrl;
  final _formKey = GlobalKey<FormState>();

  String? _avatarUrl;
  String? _localPreviewPath;
  bool _saving = false;

  InputDecoration _fieldDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: WargaBerandaText.greeting(),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: WargaBerandaColors.primaryGreen, width: 1.5),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _nameCtrl = TextEditingController(text: widget.initialName);
    _phoneCtrl = TextEditingController(text: widget.initialPhone);
    _avatarUrl = widget.initialAvatarUrl;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final file = source == ImageSource.gallery
        ? await _storage.pickImageFromGallery()
        : await _storage.pickImageFromCamera();
    if (file == null || !mounted) return;
    setState(() {
      _localPreviewPath = file.path;
      _avatarUrl = null;
    });
  }

  void _showPhotoOptions() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: WargaBerandaColors.card,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library_outlined, color: WargaBerandaColors.primaryGreen),
              title: Text('Galeri', style: GoogleFonts.poppins(fontWeight: FontWeight.w500)),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_camera_outlined, color: WargaBerandaColors.primaryGreen),
              title: Text('Kamera', style: GoogleFonts.poppins(fontWeight: FontWeight.w500)),
              onTap: () {
                Navigator.pop(context);
                _pickPhoto(ImageSource.camera);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      String? avatarUrl = _avatarUrl;
      if (_localPreviewPath != null) {
        avatarUrl = await _storage.uploadProfileAvatar(
          userId: widget.userId,
          file: XFile(_localPreviewPath!),
        );
      }

      await _auth.updateMyProfile(
        fullName: _nameCtrl.text.trim(),
        phone: _phoneCtrl.text.trim(),
        avatarUrl: avatarUrl,
      );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) AppToast.error(context, 'Gagal menyimpan: $e');
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget photoChild;
    if (_localPreviewPath != null) {
      photoChild = CircleAvatar(
        radius: 48,
        backgroundImage: FileImage(File(_localPreviewPath!)),
      );
    } else {
      photoChild = WargaProfileAvatar(
        imageUrl: _avatarUrl,
        fullName: _nameCtrl.text.isNotEmpty ? _nameCtrl.text : widget.initialName,
        radius: 48,
        showCameraBadge: true,
        onTap: _showPhotoOptions,
      );
    }

    return KeyboardAwareSheetBody(
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: WargaBerandaColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text('Edit Profil', style: WargaBerandaText.sectionTitle().copyWith(fontSize: 18)),
            const SizedBox(height: 8),
            Text(
              'Ubah data dan foto profil Anda',
              style: WargaBerandaText.greeting(),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            Center(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  GestureDetector(onTap: _showPhotoOptions, child: photoChild),
                  if (_localPreviewPath != null)
                    Positioned(
                      right: 0,
                      bottom: 0,
                      child: GestureDetector(
                        onTap: _showPhotoOptions,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: WargaBerandaColors.primaryGreen,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.edit, color: Colors.white, size: 16),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: _showPhotoOptions,
                child: Text(
                  'Unggah foto profil',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.w600,
                    color: WargaBerandaColors.primaryGreen,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            SheetTextField(
              controller: _nameCtrl,
              labelText: 'Nama lengkap',
              textInputAction: TextInputAction.next,
              style: GoogleFonts.poppins(),
              decoration: _fieldDecoration('Nama lengkap'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama wajib diisi' : null,
            ),
            const SizedBox(height: 12),
            SheetTextField(
              controller: _phoneCtrl,
              labelText: 'Nomor HP',
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              scrollOnFocus: true,
              style: GoogleFonts.poppins(),
              decoration: _fieldDecoration('Nomor HP'),
              onFieldSubmitted: (_) => _save(),
            ),
            const SizedBox(height: 24),
            WargaPrimaryButton(
              label: _saving ? 'Menyimpan...' : 'Simpan Perubahan',
              onPressed: _saving ? null : _save,
            ),
          ],
        ),
      ),
    );
  }
}
