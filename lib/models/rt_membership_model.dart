class RtMembershipModel {
  final String rtId;
  final String rtName;
  final String rtNumber;
  final String? rwNumber;
  final String? address;
  final String role;
  final DateTime joinedAt;
  final bool isActive;

  RtMembershipModel({
    required this.rtId,
    required this.rtName,
    required this.rtNumber,
    this.rwNumber,
    this.address,
    required this.role,
    required this.joinedAt,
    required this.isActive,
  });

  factory RtMembershipModel.fromMap(Map<String, dynamic> map) {
    final joinedRaw = map['joined_at'];
    return RtMembershipModel(
      rtId: map['rt_id'] as String,
      rtName: map['rt_name'] as String? ?? 'RT',
      rtNumber: map['rt_number'] as String? ?? '',
      rwNumber: map['rw_number'] as String?,
      address: map['address'] as String?,
      role: map['role'] as String? ?? 'warga',
      joinedAt: joinedRaw != null
          ? DateTime.parse(joinedRaw as String)
          : DateTime.now(),
      isActive: map['is_active'] as bool? ?? false,
    );
  }

  String get displayLabel {
    final rw = rwNumber != null && rwNumber!.isNotEmpty ? ' / RW $rwNumber' : '';
    return 'RT $rtNumber$rw';
  }

  String get locationLine {
    if (address != null && address!.trim().isNotEmpty) {
      return '$rtName · $address';
    }
    return rtName;
  }
}

class IuranRtSummaryModel {
  final String periodKey;
  final int totalWarga;
  final int paidCount;
  final int unpaidCount;

  IuranRtSummaryModel({
    required this.periodKey,
    required this.totalWarga,
    required this.paidCount,
    required this.unpaidCount,
  });

  factory IuranRtSummaryModel.fromMap(Map<String, dynamic> map) {
    return IuranRtSummaryModel(
      periodKey: map['period_key'] as String? ?? '',
      totalWarga: (map['total_warga'] as num?)?.toInt() ?? 0,
      paidCount: (map['paid_count'] as num?)?.toInt() ?? 0,
      unpaidCount: (map['unpaid_count'] as num?)?.toInt() ?? 0,
    );
  }

  double get paidRatio =>
      totalWarga <= 0 ? 0 : (paidCount / totalWarga).clamp(0.0, 1.0);
}

class WargaActivityItem {
  final String title;
  final String dateLabel;
  final int colorValue;

  WargaActivityItem({
    required this.title,
    required this.dateLabel,
    required this.colorValue,
  });
}
