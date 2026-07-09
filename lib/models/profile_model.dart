import '../config/app_theme.dart';

class ProfileModel {
  final String id;
  final String fullName;
  final String phone;
  final String role;
  final String? rtId;
  final String? avatarUrl;
  final bool isActive;
  final DateTime createdAt;

  ProfileModel({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.role,
    this.rtId,
    this.avatarUrl,
    required this.isActive,
    required this.createdAt,
  });

  factory ProfileModel.fromMap(Map<String, dynamic> map) {
    final createdRaw = map['created_at'];
    return ProfileModel(
      id: map['id'] as String,
      fullName: map['full_name'] as String? ?? 'Pengguna',
      phone: map['phone'] as String? ?? '',
      role: map['role'] as String? ?? 'warga',
      rtId: (map['rt_id'] ?? map['area_id']) as String?,
      avatarUrl: map['avatar_url'] as String?,
      isActive: map['is_active'] as bool? ?? true,
      createdAt: createdRaw != null
          ? DateTime.parse(createdRaw as String)
          : DateTime.now(),
    );
  }

  UserRole get userRole => UserRoleX.fromString(role);

  bool get hasRt => rtId != null;
  bool get isKetua => userRole == UserRole.ketuaRt;
  bool get isBendahara => userRole == UserRole.bendahara;
  bool get isWarga => userRole == UserRole.warga;
  String get roleLabel => userRole.label;
}
