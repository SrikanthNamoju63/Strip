import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'doctor_search_results_screen.dart';

class FindDoctorScreen extends StatefulWidget {
  const FindDoctorScreen({super.key});

  @override
  _FindDoctorScreenState createState() => _FindDoctorScreenState();
}

class _FindDoctorScreenState extends State<FindDoctorScreen> {
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _queryController = TextEditingController();

  void _navigateToResults() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder:
            (context) => DoctorSearchResultsScreen(
              location: _locationController.text,
              query: _queryController.text,
            ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "Find a Doctor",
          style: GoogleFonts.outfit(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                "Search for \nBest Doctors",
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade900,
                  height: 1.2,
                ),
              ).animate().fadeIn().slideY(begin: -0.2),
              SizedBox(height: 32),

              // Location Field
              TextField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: "Location (City, Pincode)",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: Icon(Icons.location_on_outlined),
                ),
              ).animate().fadeIn(delay: 200.ms).slideX(),

              SizedBox(height: 16),

              // Query Field
              TextField(
                controller: _queryController,
                decoration: InputDecoration(
                  labelText: "Looking for (Specialization, Symptom)",
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: Icon(Icons.search),
                ),
              ).animate().fadeIn(delay: 300.ms).slideX(),

              Spacer(),

              // Search Button at Bottom
              ElevatedButton(
                onPressed: _navigateToResults,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade600,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  minimumSize: Size(
                    double.infinity,
                    56,
                  ), // Full width, tall button
                ),
                child: Text(
                  "Search Doctors",
                  style: GoogleFonts.outfit(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ).animate().fadeIn(delay: 400.ms).scale(),
            ],
          ),
        ),
      ),
    );
  }
}
