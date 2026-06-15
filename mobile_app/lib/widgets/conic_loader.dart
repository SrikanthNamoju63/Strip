import 'dart:math' as math;
import 'package:flutter/material.dart';

class ConicLoader extends StatefulWidget {
  final double size;
  final Color? color;
  final double? strokeWidth;

  const ConicLoader({
    super.key,
    this.size = 50.0,
    this.color,
    this.strokeWidth,
  });

  @override
  State<ConicLoader> createState() => _ConicLoaderState();
}

class _ConicLoaderState extends State<ConicLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = widget.color ?? Theme.of(context).primaryColor;
    return RotationTransition(
      turns: _controller,
      child: CustomPaint(
        size: Size(widget.size, widget.size),
        painter: _ConicLoaderPainter(
          color: themeColor,
          strokeWidth: widget.strokeWidth ?? (widget.size * 0.16),
        ),
      ),
    );
  }
}

class _ConicLoaderPainter extends CustomPainter {
  final Color color;
  final double strokeWidth;

  _ConicLoaderPainter({
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Draw the faded gradient path around the circle.
    // In CSS, it has transparent background 30%, fading to full color.
    final rect = Rect.fromCircle(center: center, radius: radius);
    final paint = Paint()
      ..shader = SweepGradient(
        colors: [
          color.withValues(alpha: 0.0),
          color.withValues(alpha: 0.0),
          color,
        ],
        stops: const [
          0.0,
          0.3,
          1.0,
        ],
        transform: const GradientRotation(-math.pi / 2),
      ).createShader(rect)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;

    canvas.drawCircle(center, radius, paint);

    // Draw a solid circle (representing the radial-gradient top dot in CSS)
    // at the 12 o'clock position (where the gradient finishes with full opacity).
    final dotPaint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    
    canvas.drawCircle(
      Offset(center.dx, center.dy - radius),
      strokeWidth / 2,
      dotPaint,
    );
  }

  @override
  bool shouldRepaint(covariant _ConicLoaderPainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.strokeWidth != strokeWidth;
  }
}
