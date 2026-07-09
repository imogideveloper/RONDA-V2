import '../models/profile_model.dart';
import '../models/rt_unit_model.dart';
import '../models/warga_home_data.dart';
import 'rt_service.dart';

/// Loader Beranda dengan cache in-memory & fetch paralel.
class WargaHomeLoader {
  WargaHomeLoader._();
  static final WargaHomeLoader instance = WargaHomeLoader._();

  final _rt = RtService();
  static const _defaultIuranAmount = 50000.0;

  WargaHomeData? _cache;
  String? _cacheKey;
  DateTime? _cacheAt;
  static const _cacheTtl = Duration(seconds: 45);

  String _key(String rtId, String userId) => '$rtId|$userId';

  bool _isFresh(String key) {
    if (_cache == null || _cacheKey != key || _cacheAt == null) return false;
    return DateTime.now().difference(_cacheAt!) < _cacheTtl;
  }

  /// Muat data beranda; [force] abaikan cache.
  Future<WargaHomeData> load({
    required String rtId,
    required String userId,
    bool force = false,
  }) async {
    final key = _key(rtId, userId);
    if (!force && _isFresh(key)) return _cache!;

    // Iuran bulan ini di background — jangan blok UI.
    _rt.ensureMyIuran(amount: _defaultIuranAmount).catchError((_) => null);

    final results = await Future.wait<dynamic>([
      _rt.getIuranRecords(rtId, forUserId: userId),
      _rt.getKasSummary(rtId),
      _rt.getAnnouncements(rtId),
      _rt.getKetuaProfile(rtId),
      _rt.getSuratRequests(rtId),
    ]);

    final bills = results[0] as List<IuranRecordModel>;
    final kas = results[1] as KasSummaryModel;
    final announcements = results[2] as List<AnnouncementModel>;
    final ketua = results[3] as ProfileModel?;
    final surat = results[4] as List<SuratRequestModel>;
    final pendingSurat = surat.where((s) => s.isPending).length;

    final data = WargaHomeData(
      announcements: announcements,
      bills: bills,
      kas: kas,
      ketua: ketua,
      pendingSuratCount: pendingSurat,
      mySuratRequests: surat,
    );

    _cache = data;
    _cacheKey = key;
    _cacheAt = DateTime.now();
    return data;
  }

  void invalidate() {
    _cache = null;
    _cacheKey = null;
    _cacheAt = null;
  }
}
