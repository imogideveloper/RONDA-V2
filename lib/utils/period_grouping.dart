import '../config/app_theme.dart';
import '../models/rt_unit_model.dart';

const _monthNames = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const _monthNamesShort = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

String monthLabel(int month, {bool short = false}) {
  if (month < 1 || month > 12) return '-';
  return short ? _monthNamesShort[month - 1] : _monthNames[month - 1];
}

String weekdayDateLabel(DateTime d) {
  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  final w = days[d.weekday - 1];
  return '$w, ${d.day} ${monthLabel(d.month)} ${d.year}';
}

class PeriodMonthGroup<T> {
  final int year;
  final int month;
  final List<T> items;
  final double totalAmount;

  const PeriodMonthGroup({
    required this.year,
    required this.month,
    required this.items,
    required this.totalAmount,
  });

  String get monthLabelFull => '${monthLabel(month)} $year';

  /// Nama bulan saja (level kedua accordion), mis. "Maret".
  String get monthTitleOnly => monthLabel(month);
}

class PeriodYearGroup<T> {
  final int year;
  final List<PeriodMonthGroup<T>> months;

  const PeriodYearGroup({required this.year, required this.months});

  double get totalAmount => months.fold<double>(0, (s, m) => s + m.totalAmount);

  int get monthCount => months.length;
}

List<PeriodYearGroup<IuranRecordModel>> groupIuranByYearMonth(
  List<IuranRecordModel> records,
) {
  final filtered = records;

  final byYear = <int, Map<int, Map<String, IuranRecordModel>>>{};
  for (final r in filtered) {
    final parts = r.periodKey.split('-');
    if (parts.length < 2) continue;
    final y = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (y == null || m == null) continue;
    byYear.putIfAbsent(y, () => {});
    byYear[y]!.putIfAbsent(m, () => {});
    byYear[y]![m]![r.periodKey] = r;
  }

  final years = byYear.keys.toList()..sort((a, b) => b.compareTo(a));
  return years.map((y) {
    final monthsMap = byYear[y]!;
    final months = monthsMap.keys.toList()..sort((a, b) => b.compareTo(a));
    final monthGroups = months.map((m) {
      final items = monthsMap[m]!.values.toList()
        ..sort((a, b) => b.periodKey.compareTo(a.periodKey));
      final total = items.fold<double>(0, (s, i) => s + i.amount);
      return PeriodMonthGroup<IuranRecordModel>(
        year: y,
        month: m,
        items: items,
        totalAmount: total,
      );
    }).toList();
    return PeriodYearGroup<IuranRecordModel>(year: y, months: monthGroups);
  }).toList();
}

List<PeriodYearGroup<KasTransactionModel>> groupKasKeluarByYearMonth(
  List<KasTransactionModel> transactions,
) {
  final keluar = transactions.where((t) => !t.isIncome).toList();
  final byYear = <int, Map<int, List<KasTransactionModel>>>{};
  for (final t in keluar) {
    final y = t.createdAt.year;
    final m = t.createdAt.month;
    byYear.putIfAbsent(y, () => {});
    byYear[y]!.putIfAbsent(m, () => []).add(t);
  }

  final years = byYear.keys.toList()..sort((a, b) => b.compareTo(a));
  return years.map((y) {
    final monthsMap = byYear[y]!;
    final months = monthsMap.keys.toList()..sort((a, b) => b.compareTo(a));
    final monthGroups = months.map((m) {
      final items = monthsMap[m]!
        ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
      final total = items.fold<double>(0, (s, i) => s + i.amount);
      return PeriodMonthGroup<KasTransactionModel>(
        year: y,
        month: m,
        items: items,
        totalAmount: total,
      );
    }).toList();
    return PeriodYearGroup<KasTransactionModel>(year: y, months: monthGroups);
  }).toList();
}

/// Hari keterlambatan dari akhir bulan periode iuran.
int daysLateFromPeriodKey(String periodKey) {
  final parts = periodKey.split('-');
  if (parts.length < 2) return 0;
  final y = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (y == null || m == null) return 0;
  final endOfMonth = DateTime(y, m + 1, 0);
  final now = DateTime.now();
  if (!now.isAfter(endOfMonth)) return 0;
  return now.difference(endOfMonth).inDays;
}

/// Label periode iuran konsisten bahasa Indonesia dari [periodKey].
String iuranPeriodTitle(IuranRecordModel record) {
  final parts = record.periodKey.split('-');
  if (parts.length >= 2) {
    final y = int.tryParse(parts[0]);
    final m = int.tryParse(parts[1]);
    if (y != null && m != null) return '${monthLabel(m)} $y';
  }
  return record.periodLabel;
}

String iuranPaidSubtitle(IuranRecordModel record) {
  if (record.paidAt == null) return 'Belum dibayar';
  final d = record.paidAt!;
  return '${record.paymentMethodLabel} • ${d.day} ${monthLabel(d.month, short: true)}';
}

/// Akhir bulan periode iuran, mis. "31 Mei 2026".
String iuranDueDateLabel(String periodKey) {
  final parts = periodKey.split('-');
  if (parts.length < 2) return '-';
  final y = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (y == null || m == null) return '-';
  final end = DateTime(y, m + 1, 0);
  return '${end.day} ${monthLabel(m)} $y';
}

/// Badge periode singkat, mis. "MEI 2026".
String iuranPeriodBadge(String periodKey) {
  final parts = periodKey.split('-');
  if (parts.length < 2) return periodKey.toUpperCase();
  final y = int.tryParse(parts[0]);
  final m = int.tryParse(parts[1]);
  if (y == null || m == null) return periodKey.toUpperCase();
  return '${monthLabel(m, short: true).toUpperCase()} $y';
}

/// Format ringkas: Rp 100.000 → Rp 100rb.
String formatRupiahCompact(num amount) {
  final n = amount.round();
  if (n >= 1000 && n % 1000 == 0) return 'Rp ${n ~/ 1000}rb';
  return AppTheme.formatRupiah(n);
}

int maxDaysLate(List<IuranRecordModel> unpaid) {
  if (unpaid.isEmpty) return 0;
  var max = 0;
  for (final r in unpaid) {
    final d = daysLateFromPeriodKey(r.periodKey);
    if (d > max) max = d;
  }
  return max;
}
