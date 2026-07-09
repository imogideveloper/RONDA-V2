import 'package:flutter/material.dart';

import '../config/app_theme.dart';
import '../config/iuran_navigation.dart';
import '../models/profile_model.dart';
import '../models/rt_unit_model.dart';
import '../utils/whatsapp_launcher.dart';
import 'rt_ui_widgets.dart';
import 'warga_beranda_widgets.dart';

String iuranCardTitle(String? userName, String periodLabel) {
  final name = userName?.trim().isNotEmpty == true ? userName!.split(' ').first : 'Warga';
  final periodShort = periodLabel.split(' ').first;
  return '$name - $periodShort';
}

class KetuaExpandableIuranCard extends StatelessWidget {
  final IuranRecordModel bill;
  final ProfileModel? warga;
  final RtUnitModel rt;
  final IuranKetuaMode mode;
  final bool expanded;
  final VoidCallback onToggle;
  final VoidCallback onApprove;
  final bool approving;

  const KetuaExpandableIuranCard({
    super.key,
    required this.bill,
    required this.warga,
    required this.rt,
    required this.mode,
    required this.expanded,
    required this.onToggle,
    required this.onApprove,
    this.approving = false,
  });

  @override
  Widget build(BuildContext context) {
    final phone = warga?.phone ?? '';
    final hasPhone = phone.replaceAll(RegExp(r'\D'), '').length >= 9;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: WargaCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: onToggle,
              borderRadius: BorderRadius.circular(12),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            iuranCardTitle(bill.userName, bill.periodLabel),
                            style: WargaBerandaText.sectionTitle().copyWith(fontSize: 16),
                          ),
                          const SizedBox(height: 4),
                          Text(AppTheme.formatRupiah(bill.amount), style: WargaBerandaText.greeting()),
                        ],
                      ),
                    ),
                    StatusChip(
                      label: bill.isPaid ? 'Lunas' : 'Belum bayar',
                      color: bill.isPaid ? WargaBerandaColors.primaryGreen : const Color(0xFFBA7517),
                    ),
                    const SizedBox(width: 4),
                    Icon(
                      expanded ? Icons.keyboard_arrow_up_rounded : Icons.keyboard_arrow_down_rounded,
                      color: WargaBerandaColors.textSecondary,
                    ),
                  ],
                ),
              ),
            ),
            if (expanded && !bill.isPaid) ...[
              const Divider(height: 20),
              if (mode == IuranKetuaMode.verifikasi) ...[
                WargaPrimaryButton(
                  icon: Icons.check_circle_outline_rounded,
                  label: approving ? 'Memproses...' : 'Approve Iuran',
                  onPressed: approving ? null : onApprove,
                ),
                const SizedBox(height: 10),
              ],
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: hasPhone
                      ? () => openWhatsAppTagihan(
                            phone: phone,
                            wargaName: bill.userName ?? 'Warga',
                            periodLabel: bill.periodLabel,
                            amountFormatted: AppTheme.formatRupiah(bill.amount),
                            rtLabel: rt.displayLabel,
                          )
                      : null,
                  icon: const Icon(Icons.chat_rounded, color: Color(0xFF25D366)),
                  label: Text(
                    hasPhone
                        ? 'Mention tagihan ke No. warga'
                        : 'Nomor warga belum diisi',
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF25D366),
                    side: const BorderSide(color: Color(0xFF25D366)),
                  ),
                ),
              ),
              if (mode == IuranKetuaMode.tagih) ...[
                const SizedBox(height: 10),
                WargaPrimaryButton(
                  icon: Icons.check_circle_outline_rounded,
                  label: approving ? 'Memproses...' : 'Approve Iuran',
                  onPressed: approving ? null : onApprove,
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}
