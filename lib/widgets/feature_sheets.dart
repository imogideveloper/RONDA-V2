import 'package:flutter/material.dart';
import '../config/app_theme.dart';
import 'keyboard_aware_sheet.dart';

Future<T?> showAppBottomSheet<T>(
  BuildContext context, {
  required Widget Function(BuildContext ctx) builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: AppTheme.surface,
    barrierColor: Colors.black.withValues(alpha: 0.45),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) => KeyboardAwareSheetBody(child: builder(ctx)),
  );
}

Future<bool?> showKasFormSheet(
  BuildContext context, {
  required bool isIncome,
  required Future<void> Function(double amount, String description) onSubmit,
}) {
  final amountCtrl = TextEditingController();
  final descCtrl = TextEditingController();
  final formKey = GlobalKey<FormState>();
  var saving = false;

  return showAppBottomSheet<bool>(
    context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setModal) => Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              isIncome ? 'Catat Pemasukan' : 'Catat Pengeluaran',
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.next,
              scrollPadding: const EdgeInsets.only(bottom: 120),
              decoration: const InputDecoration(
                labelText: 'Jumlah (Rp)',
                hintText: '50000',
              ),
              validator: (v) {
                final n = double.tryParse(v?.replaceAll('.', '').replaceAll(',', '') ?? '');
                if (n == null || n <= 0) return 'Masukkan jumlah valid';
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: descCtrl,
              textInputAction: TextInputAction.done,
              scrollPadding: const EdgeInsets.only(bottom: 120),
              decoration: const InputDecoration(
                labelText: 'Keterangan',
                hintText: 'Contoh: Iuran warga / Kebersihan',
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Keterangan wajib diisi' : null,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setModal(() => saving = true);
                      try {
                        final raw = amountCtrl.text.replaceAll('.', '').replaceAll(',', '');
                        await onSubmit(double.parse(raw), descCtrl.text.trim());
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text('Gagal: $e'), backgroundColor: AppTheme.danger),
                          );
                        }
                        setModal(() => saving = false);
                      }
                    },
              child: saving
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Simpan'),
            ),
          ],
        ),
      ),
    ),
  );
}

Future<bool?> showEditProfileSheet(
  BuildContext context, {
  required String initialName,
  required String initialPhone,
  required Future<void> Function(String name, String phone) onSubmit,
}) {
  final nameCtrl = TextEditingController(text: initialName);
  final phoneCtrl = TextEditingController(text: initialPhone);
  final formKey = GlobalKey<FormState>();
  var saving = false;

  return showAppBottomSheet<bool>(
    context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setModal) => Form(
        key: formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text('Edit Profil', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            TextFormField(
              controller: nameCtrl,
              textInputAction: TextInputAction.next,
              scrollPadding: const EdgeInsets.only(bottom: 120),
              decoration: const InputDecoration(labelText: 'Nama lengkap'),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Nama wajib' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              scrollPadding: const EdgeInsets.only(bottom: 120),
              decoration: const InputDecoration(labelText: 'Nomor HP'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: saving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setModal(() => saving = true);
                      try {
                        await onSubmit(nameCtrl.text.trim(), phoneCtrl.text.trim());
                        if (ctx.mounted) Navigator.pop(ctx, true);
                      } catch (e) {
                        if (ctx.mounted) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text('Gagal: $e'), backgroundColor: AppTheme.danger),
                          );
                        }
                        setModal(() => saving = false);
                      }
                    },
              child: const Text('Simpan'),
            ),
          ],
        ),
      ),
    ),
  );
}
