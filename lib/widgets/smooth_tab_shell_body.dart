import 'package:flutter/material.dart';

import '../config/app_animations.dart';

/// Isi shell tab bawah: simpan state semua tab ([IndexedStack]) + transisi halus saat ganti tab.
class SmoothTabShellBody extends StatefulWidget {
  final int index;
  final List<Widget> children;

  const SmoothTabShellBody({
    super.key,
    required this.index,
    required this.children,
  });

  @override
  State<SmoothTabShellBody> createState() => _SmoothTabShellBodyState();
}

class _SmoothTabShellBodyState extends State<SmoothTabShellBody> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fade;
  late int _displayIndex;
  int _slideDirection = 0;

  @override
  void initState() {
    super.initState();
    _displayIndex = widget.index;
    _controller = AnimationController(vsync: this, duration: AppMotion.normal);
    _fade = CurvedAnimation(parent: _controller, curve: AppMotion.enterCurve);
    _controller.value = 1;
  }

  @override
  void didUpdateWidget(SmoothTabShellBody oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.index != oldWidget.index && widget.index != _displayIndex) {
      _slideDirection = widget.index > _displayIndex ? 1 : -1;
      _transitionTo(widget.index);
    }
  }

  Future<void> _transitionTo(int newIndex) async {
    _controller.stop();
    await _controller.animateTo(0, duration: const Duration(milliseconds: 180), curve: AppMotion.exitCurve);
    if (!mounted) return;
    setState(() => _displayIndex = newIndex);
    await _controller.animateTo(1, duration: AppMotion.normal, curve: AppMotion.enterCurve);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final slideBegin = Offset(0.02 * _slideDirection, 0.01);
    return FadeTransition(
      opacity: _fade,
      child: SlideTransition(
        position: Tween<Offset>(begin: slideBegin, end: Offset.zero).animate(_fade),
        child: IndexedStack(
          index: _displayIndex.clamp(0, widget.children.length - 1),
          sizing: StackFit.expand,
          children: widget.children,
        ),
      ),
    );
  }
}
