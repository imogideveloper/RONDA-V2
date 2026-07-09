import 'package:shared_preferences/shared_preferences.dart';

import '../models/rt_unit_model.dart';

/// Status baca pengumuman per RT (lokal di perangkat).
class AnnouncementReadService {
  AnnouncementReadService._();
  static final AnnouncementReadService instance = AnnouncementReadService._();

  static const _prefsKey = 'announcement_reads_v1';

  Future<Set<String>> _loadAll() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_prefsKey)?.toSet() ?? {};
  }

  Future<void> _saveAll(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefsKey, ids.toList());
  }

  String _key(String rtId, String announcementId) => '$rtId:$announcementId';

  Future<bool> isRead(String rtId, String announcementId) async {
    final all = await _loadAll();
    return all.contains(_key(rtId, announcementId));
  }

  Future<void> markRead(String rtId, String announcementId) async {
    final all = await _loadAll();
    all.add(_key(rtId, announcementId));
    await _saveAll(all);
  }

  /// Pengumuman yang relevan untuk badge: pinned atau 14 hari terakhir, belum dibaca.
  Future<int> unreadCount(String rtId, List<AnnouncementModel> items) async {
    if (items.isEmpty) return 0;
    final all = await _loadAll();
    final since = DateTime.now().subtract(const Duration(days: 14));
    var count = 0;
    for (final a in items) {
      if (all.contains(_key(rtId, a.id))) continue;
      if (a.isPinned || a.createdAt.isAfter(since)) count++;
    }
    return count;
  }

  /// ID pengumuman yang sudah dibaca di RT ini.
  Future<Set<String>> readIdsForRt(String rtId) async {
    final all = await _loadAll();
    final prefix = '$rtId:';
    return all
        .where((k) => k.startsWith(prefix))
        .map((k) => k.substring(prefix.length))
        .toSet();
  }

  Future<List<AnnouncementModel>> filterUnread(String rtId, List<AnnouncementModel> items) async {
    final all = await _loadAll();
    final since = DateTime.now().subtract(const Duration(days: 14));
    return items.where((a) {
      if (all.contains(_key(rtId, a.id))) return false;
      return a.isPinned || a.createdAt.isAfter(since);
    }).toList();
  }
}
