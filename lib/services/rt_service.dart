import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/profile_model.dart';

import '../models/rt_membership_model.dart';

import '../models/rt_unit_model.dart';



class RtService {

  final SupabaseClient _supabase = Supabase.instance.client;



  Future<RtUnitModel?> getMyRt() async {

    final userId = _supabase.auth.currentUser?.id;

    if (userId == null) return null;



    final profile = await _supabase

        .from('profiles')

        .select('rt_id')

        .eq('id', userId)

        .maybeSingle();



    final rtId = profile?['rt_id'] as String?;

    if (rtId == null) return null;



    final data = await _supabase

        .from('rt_units')

        .select()

        .eq('id', rtId)

        .maybeSingle();



    if (data == null) return null;

    return RtUnitModel.fromMap(data);

  }



  Future<Map<String, dynamic>> createRt({

    required String name,

    required String rtNumber,

    String? rwNumber,

    String? address,

  }) async {

    final result = await _supabase.rpc('create_rt_unit', params: {

      'p_name': name,

      'p_rt_number': rtNumber,

      'p_rw_number': rwNumber,

      'p_address': address,

    });

    return Map<String, dynamic>.from(result as Map);

  }



  Future<Map<String, dynamic>> joinRt(String inviteCode) async {

    final result = await _supabase.rpc('join_rt_by_code', params: {

      'p_invite_code': inviteCode.trim(),

    });

    return Map<String, dynamic>.from(result as Map);

  }



  Future<IuranRtSummaryModel?> getIuranRtSummary(String rtId) async {

    try {

      final result = await _supabase.rpc('get_iuran_rt_summary', params: {'p_rt_id': rtId});

      if (result == null) return null;

      return IuranRtSummaryModel.fromMap(Map<String, dynamic>.from(result as Map));

    } catch (_) {

      return null;

    }

  }



  /// Ketua RT + Bendahara untuk halaman kontak warga.
  Future<List<ProfileModel>> getRtPengurus(String rtId) async {
    try {
      final data = await _supabase
          .from('profiles')
          .select()
          .eq('rt_id', rtId)
          .inFilter('role', ['ketua_rt', 'bendahara'])
          .order('full_name');

      final list = (data as List)
          .map((e) => ProfileModel.fromMap(Map<String, dynamic>.from(e)))
          .toList();
      list.sort((a, b) {
        if (a.isKetua && !b.isKetua) return -1;
        if (b.isKetua && !a.isKetua) return 1;
        return a.fullName.compareTo(b.fullName);
      });
      return list;
    } catch (_) {
      return [];
    }
  }

  Future<ProfileModel?> getKetuaProfile(String rtId) async {

    try {

      final rt = await _supabase.from('rt_units').select('ketua_id').eq('id', rtId).maybeSingle();

      final ketuaId = rt?['ketua_id'] as String?;

      if (ketuaId == null) return null;

      final data = await _supabase.from('profiles').select().eq('id', ketuaId).maybeSingle();

      if (data == null) return null;

      return ProfileModel.fromMap(Map<String, dynamic>.from(data));

    } catch (_) {

      return null;

    }

  }



  Future<int> countRecentAnnouncements(String rtId, {int days = 14}) async {

    final since = DateTime.now().subtract(Duration(days: days)).toUtc().toIso8601String();

    try {

      final data = await _supabase

          .from('announcements')

          .select('id')

          .eq('rt_id', rtId)

          .gte('created_at', since);

      return (data as List).length;

    } catch (_) {

      return 0;

    }

  }



  Future<int> countActiveSurat(String rtId, String userId) async {

    try {

      final data = await _supabase

          .from('surat_requests')

          .select('id')

          .eq('rt_id', rtId)

          .eq('user_id', userId)

          .inFilter('status', ['pending', 'approved']);

      return (data as List).length;

    } catch (_) {

      return 0;

    }

  }



  Future<void> appointBendahara(String wargaId) async {

    await _supabase.rpc('appoint_bendahara', params: {

      'p_warga_id': wargaId,

    });

  }



  Future<void> revokeBendahara(String bendaharaId) async {

    await _supabase.rpc('revoke_bendahara', params: {

      'p_bendahara_id': bendaharaId,

    });

  }



  Future<List<ProfileModel>> getRtMembers() async {

    final userId = _supabase.auth.currentUser?.id;

    if (userId == null) return [];



    final myProfile = await _supabase

        .from('profiles')

        .select('rt_id')

        .eq('id', userId)

        .maybeSingle();



    final rtId = myProfile?['rt_id'] as String?;

    if (rtId == null) return [];



    final data = await _supabase

        .from('profiles')

        .select()

        .eq('rt_id', rtId)

        .order('role')

        .order('full_name');



    return (data as List)

        .map((e) => ProfileModel.fromMap(Map<String, dynamic>.from(e)))

        .toList();

  }



  // ── Kas ───────────────────────────────────────────────────────



  Future<KasSummaryModel> getKasSummary(String rtId) async {

    try {

      final data = await _supabase

          .from('rt_kas_summary')

          .select()

          .eq('rt_id', rtId)

          .maybeSingle();



      if (data == null) return KasSummaryModel.empty();

      return KasSummaryModel.fromMap(Map<String, dynamic>.from(data));

    } catch (_) {

      return KasSummaryModel.empty();

    }

  }



  Future<List<KasTransactionModel>> getKasTransactions(String rtId, {int limit = 50}) async {

    try {

      final data = await _supabase

          .from('kas_transactions')

          .select('*, profiles(full_name)')

          .eq('rt_id', rtId)

          .order('created_at', ascending: false)

          .limit(limit);



      return (data as List)

          .map((e) => KasTransactionModel.fromMap(Map<String, dynamic>.from(e)))

          .toList();

    } catch (_) {

      return [];

    }

  }



  Future<void> addKasTransaction({

    required String rtId,

    required String type,

    required double amount,

    required String description,

    String? category,

  }) async {

    final userId = _supabase.auth.currentUser!.id;

    await _supabase.from('kas_transactions').insert({

      'rt_id': rtId,

      'recorded_by': userId,

      'type': type,

      'amount': amount,

      'description': description,

      'category': category,

    });

  }



  // ── Pengumuman ────────────────────────────────────────────────



  Future<List<AnnouncementModel>> getAnnouncements(String rtId) async {

    final data = await _supabase

        .from('announcements')

        .select('*, profiles(full_name)')

        .eq('rt_id', rtId)

        .order('is_pinned', ascending: false)

        .order('created_at', ascending: false)

        .limit(50);



    return (data as List)

        .map((e) => AnnouncementModel.fromMap(Map<String, dynamic>.from(e)))

        .toList();

  }



  Future<AnnouncementModel> createAnnouncement({

    required String rtId,

    required String title,

    required String content,

    bool isPinned = false,

    DateTime? eventDate,

    String? imageUrl,

  }) async {

    final userId = _supabase.auth.currentUser!.id;

    final row = <String, dynamic>{

      'rt_id': rtId,

      'author_id': userId,

      'title': title,

      'content': content,

      'is_pinned': isPinned,

    };

    if (eventDate != null) {

      row['event_date'] = _dateOnly(eventDate);

    }

    if (imageUrl != null && imageUrl.isNotEmpty) {

      row['image_url'] = imageUrl;

    }



    final data = await _supabase

        .from('announcements')

        .insert(row)

        .select('*, profiles(full_name)')

        .single();



    return AnnouncementModel.fromMap(Map<String, dynamic>.from(data));

  }



  static String _dateOnly(DateTime d) =>

      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';



  // ── Iuran ─────────────────────────────────────────────────────



  Future<void> ensureMyIuran({double amount = 50000}) async {

    await _supabase.rpc('ensure_my_iuran', params: {'p_amount': amount});

  }



  Future<int> ensureMonthlyIuran({double amount = 50000}) async {

    final result = await _supabase.rpc('ensure_monthly_iuran', params: {'p_amount': amount});

    return (result as num?)?.toInt() ?? 0;

  }



  Future<List<IuranRecordModel>> getIuranRecords(String rtId, {String? forUserId}) async {

    try {

      var query = _supabase

          .from('iuran_records')

          .select('*, profiles(full_name)')

          .eq('rt_id', rtId);



      if (forUserId != null) {

        query = query.eq('user_id', forUserId);

      }



      final data = await query

          .order('period_key', ascending: false)

          .limit(24);



      return (data as List)

          .map((e) => IuranRecordModel.fromMap(Map<String, dynamic>.from(e)))

          .toList();

    } catch (_) {

      return [];

    }

  }



  Future<void> payIuran(String iuranId) async {
    await _supabase.rpc('pay_iuran', params: {'p_iuran_id': iuranId});
  }

  /// Ajukan bukti bayar — status [awaiting_verification], tampil di Papan info.
  Future<void> submitIuranPayment({
    required String iuranId,
    required String paymentMethod,
    String? paymentProofUrl,
  }) async {
    await _supabase.rpc('submit_iuran_payment', params: {
      'p_iuran_id': iuranId,
      'p_payment_method': paymentMethod,
      'p_payment_proof_url': paymentProofUrl,
    });
  }



  Future<void> approveIuranAsOfficer(String iuranId) async {

    await _supabase.rpc('approve_iuran_as_officer', params: {'p_iuran_id': iuranId});

  }



  // ── Surat ─────────────────────────────────────────────────────



  Future<List<SuratRequestModel>> getSuratRequests(String rtId, {bool allRt = false}) async {

    try {

      final userId = _supabase.auth.currentUser?.id;

      var query = _supabase

          .from('surat_requests')

          .select('*, profiles(full_name)')

          .eq('rt_id', rtId);



      if (!allRt && userId != null) {

        query = query.eq('user_id', userId);

      }



      final data = await query.order('created_at', ascending: false).limit(30);



      return (data as List)

          .map((e) => SuratRequestModel.fromMap(Map<String, dynamic>.from(e)))

          .toList();

    } catch (_) {

      return [];

    }

  }



  Future<void> submitSuratRequest({

    required String rtId,

    required String suratType,

    required String purpose,

  }) async {

    final userId = _supabase.auth.currentUser!.id;

    await _supabase.from('surat_requests').insert({

      'rt_id': rtId,

      'user_id': userId,

      'surat_type': suratType,

      'purpose': purpose,

    });

  }



  Future<void> updateSuratStatus(String suratId, String status) async {

    await _supabase.from('surat_requests').update({

      'status': status,

      'updated_at': DateTime.now().toUtc().toIso8601String(),

    }).eq('id', suratId);

  }

}


