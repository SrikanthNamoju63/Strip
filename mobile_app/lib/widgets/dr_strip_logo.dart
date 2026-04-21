import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DrStripLogo extends StatelessWidget {
  final double fontSize;
  final double starSize;
  final bool animateWriting;
  
  const DrStripLogo({
    super.key, 
    this.fontSize = 40,
    this.starSize = 50,
    this.animateWriting = false,
  });

  @override
  Widget build(BuildContext context) {
    // Colors derived from the image analysis
    final Color darkBlue = const Color(0xFF003366); // "Dr" and Star color
    final Color tealCyan = const Color(0xFF009999); // "Strip" color

    final style = GoogleFonts.outfit(
      fontSize: fontSize,
      fontWeight: FontWeight.bold,
      height: 1.0,
    );

    List<Widget> letters = [];

    // "Dr"
    letters.add(Text('D', style: style.copyWith(color: darkBlue)));
    letters.add(Text('r', style: style.copyWith(color: darkBlue)));
    
    // Space
    letters.add(SizedBox(width: fontSize * 0.2));

    // "Strip"
    letters.add(Text('S', style: style.copyWith(color: tealCyan)));
    letters.add(Text('t', style: style.copyWith(color: tealCyan)));
    letters.add(Text('r', style: style.copyWith(color: tealCyan)));
    letters.add(Text('i', style: style.copyWith(color: tealCyan)));
    letters.add(Text('p', style: style.copyWith(color: tealCyan)));

    // Apply animation if requested
    if (animateWriting) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: letters.animate(interval: 150.ms).fadeIn(duration: 300.ms).slideX(begin: -0.2, end: 0, duration: 300.ms),
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: letters,
    );
  }
}
