import 'package:flutter/material.dart';

import 'animated_rt_widgets.dart';
import 'warga_beranda_widgets.dart';

/// Skeleton tab Iuran.
class WargaIuranSkeleton extends StatelessWidget {
  const WargaIuranSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          physics: const NeverScrollableScrollPhysics(),
          children: const [
            ShimmerBlock(height: 28, width: 160, borderRadius: 8),
            SizedBox(height: 8),
            ShimmerBlock(height: 14, width: 220, borderRadius: 6),
            SizedBox(height: 20),
            ShimmerBlock(height: 140, borderRadius: 18),
            SizedBox(height: 16),
            ShimmerBlock(height: 56, borderRadius: 14),
            SizedBox(height: 16),
            ShimmerBlock(height: 120, borderRadius: 14),
            SizedBox(height: 24),
            ShimmerBlock(height: 18, width: 180, borderRadius: 6),
            SizedBox(height: 12),
            ShimmerBlock(height: 72, borderRadius: 14),
            ShimmerBlock(height: 72, borderRadius: 14),
          ],
        ),
      ),
    );
  }
}

/// Skeleton tab Info (pengumuman).
class WargaInfoSkeleton extends StatelessWidget {
  const WargaInfoSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          physics: const NeverScrollableScrollPhysics(),
          children: const [
            ShimmerBlock(height: 28, width: 200, borderRadius: 8),
            SizedBox(height: 8),
            ShimmerBlock(height: 14, width: 240, borderRadius: 6),
            SizedBox(height: 20),
            ShimmerBlock(height: 100, borderRadius: 14),
            SizedBox(height: 10),
            ShimmerBlock(height: 100, borderRadius: 14),
            ShimmerBlock(height: 100, borderRadius: 14),
          ],
        ),
      ),
    );
  }
}

/// Skeleton tab Profil.
class WargaProfilSkeleton extends StatelessWidget {
  const WargaProfilSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: WargaBerandaColors.bgColor,
      child: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          physics: const NeverScrollableScrollPhysics(),
          children: const [
            ShimmerBlock(height: 28, width: 100, borderRadius: 8),
            SizedBox(height: 16),
            ShimmerBlock(height: 120, borderRadius: 18),
            SizedBox(height: 20),
            ShimmerBlock(height: 18, width: 140, borderRadius: 6),
            SizedBox(height: 10),
            ShimmerBlock(height: 72, borderRadius: 14),
            SizedBox(height: 16),
            ShimmerBlock(height: 160, borderRadius: 14),
          ],
        ),
      ),
    );
  }
}
