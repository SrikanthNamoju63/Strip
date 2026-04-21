import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';

class HealthReadingsScreen extends StatelessWidget {
  const HealthReadingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Health Readings',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: () {}),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildReadingCard(
              'Heart Rate',
              '72 bpm',
              Icons.favorite,
              Colors.red,
              'Normal',
            ).animate().fadeIn().slideX(),
            const SizedBox(height: 16),
            _buildReadingCard(
              'Blood Oxygen',
              '98%',
              Icons.water_drop,
              Colors.blue,
              'Excellent',
            ).animate().fadeIn(delay: 100.ms).slideX(),
            const SizedBox(height: 16),
            _buildReadingCard(
              'Steps',
              '5,432',
              Icons.directions_walk,
              Colors.orange,
              'Goal: 10,000',
            ).animate().fadeIn(delay: 200.ms).slideX(),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.watch, color: Colors.grey),
                  const SizedBox(width: 10),
                  Text(
                    'Syncing with Smart Watch...',
                    style: GoogleFonts.outfit(color: Colors.grey.shade700),
                  ),
                ],
              ),
            ).animate().fadeIn(delay: 500.ms),
          ],
        ),
      ),
    );
  }

  Widget _buildReadingCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String status,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.outfit(color: Colors.grey.shade500),
                  ),
                  Text(
                    value,
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              status,
              style: GoogleFonts.outfit(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
