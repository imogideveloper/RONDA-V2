import 'profile_model.dart';
import 'rt_unit_model.dart';

/// Snapshot data Beranda Warga — satu fetch paralel.
class WargaHomeData {
  final List<AnnouncementModel> announcements;
  final List<IuranRecordModel> bills;
  final KasSummaryModel kas;
  final ProfileModel? ketua;
  final int pendingSuratCount;
  final List<SuratRequestModel> mySuratRequests;

  const WargaHomeData({
    required this.announcements,
    required this.bills,
    required this.kas,
    this.ketua,
    this.pendingSuratCount = 0,
    this.mySuratRequests = const [],
  });

  static final empty = WargaHomeData(
    announcements: [],
    bills: [],
    kas: KasSummaryModel.empty(),
  );

  double get totalTagihan =>
      bills.where((b) => b.isUnpaid).fold<double>(0, (s, b) => s + b.amount);

  int get bulanTertunggak => bills.where((b) => b.isUnpaid).length;

  List<IuranRecordModel> get awaitingVerification =>
      bills.where((b) => b.isAwaitingVerification).toList();

  int get paidCount => bills.where((b) => b.isPaid).length;

  double get totalKontribusi =>
      bills.where((b) => b.isPaid).fold<double>(0, (s, b) => s + b.amount);

  int get notifCount {
    final pinned = announcements.where((a) => a.isPinned).length;
    if (pinned > 0) return pinned;
    final since = DateTime.now().subtract(const Duration(days: 14));
    return announcements.where((a) => a.createdAt.isAfter(since)).length;
  }
}
