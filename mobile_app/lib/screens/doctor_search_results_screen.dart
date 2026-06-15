import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'dart:convert';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'doctor_details_screen.dart';

class DoctorSearchResultsScreen extends StatefulWidget {
  final String location;
  final String query;

  const DoctorSearchResultsScreen({
    super.key,
    required this.location,
    required this.query,
  });

  @override
  State<DoctorSearchResultsScreen> createState() =>
      _DoctorSearchResultsScreenState();
}

class _DoctorSearchResultsScreenState extends State<DoctorSearchResultsScreen> {
  List<dynamic> _doctors = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDoctors();
  }

  Future<void> _fetchDoctors() async {
    try {
      final doctors = await ApiService.searchDoctors(
        widget.location,
        widget.query,
      );
      if (mounted) {
        setState(() {
          _doctors = doctors;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          "Search Results",
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black87),
      ),
      body:
          _isLoading
              ? Center(
                child: ConicLoader(color: Colors.blue.shade600),
              )
              : _error != null
              ? Center(
                child: Text(
                  "Error: $_error",
                  style: GoogleFonts.outfit(color: Colors.red),
                ),
              )
              : _doctors.isEmpty
              ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.search_off,
                      size: 64,
                      color: Colors.grey.shade300,
                    ),
                    SizedBox(height: 16),
                    Text(
                      "No doctors found matching your criteria",
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              )
              : ListView.builder(
                padding: EdgeInsets.all(16),
                itemCount: _doctors.length,
                itemBuilder: (context, index) {
                  final doctor = _doctors[index];
                  return Card(
                    elevation: 2,
                    shadowColor: Colors.black12,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    margin: EdgeInsets.only(bottom: 16),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder:
                                (context) =>
                                    DoctorDetailsScreen(doctor: doctor),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 30,
                              backgroundColor: Colors.blue.shade50,
                              backgroundImage: _getProfileImage(doctor),
                              child:
                                  (doctor['doctorPhoto'] == null ||
                                          doctor['doctorPhoto'].isEmpty)
                                      ? Text(
                                        (doctor['name'] ?? 'D')[0],
                                        style: GoogleFonts.outfit(
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue,
                                        ),
                                      )
                                      : null,
                            ),
                            SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    doctor['name'],
                                    style: GoogleFonts.outfit(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    doctor['specialization'] ?? 'Specialist',
                                    style: GoogleFonts.outfit(
                                      color: Colors.blue.shade600,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.work_outline, size: 14, color: Colors.grey.shade600),
                                      SizedBox(width: 4),
                                      Text(
                                        "${doctor['experience'] ?? 0}+ Yrs",
                                        style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade600),
                                      ),
                                      SizedBox(width: 12),
                                      Icon(Icons.star, size: 14, color: Colors.amber),
                                      SizedBox(width: 4),
                                      Text(
                                        "${doctor['ratings']?['averageRating']?.toStringAsFixed(1) ?? '0.0'}",
                                        style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                  SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.local_hospital_outlined,
                                        size: 14,
                                        color: Colors.grey,
                                      ),
                                      SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          "${doctor['clinicAddress']?['name'] != null ? doctor['clinicAddress']['name'] + ', ' : ''}${doctor['clinicAddress']?['city'] ?? 'Unknown Location'}",
                                          style: GoogleFonts.outfit(
                                            fontSize: 12,
                                            color: Colors.grey,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  "₹${((doctor['consultationFee'] ?? 0) as num).toStringAsFixed(2)}",
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                    color: Colors.blue.shade700,
                                  ),
                                ),
                                SizedBox(height: 12),
                                Container(
                                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    "Book",
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: Colors.blue.shade700,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
  ImageProvider? _getProfileImage(dynamic doctor) {
    String? photoData = doctor['profileImage'] ?? doctor['doctorPhoto'];

    if (photoData != null && photoData.isNotEmpty) {
      if (photoData.startsWith('http')) {
        return NetworkImage(photoData);
      }

      if (photoData.startsWith('uploads/') || photoData.startsWith('/uploads/')) {
        final cleanPath = photoData.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
        return NetworkImage('${ApiService.baseUrl.replaceAll('/api', '')}/$cleanPath');
      }
      
      try {
        String base64String = photoData;
        if (base64String.contains(',')) {
          base64String = base64String.split(',').last;
        }
        return MemoryImage(base64Decode(base64String));
      } catch (e) {
        debugPrint('Error decoding base64 image: $e');
        return null;
      }
    }
    return null;
  }
}
