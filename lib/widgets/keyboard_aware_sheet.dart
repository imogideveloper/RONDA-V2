import 'package:flutter/material.dart';

import '../config/smooth_scroll.dart';

/// Durasi mengikuti keyboard sistem (sedikit lebih panjang = terasa lebih halus).
const keyboardSheetPadDuration = Duration(milliseconds: 340);
const keyboardSheetPadCurve = Curves.easeInOutCubic;

/// Interpolasi tinggi keyboard sendiri — tidak mengikuti lompatan [viewInsets] mentah.
class SmoothKeyboardInset extends StatefulWidget {
  final Widget child;

  const SmoothKeyboardInset({super.key, required this.child});

  @override
  State<SmoothKeyboardInset> createState() => _SmoothKeyboardInsetState();
}

class _SmoothKeyboardInsetState extends State<SmoothKeyboardInset>
    with WidgetsBindingObserver, SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  Animation<double>? _insetAnimation;
  double _displayInset = 0;
  double _targetInset = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _controller = AnimationController(vsync: this, duration: keyboardSheetPadDuration)
      ..addListener(() {
        if (mounted) setState(() {});
      });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _animateTo(MediaQuery.viewInsetsOf(context).bottom);
  }

  @override
  void didChangeMetrics() {
    if (!mounted) return;
    _animateTo(MediaQuery.viewInsetsOf(context).bottom);
  }

  void _animateTo(double target) {
    if ((target - _targetInset).abs() < 0.5 && !_controller.isAnimating) return;

    final begin = _controller.isAnimating ? (_insetAnimation?.value ?? _displayInset) : _displayInset;
    _targetInset = target;
    _insetAnimation = Tween<double>(begin: begin, end: target).animate(
      CurvedAnimation(parent: _controller, curve: keyboardSheetPadCurve),
    );
    _controller.forward(from: 0).whenComplete(() {
      if (mounted) {
        setState(() => _displayInset = target);
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  double get _currentInset {
    if (_controller.isAnimating && _insetAnimation != null) {
      return _insetAnimation!.value;
    }
    return _displayInset;
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: _currentInset),
      child: widget.child,
    );
  }
}

/// Bottom sheet: keyboard halus + scroll sheet halus.
class KeyboardAwareSheetBody extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;

  const KeyboardAwareSheetBody({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(24, 16, 24, 24),
  });

  @override
  State<KeyboardAwareSheetBody> createState() => _KeyboardAwareSheetBodyState();
}

class _KeyboardAwareSheetBodyState extends State<KeyboardAwareSheetBody> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  /// Geser perlahan ke field terakhir setelah keyboard selesai naik.
  void _nudgeScrollForFocus() {
    Future.delayed(keyboardSheetPadDuration, () {
      if (!mounted || !_scrollController.hasClients) return;
      final max = _scrollController.position.maxScrollExtent;
      if (max <= 0) return;
      _scrollController.animateTo(
        max,
        duration: keyboardSheetPadDuration,
        curve: keyboardSheetPadCurve,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return SmoothKeyboardInset(
      child: ScrollConfiguration(
        behavior: const SheetScrollBehavior(),
        child: ListView(
          controller: _scrollController,
          shrinkWrap: true,
          physics: AppScroll.sheetPhysics,
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: widget.padding,
          children: [
            _SheetScrollScope(
              onFocusBottomField: _nudgeScrollForFocus,
              child: widget.child,
            ),
          ],
        ),
      ),
    );
  }
}

/// Agar [SheetTextField] bisa memberi tahu sheet untuk scroll halus (bukan lompat instan).
class _SheetScrollScope extends InheritedWidget {
  final VoidCallback onFocusBottomField;

  const _SheetScrollScope({
    required this.onFocusBottomField,
    required super.child,
  });

  static _SheetScrollScope? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<_SheetScrollScope>();
  }

  @override
  bool updateShouldNotify(_SheetScrollScope oldWidget) => false;
}

/// Field di dalam bottom sheet — tanpa [ensureVisible] yang bentrok dengan animasi keyboard.
class SheetTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? labelText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;
  final FocusNode? focusNode;
  final InputDecoration? decoration;
  final TextStyle? style;
  final bool scrollOnFocus;

  const SheetTextField({
    super.key,
    this.controller,
    this.labelText,
    this.keyboardType,
    this.textInputAction,
    this.validator,
    this.onFieldSubmitted,
    this.focusNode,
    this.decoration,
    this.style,
    this.scrollOnFocus = false,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      focusNode: focusNode,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      validator: validator,
      onFieldSubmitted: onFieldSubmitted,
      style: style,
      scrollPadding: EdgeInsets.zero,
      onTap: scrollOnFocus ? () => _SheetScrollScope.of(context)?.onFocusBottomField() : null,
      decoration: decoration ??
          InputDecoration(
            labelText: labelText,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
    );
  }
}
