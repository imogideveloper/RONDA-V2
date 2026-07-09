import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class StorageService {
  static const _announcementBucket = 'announcement-images';
  static const _profileAvatarBucket = 'profile-avatars';
  static const _iuranProofBucket = 'iuran-payment-proofs';
  final SupabaseClient _supabase = Supabase.instance.client;
  final _picker = ImagePicker();

  Future<XFile?> pickImageFromGallery() =>
      _picker.pickImage(source: ImageSource.gallery, maxWidth: 1920, imageQuality: 85);

  Future<XFile?> pickImageFromCamera() =>
      _picker.pickImage(source: ImageSource.camera, maxWidth: 1920, imageQuality: 85);

  Future<String> uploadAnnouncementImage({
    required String rtId,
    required XFile file,
  }) async {
    final bytes = await file.readAsBytes();
    final ext = _extension(file.path);
    final path = '$rtId/${DateTime.now().millisecondsSinceEpoch}.$ext';
    final contentType = ext == 'png' ? 'image/png' : 'image/jpeg';

    await _supabase.storage.from(_announcementBucket).uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(contentType: contentType, upsert: false),
        );

    return _supabase.storage.from(_announcementBucket).getPublicUrl(path);
  }

  /// Upload foto profil ke `{userId}/avatar.{ext}` (upsert).
  Future<String> uploadProfileAvatar({
    required String userId,
    required XFile file,
  }) async {
    final bytes = await file.readAsBytes();
    final ext = _extension(file.path);
    final path = '$userId/avatar.$ext';
    final contentType = ext == 'png' ? 'image/png' : 'image/jpeg';

    await _supabase.storage.from(_profileAvatarBucket).uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(contentType: contentType, upsert: true),
        );

    return _supabase.storage.from(_profileAvatarBucket).getPublicUrl(path);
  }

  Future<String> uploadIuranPaymentProof({
    required String rtId,
    required String userId,
    required XFile file,
  }) async {
    final bytes = await file.readAsBytes();
    final ext = _extension(file.path);
    final path = '$userId/$rtId/${DateTime.now().millisecondsSinceEpoch}.$ext';
    final contentType = ext == 'png' ? 'image/png' : 'image/jpeg';

    await _supabase.storage.from(_iuranProofBucket).uploadBinary(
          path,
          bytes,
          fileOptions: FileOptions(contentType: contentType, upsert: false),
        );

    return _supabase.storage.from(_iuranProofBucket).getPublicUrl(path);
  }

  String _extension(String path) {
    final lower = path.toLowerCase();
    if (lower.endsWith('.png')) return 'png';
    if (lower.endsWith('.webp')) return 'webp';
    return 'jpg';
  }
}
