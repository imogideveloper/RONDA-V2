import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/profile_model.dart';
import '../models/warga_directory_entry.dart';
import 'auth_service.dart';

class WargaDirectoryService {
  final SupabaseClient _supabase = Supabase.instance.client;

  static const templateCsv = '''nama_lengkap,nomor_hp,email,blok_rumah
Budi Santoso,081234567890,budi@email.com,Blok A No 1
Siti Rahayu,081987654321,siti@email.com,Blok B No 2''';

  Future<List<WargaDirectoryEntry>> getDirectory(String rtId) async {
    final membersData = await _supabase
        .from('profiles')
        .select()
        .eq('rt_id', rtId)
        .order('role')
        .order('full_name');

    final pendingData = await _supabase
        .from('rt_warga_registry')
        .select()
        .eq('rt_id', rtId)
        .filter('claimed_at', 'is', null)
        .order('full_name');

    final members = (membersData as List)
        .map((e) => WargaDirectoryEntry.fromProfile(ProfileModel.fromMap(Map<String, dynamic>.from(e))))
        .toList();

    final memberPhones = members.map((m) => AuthService.normalizePhone(m.phone)).toSet();

    final pending = (pendingData as List)
        .map((e) => WargaDirectoryEntry.fromRegistry(Map<String, dynamic>.from(e)))
        .where((p) => !memberPhones.contains(AuthService.normalizePhone(p.phone)))
        .toList();

    return [...members, ...pending];
  }

  Future<Map<String, int>> importFromRows(List<Map<String, String>> rows) async {
    final payload = rows
        .map((r) => {
              'full_name': r['full_name'] ?? '',
              'phone': r['phone'] ?? '',
              'email': r['email'] ?? '',
              'blok_rumah': r['blok_rumah'] ?? '',
            })
        .toList();

    final result = await _supabase.rpc('import_warga_batch', params: {'p_rows': payload});
    final map = Map<String, dynamic>.from(result as Map);
    return {
      'inserted': (map['inserted'] as num?)?.toInt() ?? 0,
      'updated': (map['updated'] as num?)?.toInt() ?? 0,
      'skipped': (map['skipped'] as num?)?.toInt() ?? 0,
    };
  }

  Future<void> updateRegistryEntry({
    required String id,
    required String fullName,
    required String phone,
    String? email,
    String? blokRumah,
  }) async {
    await _supabase.rpc('ketua_update_registry_entry', params: {
      'p_id': id,
      'p_full_name': fullName,
      'p_phone': phone,
      'p_email': email,
      'p_blok_rumah': blokRumah,
    });
  }

  Future<void> updateMemberName(String memberId, String fullName) async {
    await _supabase.rpc('ketua_update_member_name', params: {
      'p_member_id': memberId,
      'p_full_name': fullName,
    });
  }

  Future<void> deleteRegistryEntry(String id) async {
    await _supabase.rpc('ketua_delete_registry_entry', params: {'p_id': id});
  }

  Future<bool> tryAutoJoinRt() async {
    try {
      final result = await _supabase.rpc('try_auto_join_rt');
      final map = Map<String, dynamic>.from(result as Map);
      return map['joined'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Parse CSV sederhana (baris pertama = header).
  static List<Map<String, String>> parseCsv(String raw) {
    final lines = raw.split(RegExp(r'\r?\n')).where((l) => l.trim().isNotEmpty).toList();
    if (lines.isEmpty) return [];

    final header = _splitCsvLine(lines.first).map((h) => h.trim().toLowerCase()).toList();
    final rows = <Map<String, String>>[];

    for (var i = 1; i < lines.length; i++) {
      final cols = _splitCsvLine(lines[i]);
      if (cols.every((c) => c.trim().isEmpty)) continue;

      String col(List<String> names) {
        for (final n in names) {
          final idx = header.indexOf(n);
          if (idx >= 0 && idx < cols.length) return cols[idx].trim();
        }
        return '';
      }

      final name = col(['nama_lengkap', 'nama', 'full_name', 'name']);
      final phone = col(['nomor_hp', 'phone', 'hp', 'telepon', 'no_hp']);
      if (name.isEmpty && phone.isEmpty) continue;

      rows.add({
        'full_name': name,
        'phone': phone,
        'email': col(['email', 'e-mail']),
        'blok_rumah': col(['blok_rumah', 'blok', 'alamat', 'rumah']),
      });
    }
    return rows;
  }

  static List<String> _splitCsvLine(String line) {
    final result = <String>[];
    final buf = StringBuffer();
    var inQuote = false;
    for (var i = 0; i < line.length; i++) {
      final c = line[i];
      if (c == '"') {
        inQuote = !inQuote;
      } else if (c == ',' && !inQuote) {
        result.add(buf.toString());
        buf.clear();
      } else {
        buf.write(c);
      }
    }
    result.add(buf.toString());
    return result;
  }
}
