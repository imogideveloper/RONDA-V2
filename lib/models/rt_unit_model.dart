class RtUnitModel {
  final String id;
  final String name;
  final String rtNumber;
  final String? rwNumber;
  final String? address;
  final String inviteCode;
  final String ketuaId;
  final int memberCount;
  final DateTime createdAt;

  RtUnitModel({
    required this.id,
    required this.name,
    required this.rtNumber,
    this.rwNumber,
    this.address,
    required this.inviteCode,
    required this.ketuaId,
    required this.memberCount,
    required this.createdAt,
  });

  factory RtUnitModel.fromMap(Map<String, dynamic> map) {
    return RtUnitModel(
      id: map['id'] as String,
      name: map['name'] as String,
      rtNumber: map['rt_number'] as String,
      rwNumber: map['rw_number'] as String?,
      address: map['address'] as String?,
      inviteCode: map['invite_code'] as String,
      ketuaId: map['ketua_id'] as String,
      memberCount: map['member_count'] as int? ?? 1,
      createdAt: DateTime.parse(map['created_at'] as String),
    );
  }

  String get displayLabel {
    final rw = rwNumber != null ? ' RW $rwNumber' : '';
    return 'RT $rtNumber$rw';
  }
}

class KasSummaryModel {
  final double totalMasuk;
  final double totalKeluar;
  final double saldo;

  KasSummaryModel({
    required this.totalMasuk,
    required this.totalKeluar,
    required this.saldo,
  });

  factory KasSummaryModel.fromMap(Map<String, dynamic> map) {
    return KasSummaryModel(
      totalMasuk: _toDouble(map['total_masuk']),
      totalKeluar: _toDouble(map['total_keluar']),
      saldo: _toDouble(map['saldo']),
    );
  }

  factory KasSummaryModel.empty() =>
      KasSummaryModel(totalMasuk: 0, totalKeluar: 0, saldo: 0);

  static double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }
}

class AnnouncementModel {
  final String id;
  final String rtId;
  final String authorId;
  final String title;
  final String content;
  final bool isPinned;
  final DateTime createdAt;
  final DateTime? eventDate;
  final String? imageUrl;
  final String? authorName;

  AnnouncementModel({
    required this.id,
    required this.rtId,
    required this.authorId,
    required this.title,
    required this.content,
    required this.isPinned,
    required this.createdAt,
    this.eventDate,
    this.imageUrl,
    this.authorName,
  });

  bool get hasEventDate => eventDate != null;
  bool get hasImage => imageUrl != null && imageUrl!.trim().isNotEmpty;

  String get eventDateLabel => hasEventDate ? formatDate(eventDate!) : '';
  String get createdAtLabel => formatDate(createdAt);

  String get contentPreview {
    if (content.length <= 100) return content;
    return '${content.substring(0, 100).trim()}…';
  }

  static String formatDate(DateTime d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }

  factory AnnouncementModel.fromMap(Map<String, dynamic> map) {
    final profiles = map['profiles'];
    final eventRaw = map['event_date'];
    DateTime? eventDate;
    if (eventRaw != null) {
      if (eventRaw is String) {
        eventDate = DateTime.tryParse(eventRaw.contains('T') ? eventRaw : '${eventRaw}T00:00:00');
      }
    }
    return AnnouncementModel(
      id: map['id'] as String,
      rtId: map['rt_id'] as String,
      authorId: map['author_id'] as String,
      title: map['title'] as String,
      content: map['content'] as String,
      isPinned: map['is_pinned'] as bool? ?? false,
      createdAt: DateTime.parse(map['created_at'] as String),
      eventDate: eventDate,
      imageUrl: map['image_url'] as String?,
      authorName: profiles is Map ? profiles['full_name'] as String? : null,
    );
  }
}

class KasTransactionModel {
  final String id;
  final String rtId;
  final String type;
  final double amount;
  final String description;
  final String? category;
  final DateTime createdAt;
  final String? recorderName;

  KasTransactionModel({
    required this.id,
    required this.rtId,
    required this.type,
    required this.amount,
    required this.description,
    this.category,
    required this.createdAt,
    this.recorderName,
  });

  bool get isIncome => type == 'masuk';

  factory KasTransactionModel.fromMap(Map<String, dynamic> map) {
    final profiles = map['profiles'];
    return KasTransactionModel(
      id: map['id'] as String,
      rtId: map['rt_id'] as String,
      type: map['type'] as String,
      amount: KasSummaryModel._toDouble(map['amount']),
      description: map['description'] as String,
      category: map['category'] as String?,
      createdAt: DateTime.parse(map['created_at'] as String),
      recorderName: profiles is Map ? profiles['full_name'] as String? : null,
    );
  }

  String get dateLabel {
    final d = createdAt;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return '${d.day} ${months[d.month - 1]}';
  }
}

class IuranRecordModel {
  final String id;
  final String rtId;
  final String userId;
  final String periodKey;
  final String periodLabel;
  final double amount;
  final String status;
  final DateTime? paidAt;
  final String? userName;
  final String? paymentMethod;
  final String? paymentProofUrl;
  final DateTime? submittedAt;

  IuranRecordModel({
    required this.id,
    required this.rtId,
    required this.userId,
    required this.periodKey,
    required this.periodLabel,
    required this.amount,
    required this.status,
    this.paidAt,
    this.userName,
    this.paymentMethod,
    this.paymentProofUrl,
    this.submittedAt,
  });

  bool get isPaid => status == 'paid';
  bool get isPending => status == 'pending';
  bool get isAwaitingVerification => status == 'awaiting_verification';
  bool get isUnpaid => !isPaid && !isAwaitingVerification;

  String get paymentMethodLabel {
    switch (paymentMethod) {
      case 'transfer':
        return 'Transfer Bank';
      case 'cash':
        return 'Tunai';
      case 'qris':
      default:
        return 'QRIS';
    }
  }

  factory IuranRecordModel.fromMap(Map<String, dynamic> map) {
    final profiles = map['profiles'];
    return IuranRecordModel(
      id: map['id'] as String,
      rtId: map['rt_id'] as String,
      userId: map['user_id'] as String,
      periodKey: map['period_key'] as String,
      periodLabel: map['period_label'] as String,
      amount: KasSummaryModel._toDouble(map['amount']),
      status: map['status'] as String,
      paidAt: map['paid_at'] != null ? DateTime.parse(map['paid_at'] as String) : null,
      userName: profiles is Map ? profiles['full_name'] as String? : null,
      paymentMethod: map['payment_method'] as String?,
      paymentProofUrl: map['payment_proof_url'] as String?,
      submittedAt: map['submitted_at'] != null ? DateTime.parse(map['submitted_at'] as String) : null,
    );
  }

  String get paidDateLabel {
    if (paidAt == null) return '-';
    final d = paidAt!;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }

  String get submittedDateLabel {
    if (submittedAt == null) return '-';
    final d = submittedAt!;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return '${d.day} ${months[d.month - 1]}';
  }
}

class SuratRequestModel {
  final String id;
  final String suratType;
  final String purpose;
  final String status;
  final DateTime createdAt;
  final String? userName;

  SuratRequestModel({
    required this.id,
    required this.suratType,
    required this.purpose,
    required this.status,
    required this.createdAt,
    this.userName,
  });

  factory SuratRequestModel.fromMap(Map<String, dynamic> map) {
    final profiles = map['profiles'];
    return SuratRequestModel(
      id: map['id'] as String,
      suratType: map['surat_type'] as String,
      purpose: map['purpose'] as String,
      status: map['status'] as String,
      createdAt: DateTime.parse(map['created_at'] as String),
      userName: profiles is Map ? profiles['full_name'] as String? : null,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Menunggu';
    }
  }

  bool get isApproved => status == 'approved';
  bool get isPending => status == 'pending';
  bool get isRejected => status == 'rejected';

  String referenceCode(String rtNumber) {
    final m = createdAt.month.toString().padLeft(2, '0');
    final seq = (createdAt.millisecondsSinceEpoch % 1000).toString().padLeft(3, '0');
    final rt = rtNumber.replaceAll(RegExp(r'\D'), '');
    return 'SR-$rt/$m/$seq';
  }
}
