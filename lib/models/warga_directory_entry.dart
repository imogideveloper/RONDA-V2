import 'profile_model.dart';

/// Anggota terdaftar atau warga yang di-import (belum punya akun).
class WargaDirectoryEntry {
  final String id;
  final String fullName;
  final String phone;
  final String? email;
  final String? blokRumah;
  final String role;
  final bool isPendingImport;
  final bool isKetua;

  WargaDirectoryEntry({
    required this.id,
    required this.fullName,
    required this.phone,
    this.email,
    this.blokRumah,
    required this.role,
    this.isPendingImport = false,
    this.isKetua = false,
  });

  factory WargaDirectoryEntry.fromProfile(ProfileModel p) {
    return WargaDirectoryEntry(
      id: p.id,
      fullName: p.fullName,
      phone: p.phone,
      role: p.role,
      isPendingImport: false,
      isKetua: p.isKetua,
    );
  }

  factory WargaDirectoryEntry.fromRegistry(Map<String, dynamic> map) {
    return WargaDirectoryEntry(
      id: map['id'] as String,
      fullName: map['full_name'] as String,
      phone: map['phone'] as String,
      email: map['email'] as String?,
      blokRumah: map['blok_rumah'] as String?,
      role: 'warga',
      isPendingImport: true,
    );
  }

  String get roleLabel {
    switch (role) {
      case 'ketua_rt':
        return 'Ketua RT';
      case 'bendahara':
        return 'Bendahara';
      default:
        return isPendingImport ? 'Menunggu daftar' : 'Warga';
    }
  }

  bool get isWarga => role == 'warga' && !isPendingImport;
  bool get isBendahara => role == 'bendahara';
}
