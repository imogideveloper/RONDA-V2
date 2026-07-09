import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_surat_widgets.dart';

class WargaFamilyMemberDemo {
  final String name;
  final String relation;
  final String occupation;
  final String nik;
  final String birthPlace;
  final String birthDate;
  final String gender;
  final String religion;

  const WargaFamilyMemberDemo({
    required this.name,
    required this.relation,
    required this.occupation,
    required this.nik,
    required this.birthPlace,
    required this.birthDate,
    required this.gender,
    required this.religion,
  });
}

/// Form pengajuan surat — langkah isi data & preview.
class WargaSuratFormPage extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;
  final WargaLayananSuratItem suratItem;
  final String? reapplyPurpose;

  const WargaSuratFormPage({
    super.key,
    required this.profile,
    required this.rt,
    required this.suratItem,
    this.reapplyPurpose,
  });

  @override
  State<WargaSuratFormPage> createState() => _WargaSuratFormPageState();
}

class _WargaSuratFormPageState extends State<WargaSuratFormPage> {
  final _rtService = RtService();
  int _step = 0;
  bool _forSelf = true;
  int _familyIndex = 0;
  int? _keperluanIndex;
  bool _submitting = false;

  static const _familyDemo = [
    WargaFamilyMemberDemo(
      name: 'Siti Nurhaliza',
      relation: 'Istri',
      occupation: 'Ibu Rumah Tangga',
      nik: '3276054203870002',
      birthPlace: 'Bogor',
      birthDate: '4 Maret 1987',
      gender: 'Perempuan',
      religion: 'Islam',
    ),
    WargaFamilyMemberDemo(
      name: 'Muhammad Rizki Hidayat',
      relation: 'Anak',
      occupation: 'Pelajar',
      nik: '3276051205120004',
      birthPlace: 'Depok',
      birthDate: '12 Mei 2012',
      gender: 'Laki-laki',
      religion: 'Islam',
    ),
    WargaFamilyMemberDemo(
      name: 'Aisyah Putri Hidayat',
      relation: 'Anak',
      occupation: 'Pelajar',
      nik: '3276050808140005',
      birthPlace: 'Depok',
      birthDate: '8 Agustus 2014',
      gender: 'Perempuan',
      religion: 'Islam',
    ),
  ];

  String get _address {
    final addr = widget.rt.address?.trim();
    if (addr != null && addr.isNotEmpty) return addr;
    return '${widget.rt.name}, RT ${widget.rt.rtNumber}';
  }

  String get _selectedKeperluan {
    if (_keperluanIndex == null) return '';
    return widget.suratItem.keperluanOptions[_keperluanIndex!];
  }

  String _buildPurpose() {
    final subject = _forSelf
        ? 'Diri sendiri (${widget.profile.fullName})'
        : '${_familyDemo[_familyIndex].name} · ${_familyDemo[_familyIndex].relation}';
    return '[$subject] $_selectedKeperluan';
  }

  Future<void> _submit() async {
    if (_selectedKeperluan.isEmpty) {
      AppToast.error(context, 'Pilih keperluan surat');
      return;
    }
    setState(() => _submitting = true);
    try {
      await _rtService.submitSuratRequest(
        rtId: widget.rt.id,
        suratType: widget.suratItem.suratTypeKey,
        purpose: _buildPurpose(),
      );
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) AppToast.error(context, '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: WargaBerandaColors.bgColor,
      appBar: AppBar(
        backgroundColor: WargaBerandaColors.bgColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: WargaBerandaColors.card,
              shape: BoxShape.circle,
              border: Border.all(color: WargaBerandaColors.border),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded, size: 16, color: WargaBerandaColors.textPrimary),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.suratItem.title,
          style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15),
          textAlign: TextAlign.center,
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: WargaSuratFormStepper(step: _step),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              children: _step == 0 ? _buildFillStep() : _buildPreviewStep(),
            ),
          ),
          _bottomBar(),
        ],
      ),
    );
  }

  List<Widget> _buildFillStep() {
    return [
      _infoBanner(),
      const SizedBox(height: 20),
      _sectionTitle(Icons.person_outline, 'Data Pemohon', badge: 'OTOMATIS'),
      const SizedBox(height: 10),
      _pemohonCard(),
      const SizedBox(height: 20),
      _sectionTitle(Icons.people_outline, 'Surat Untuk'),
      const SizedBox(height: 10),
      Row(
        children: [
          Expanded(child: _suratUntukCard(true, 'Diri Sendiri', 'Kepala Keluarga', Icons.person_outline)),
          const SizedBox(width: 10),
          Expanded(child: _suratUntukCard(false, 'Anggota Keluarga', 'Anak, Istri, dll', Icons.family_restroom_outlined)),
        ],
      ),
      if (!_forSelf) ...[
        const SizedBox(height: 16),
        _sectionTitle(Icons.edit_outlined, 'Data Orang dalam Surat', iconColor: const Color(0xFFEA580C)),
        const SizedBox(height: 10),
        ...List.generate(_familyDemo.length, (i) => _familyCard(i)),
        const SizedBox(height: 12),
        _familyDetailCard(_familyDemo[_familyIndex]),
      ],
      const SizedBox(height: 20),
      _sectionTitle(Icons.description_outlined, 'Keperluan', iconColor: WargaBerandaColors.primaryGreen),
      const SizedBox(height: 10),
      ...List.generate(widget.suratItem.keperluanOptions.length, (i) => _keperluanTile(i)),
    ];
  }

  List<Widget> _buildPreviewStep() {
    final subject = _forSelf
        ? widget.profile.fullName
        : _familyDemo[_familyIndex].name;
    return [
      Container(
        padding: const EdgeInsets.all(16),
        decoration: wargaCardDecoration(radius: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Ringkasan permohonan', style: WargaBerandaText.sectionTitle()),
            const SizedBox(height: 12),
            _previewRow('Jenis surat', widget.suratItem.title),
            _previewRow('Untuk', subject),
            _previewRow('Keperluan', _selectedKeperluan),
            _previewRow('Estimasi', widget.suratItem.sla),
            const Divider(height: 24),
            Text(
              'Setelah dikirim, permohonan akan ditinjau Ketua RT. Anda bisa cek status di tab Permohonan Saya.',
              style: WargaBerandaText.greeting().copyWith(fontSize: 12, height: 1.4),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _previewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(label, style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
          ),
          Expanded(
            child: Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _bottomBar() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: _submitting
                ? null
                : () {
                    if (_step == 0) {
                      if (_keperluanIndex == null) {
                        AppToast.error(context, 'Pilih keperluan surat');
                        return;
                      }
                      setState(() => _step = 1);
                    } else {
                      _submit();
                    }
                  },
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _submitting
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : Text(
                    _step == 0 ? 'Lanjut Preview' : 'Kirim Permohonan',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                  ),
          ),
        ),
      ),
    );
  }

  Widget _infoBanner() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: WargaBerandaColors.accentBlue,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF93C5FD)),
      ),
      child: Row(
        children: [
          Icon(widget.suratItem.icon, color: widget.suratItem.iconColor, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(widget.suratItem.title, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
                Text(
                  'Estimasi ${widget.suratItem.sla}',
                  style: WargaBerandaText.greeting().copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(IconData icon, String title, {String? badge, Color? iconColor}) {
    return Row(
      children: [
        Icon(icon, size: 20, color: iconColor ?? const Color(0xFF3B82F6)),
        const SizedBox(width: 8),
        Text(title, style: WargaBerandaText.sectionTitle().copyWith(fontSize: 15)),
        if (badge != null) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: WargaBerandaColors.accentBlue,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              badge,
              style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.w700, color: const Color(0xFF2563EB)),
            ),
          ),
        ],
      ],
    );
  }

  Widget _pemohonCard() {
    final initials = wargaInitialsFromName(widget.profile.fullName);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: wargaCardDecoration(radius: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 22,
                backgroundColor: const Color(0xFFDBEAFE),
                child: Text(initials, style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: const Color(0xFF2563EB))),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(widget.profile.fullName, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15)),
                    Text('Kepala Keluarga', style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(child: _field('NAMA', widget.profile.fullName)),
              Expanded(child: _field('NIK', '—')),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _field('PEKERJAAN', 'Wiraswasta')),
              Expanded(child: _field('STATUS', 'Kawin')),
            ],
          ),
          const SizedBox(height: 10),
          _field('ALAMAT', _address, fullWidth: true),
        ],
      ),
    );
  }

  Widget _field(String label, String value, {bool fullWidth = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: WargaBerandaColors.textSecondary,
            letterSpacing: 0.3,
          ),
        ),
        const SizedBox(height: 2),
        Text(value, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13)),
      ],
    );
  }

  Widget _suratUntukCard(bool self, String title, String sub, IconData icon) {
    final selected = _forSelf == self;
    return GestureDetector(
      onTap: () => setState(() => _forSelf = self),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: selected ? WargaBerandaColors.accentBlue : WargaBerandaColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? const Color(0xFF3B82F6) : WargaBerandaColors.border,
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Icon(icon, color: selected ? const Color(0xFF2563EB) : WargaBerandaColors.textSecondary),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: selected ? const Color(0xFF2563EB) : WargaBerandaColors.textPrimary,
              ),
            ),
            Text(
              sub,
              textAlign: TextAlign.center,
              style: WargaBerandaText.greeting().copyWith(
                fontSize: 11,
                color: selected ? const Color(0xFF2563EB) : WargaBerandaColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _familyCard(int index) {
    final m = _familyDemo[index];
    final selected = _familyIndex == index;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => setState(() => _familyIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: selected ? WargaBerandaColors.accentBlue : WargaBerandaColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? const Color(0xFF3B82F6) : WargaBerandaColors.border,
            ),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: WargaBerandaColors.lightGreen,
                child: Text(
                  wargaInitialsFromName(m.name),
                  style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14)),
                    Text('${m.relation} · ${m.occupation}', style: WargaBerandaText.greeting().copyWith(fontSize: 12)),
                  ],
                ),
              ),
              if (selected)
                const Icon(Icons.check_circle, color: Color(0xFF3B82F6), size: 22),
            ],
          ),
        ),
      ),
    );
  }

  Widget _familyDetailCard(WargaFamilyMemberDemo m) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: wargaCardDecoration(radius: 14),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(child: _field('NIK', m.nik)),
              Expanded(child: _field('TTL', '${m.birthPlace}, ${m.birthDate}')),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(child: _field('JENIS KELAMIN', m.gender)),
              Expanded(child: _field('AGAMA', m.religion)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _keperluanTile(int index) {
    final selected = _keperluanIndex == index;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () => setState(() => _keperluanIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: wargaCardDecoration(radius: 14),
          child: Row(
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? const Color(0xFF3B82F6) : WargaBerandaColors.textSecondary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  widget.suratItem.keperluanOptions[index],
                  style: GoogleFonts.poppins(fontWeight: FontWeight.w500, fontSize: 14),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
