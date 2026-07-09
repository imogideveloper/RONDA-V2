import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/app_theme.dart';
import '../../config/app_toast.dart';
import '../../services/rt_service.dart';
import '../../widgets/rt_app_bar.dart';

class JoinRtPage extends StatefulWidget {
  /// Gabung RT kedua/ketiga (warga multi-alamat).
  final bool additionalMembership;

  const JoinRtPage({super.key, this.additionalMembership = false});

  @override
  State<JoinRtPage> createState() => _JoinRtPageState();
}

class _JoinRtPageState extends State<JoinRtPage> {
  final _codeCtrl = TextEditingController();
  final _rtService = RtService();
  bool _loading = false;

  @override
  void dispose() {
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_codeCtrl.text.trim().length < 4) return;
    setState(() => _loading = true);
    try {
      await _rtService.joinRt(_codeCtrl.text.trim());
      if (mounted) Navigator.pop(context, true);
    } on PostgrestException catch (e) {
      AppToast.error(context, e.message);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const RtAppBar(title: 'Gabung RT'),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              widget.additionalMembership
                  ? 'Punya rumah di RT lain? Masukkan kode undangan Ketua RT lokasi tersebut (mis. Cigombong & Jakarta).'
                  : 'Masukkan kode undangan dari Ketua RT jika nomor Anda belum di-import.',
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 15),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _codeCtrl,
              textAlign: TextAlign.center,
              textCapitalization: TextCapitalization.characters,
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 6, color: AppTheme.emeraldDark),
              decoration: const InputDecoration(hintText: 'XXXXXX'),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _submit,
                child: _loading
                    ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(widget.additionalMembership ? 'Gabung RT' : 'Gabung sebagai Warga'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
