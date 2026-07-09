import 'package:flutter/material.dart';

import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Skeleton beranda warga — layout baru (aksi bulat + papan info).
class WargaHomeSkeleton extends StatelessWidget {
  const WargaHomeSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          physics: const NeverScrollableScrollPhysics(),
          children: const [
            _HeaderSkeleton(),
            SizedBox(height: 12),
            ShimmerBlock(height: 32, width: 140, borderRadius: 20),
            SizedBox(height: 16),
            ShimmerBlock(height: 128, borderRadius: 20),
            SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: ShimmerBlock(height: 108, borderRadius: 16)),
                SizedBox(width: 12),
                Expanded(child: ShimmerBlock(height: 108, borderRadius: 16)),
              ],
            ),
            SizedBox(height: 24),
            ShimmerBlock(height: 18, width: 120, borderRadius: 8),
            SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                ShimmerBlock(height: 56, width: 56, borderRadius: 16),
                ShimmerBlock(height: 56, width: 56, borderRadius: 16),
                ShimmerBlock(height: 56, width: 56, borderRadius: 16),
                ShimmerBlock(height: 56, width: 56, borderRadius: 16),
              ],
            ),
            SizedBox(height: 12),
            ShimmerBlock(height: 56, borderRadius: 14),
            SizedBox(height: 24),
            ShimmerBlock(height: 18, width: 160, borderRadius: 8),
            SizedBox(height: 12),
            ShimmerBlock(height: 88, borderRadius: 14),
            SizedBox(height: 10),
            ShimmerBlock(height: 88, borderRadius: 14),
          ],
        ),
      ),
    );
  }
}

class _HeaderSkeleton extends StatelessWidget {
  const _HeaderSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        ShimmerBlock(height: 52, width: 52, borderRadius: 26),
        SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ShimmerBlock(height: 12, width: 120, borderRadius: 6),
              SizedBox(height: 8),
              ShimmerBlock(height: 18, width: 180, borderRadius: 6),
              SizedBox(height: 6),
              ShimmerBlock(height: 12, width: 140, borderRadius: 6),
            ],
          ),
        ),
        ShimmerBlock(height: 44, width: 44, borderRadius: 22),
      ],
    );
  }
}
