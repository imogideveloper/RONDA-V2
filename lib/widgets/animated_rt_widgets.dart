import 'package:flutter/material.dart';
import '../config/app_animations.dart';
import '../config/app_theme.dart';

/// Muncul dengan fade + slide naik (untuk list / section).
class FadeSlideIn extends StatefulWidget {
  final Widget child;
  final int index;
  final Duration? delay;
  final Duration duration;
  final Offset slideBegin;

  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.delay,
    this.duration = AppMotion.normal,
    this.slideBegin = const Offset(0, 0.08),
  });

  @override
  State<FadeSlideIn> createState() => _FadeSlideInState();
}

class _FadeSlideInState extends State<FadeSlideIn> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late Animation<Offset> _slide;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration);
    _fade = CurvedAnimation(parent: _controller, curve: AppMotion.enterCurve);
    _slide = Tween<Offset>(begin: widget.slideBegin, end: Offset.zero).animate(_fade);
    final wait = widget.delay ?? AppMotion.staggerDelay(widget.index);
    Future.delayed(wait, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(position: _slide, child: widget.child),
    );
  }
}

/// Efek tekan — scale ringan saat tap (kartu, tombol aksi).
class ScalePress extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double pressedScale;

  const ScalePress({
    super.key,
    required this.child,
    this.onTap,
    this.pressedScale = 0.97,
  });

  @override
  State<ScalePress> createState() => _ScalePressState();
}

class _ScalePressState extends State<ScalePress> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: AppMotion.fast);
    _scale = Tween<double>(begin: 1, end: widget.pressedScale).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _down(TapDownDetails _) {
    if (widget.onTap != null) _controller.forward();
  }

  void _up(TapUpDetails _) {
    _controller.reverse();
    widget.onTap?.call();
  }

  void _cancel() => _controller.reverse();

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: widget.onTap != null ? _down : null,
      onTapUp: widget.onTap != null ? _up : null,
      onTapCancel: widget.onTap != null ? _cancel : null,
      child: ScaleTransition(scale: _scale, child: widget.child),
    );
  }
}

/// Angka yang naik halus (saldo kas, statistik).
class AnimatedCountText extends StatelessWidget {
  final double value;
  final TextStyle style;
  final String Function(double) formatter;
  final Duration duration;

  const AnimatedCountText({
    super.key,
    required this.value,
    required this.style,
    required this.formatter,
    this.duration = const Duration(milliseconds: 900),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: value),
      duration: duration,
      curve: AppMotion.enterCurve,
      builder: (_, v, __) => Text(formatter(v), style: style),
    );
  }
}

/// Blok shimmer untuk skeleton layout.
class ShimmerBlock extends StatefulWidget {
  final double height;
  final double? width;
  final double borderRadius;

  const ShimmerBlock({
    super.key,
    required this.height,
    this.width,
    this.borderRadius = 12,
  });

  @override
  State<ShimmerBlock> createState() => _ShimmerBlockState();
}

class _ShimmerBlockState extends State<ShimmerBlock> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1400))
      ..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, __) {
        final t = _controller.value;
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(widget.borderRadius),
            gradient: LinearGradient(
              begin: Alignment(-1 + t * 2, 0),
              end: Alignment(t * 2, 0),
              colors: [
                const Color(0xFFE5E7EB),
                AppTheme.emeraldMuted.withValues(alpha: 0.85),
                const Color(0xFFE5E7EB),
              ],
              stops: const [0.1, 0.5, 0.9],
            ),
          ),
        );
      },
    );
  }
}

/// Skeleton loading berdenyut.
class PulseLoader extends StatefulWidget {
  final double height;
  final double? width;
  final BorderRadius? borderRadius;

  const PulseLoader({
    super.key,
    this.height = 48,
    this.width,
    this.borderRadius,
  });

  @override
  State<PulseLoader> createState() => _PulseLoaderState();
}

class _PulseLoaderState extends State<PulseLoader> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, __) {
        final t = 0.35 + _controller.value * 0.25;
        return Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            borderRadius: widget.borderRadius ?? BorderRadius.circular(12),
            color: AppTheme.emeraldMuted.withValues(alpha: t),
          ),
        );
      },
    );
  }
}

/// Ilustrasi mengambang lembut.
class FloatingMotion extends StatefulWidget {
  final Widget child;
  final double amplitude;

  const FloatingMotion({super.key, required this.child, this.amplitude = 6});

  @override
  State<FloatingMotion> createState() => _FloatingMotionState();
}

class _FloatingMotionState extends State<FloatingMotion> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _offset;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))
      ..repeat(reverse: true);
    _offset = Tween<double>(begin: -widget.amplitude, end: widget.amplitude).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _offset,
      builder: (_, child) => Transform.translate(offset: Offset(0, _offset.value), child: child),
      child: widget.child,
    );
  }
}

/// Logo / ikon dengan pop saat pertama tampil.
class PopInIcon extends StatefulWidget {
  final Widget child;
  final Duration delay;

  const PopInIcon({super.key, required this.child, this.delay = Duration.zero});

  @override
  State<PopInIcon> createState() => _PopInIconState();
}

class _PopInIconState extends State<PopInIcon> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _scale = Tween<double>(begin: 0.6, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: AppMotion.bounceCurve),
    );
    Future.delayed(widget.delay, () {
      if (mounted) _controller.forward();
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _scale, child: widget.child);
  }
}

/// Bungkus list item dengan stagger otomatis.
class StaggeredList extends StatelessWidget {
  final List<Widget> children;
  final EdgeInsetsGeometry? padding;

  const StaggeredList({super.key, required this.children, this.padding});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding ?? EdgeInsets.zero,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++)
            FadeSlideIn(index: i, child: children[i]),
        ],
      ),
    );
  }
}
