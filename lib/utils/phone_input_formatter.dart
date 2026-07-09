import 'package:flutter/services.dart';

/// Hanya angka; otomatis buang 62/0 di depan — user tidak perlu ketik +
class IndonesiaPhoneFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var digits = newValue.text.replaceAll(RegExp(r'\D'), '');

    // Paste +62838... atau 62838...
    if (digits.startsWith('62')) digits = digits.substring(2);
    if (digits.startsWith('0')) digits = digits.substring(1);

    if (digits.length > 13) digits = digits.substring(0, 13);

    return TextEditingValue(
      text: digits,
      selection: TextSelection.collapsed(offset: digits.length),
    );
  }
}
