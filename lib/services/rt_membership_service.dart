import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/rt_membership_model.dart';

class RtMembershipService {
  final SupabaseClient _supabase = Supabase.instance.client;

  Future<List<RtMembershipModel>> listMyMemberships() async {
    try {
      final result = await _supabase.rpc('list_my_rt_memberships');
      if (result == null) return [];
      final list = result as List;
      return list
          .map((e) => RtMembershipModel.fromMap(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (_) {
      return _fallbackSingleMembership();
    }
  }

  Future<List<RtMembershipModel>> _fallbackSingleMembership() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) return [];
    final profile = await _supabase
        .from('profiles')
        .select('rt_id, role')
        .eq('id', userId)
        .maybeSingle();
    final rtId = profile?['rt_id'] as String?;
    if (rtId == null) return [];
    final rt = await _supabase.from('rt_units').select().eq('id', rtId).maybeSingle();
    if (rt == null) return [];
    return [
      RtMembershipModel(
        rtId: rtId,
        rtName: rt['name'] as String? ?? 'RT',
        rtNumber: rt['rt_number'] as String? ?? '',
        rwNumber: rt['rw_number'] as String?,
        address: rt['address'] as String?,
        role: profile?['role'] as String? ?? 'warga',
        joinedAt: DateTime.now(),
        isActive: true,
      ),
    ];
  }

  Future<void> switchActiveRt(String rtId) async {
    await _supabase.rpc('switch_active_rt', params: {'p_rt_id': rtId});
  }

  Future<Map<String, dynamic>> joinRtByCode(String code) async {
    final result = await _supabase.rpc('join_rt_by_code', params: {
      'p_invite_code': code.trim(),
    });
    return Map<String, dynamic>.from(result as Map);
  }
}
