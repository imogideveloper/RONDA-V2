import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/app_toast.dart';
import '../../models/profile_model.dart';
import '../../models/rt_unit_model.dart';
import '../../services/rt_service.dart';
import '../../utils/whatsapp_launcher.dart';
import '../../widgets/animated_rt_widgets.dart';
import '../../widgets/warga_beranda_widgets.dart';
import '../../widgets/warga_detail_widgets.dart';

/// Kontak darurat — Ketua RT, Bendahara, dan pengurus RT lainnya.
class WargaKontakDaruratPage extends StatefulWidget {
  final ProfileModel profile;
  final RtUnitModel rt;

  const WargaKontakDaruratPage({
    super.key,
    required this.profile,
    required this.rt,
  });

  @override
  State<WargaKontakDaruratPage> createState() => _WargaKontakDaruratPageState();
}

class _WargaKontakDaruratPageState extends State<WargaKontakDaruratPage> {
  final _rtService = RtService();
  List<ProfileModel> _pengurus = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    var list = await _rtService.getRtPengurus(widget.rt.id);
    final ketua = await _rtService.getKetuaProfile(widget.rt.id);
    if (ketua != null && !list.any((p) => p.id == ketua.id)) {
      list = [ketua, ...list];
    }
    if (mounted) {
      setState(() {
        _pengurus = list;
        _loading = false;
      });
    }
  }

  String get _rtSubtitle {
    final addr = widget.rt.address?.trim();
    final loc = (addr != null && addr.isNotEmpty) ? addr : widget.rt.name;
    return '${widget.rt.displayLabel} — $loc';
  }

  Future<void> _call(ProfileModel p) async {
    final digits = p.phone.replaceAll(RegExp(r'\D'), '');
    if (digits.length < 9) {
      AppToast.error(context, 'Nomor pengurus belum diisi');
      return;
    }
    final normalized = normalizePhoneForWhatsApp(p.phone);
    final uri = Uri.parse('tel:+$normalized');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _wa(ProfileModel p) async {
    final ok = await openWhatsAppPhone(p.phone);
    if (!ok && mounted) {
      AppToast.error(context, 'Tidak dapat membuka WhatsApp');
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
        title: Text('Kontak Darurat', style: WargaBerandaText.sectionTitle()),
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: PulseLoader(height: 64, width: 64))
          : WargaPullRefresh(
              onRefresh: _load,
              child: ListView(
                physics: WargaPullRefresh.listPhysics(),
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                children: [
                  WargaEmergencyBannerCard(rtLine: _rtSubtitle),
                  const SizedBox(height: 24),
                  Text('Pengurus RT', style: WargaBerandaText.sectionTitle()),
                  const SizedBox(height: 12),
                  if (_pengurus.isEmpty)
                    WargaCard(
                      child: Text(
                        'Belum ada data Ketua RT / Bendahara. Hubungi pengurus melalui kantor RT.',
                        style: WargaBerandaText.greeting(),
                      ),
                    )
                  else
                    ..._pengurus.map(
                      (p) => WargaPengurusContactCard(
                        profile: p,
                        rt: widget.rt,
                        onCall: () => _call(p),
                        onWhatsApp: () => _wa(p),
                      ),
                    ),
                ],
              ),
            ),
    );
  }
}
