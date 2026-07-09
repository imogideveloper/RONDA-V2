import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/app_theme.dart';
import '../../services/rt_service.dart';
import '../../widgets/rt_app_bar.dart';
class CreateRtPage extends StatefulWidget {
  const CreateRtPage({super.key});

  @override
  State<CreateRtPage> createState() => _CreateRtPageState();
}

class _CreateRtPageState extends State<CreateRtPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _rtCtrl = TextEditingController();
  final _rwCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _rtService = RtService();
  bool _loading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _rtCtrl.dispose();
    _rwCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final result = await _rtService.createRt(
        name: _nameCtrl.text.trim(),
        rtNumber: _rtCtrl.text.trim(),
        rwNumber: _rwCtrl.text.trim().isEmpty ? null : _rwCtrl.text.trim(),
        address: _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
      );
      if (!mounted) return;
      await showDialog(
        context: context,
        builder: (_) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('RT Berhasil Dibuat 🎉'),
          content: Text('Kode undangan: ${result['invite_code']}'),
          actions: [
            ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Lanjut')),
          ],
        ),
      );
      if (mounted) Navigator.pop(context, true);
    } on PostgrestException catch (e) {
      _err(e.message);
    } catch (_) {
      _err('Gagal membuat RT');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _err(String m) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m), backgroundColor: AppTheme.danger));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: const RtAppBar(title: 'Buat RT Baru'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                _field('Nama RT / Lingkungan', _nameCtrl, 'RT 05 Perumahan Mawar'),
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(child: _field('No. RT', _rtCtrl, '05')),
                    const SizedBox(width: 12),
                    Expanded(child: _field('No. RW', _rwCtrl, '03', required: false)),
                  ],
                ),
                const SizedBox(height: 14),
                _field('Alamat', _addressCtrl, 'Jl. Melati No. 1', required: false),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    child: _loading
                        ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Buat RT & Jadi Ketua RT'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController c, String hint, {bool required = true}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        TextFormField(
          controller: c,
          decoration: InputDecoration(hintText: hint),
          validator: required ? (v) => (v == null || v.trim().isEmpty) ? '$label wajib diisi' : null : null,
        ),
      ],
    );
  }
}
