import 'package:url_launcher/url_launcher.dart';

String normalizePhoneForWhatsApp(String raw) {
  var digits = raw.replaceAll(RegExp(r'\D'), '');
  if (digits.startsWith('0')) {
    digits = '62${digits.substring(1)}';
  } else if (!digits.startsWith('62') && digits.length >= 9) {
    digits = '62$digits';
  }
  return digits;
}

Future<bool> openWhatsAppPhone(String phone) async {
  final normalized = normalizePhoneForWhatsApp(phone);
  if (normalized.length < 10) return false;
  final uri = Uri.parse('https://wa.me/$normalized');
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<bool> openWhatsAppTagihan({
  required String phone,
  required String wargaName,
  required String periodLabel,
  required String amountFormatted,
  required String rtLabel,
}) async {
  final normalized = normalizePhoneForWhatsApp(phone);
  if (normalized.length < 10) return false;

  final text =
      'Assalamualaikum Pak/Bu $wargaName,\n\n'
      'Reminder iuran RT *$rtLabel* periode *$periodLabel* sebesar *$amountFormatted*.\n\n'
      'Mohon segera diselesaikan. Terima kasih.\n'
      '_Pesan dari RT OS Ronda_';

  final uri = Uri.parse('https://wa.me/$normalized?text=${Uri.encodeComponent(text)}');
  if (!await canLaunchUrl(uri)) return false;
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
