import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import 'book_appointment_screen.dart';

class DoctorDetailsScreen extends StatefulWidget {
  final Map<String, dynamic> doctor;

  const DoctorDetailsScreen({super.key, required this.doctor});

  @override
  _DoctorDetailsScreenState createState() => _DoctorDetailsScreenState();
}

class _DoctorDetailsScreenState extends State<DoctorDetailsScreen> {
  late Map<String, dynamic> _doctorData;
  StreamSubscription? _socketSubscription;

  @override
  void initState() {
    super.initState();
    _doctorData = Map<String, dynamic>.from(widget.doctor);
    
    _socketSubscription = SocketService().eventStream.listen((event) {
      if (event['event'] == 'doctor_profile_update') {
        final data = event['data'];
        if (data != null && data['doctorId'] == _doctorData['_id']) {
          setState(() {
            if (data['facilities'] != null) {
              _doctorData['facilities'] = data['facilities'];
            }
            if (data['languages'] != null) {
              _doctorData['languages'] = data['languages'];
            }
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _socketSubscription?.cancel();
    super.dispose();
  }

  ImageProvider? _getProfileImage(Map<String, dynamic> doctor) {
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

  @override
  Widget build(BuildContext context) {
    final clinic = _doctorData['clinicAddress'] ?? {};
    final specialization =
        _doctorData['specialization'] ?? 'General Physician';
    final imageProvider = _getProfileImage(_doctorData);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          "Doctor Details",
          style: GoogleFonts.outfit(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: IconThemeData(color: Colors.black),
      ),
      body: ScrollConfiguration(
        behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header Profile
                  Container(
                    alignment: Alignment.center,
                    padding: EdgeInsets.symmetric(vertical: 32, horizontal: 24),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.vertical(
                        bottom: Radius.circular(32),
                      ),
                    ),
                    child: Column(
                      children: [
                        Container(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black12,
                                blurRadius: 10,
                                offset: Offset(0, 5),
                              ),
                            ],
                          ),
                          child: CircleAvatar(
                            radius: 60,
                            backgroundColor: Colors.blue.shade100,
                            backgroundImage: imageProvider,
                            onBackgroundImageError: imageProvider != null ? (_, __) {} : null,
                            child: imageProvider == null
                                  ? Text(
                                    (_doctorData['name'] ?? 'D')[0],
                                    style: TextStyle(
                                      fontSize: 40,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
                                    ),
                                  )
                                  : null,
                          ),
                        ),
                        SizedBox(height: 16),
                        Text(
                          _doctorData['name'],
                          style: GoogleFonts.outfit(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        Text(
                          specialization,
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            color: Colors.blue.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        SizedBox(height: 8),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.star, color: Colors.amber, size: 18),
                              Text(
                                " ${_doctorData['ratings']?['averageRating']?.toStringAsFixed(1) ?? '0.0'} (${_doctorData['ratings']?['totalReviews'] ?? 0} Reviews)",
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // About
                        Text(
                          "About Doctor",
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 8),
                        Text(
                          _doctorData['bio'] ??
                              "Dedicated medical professional with a focus on patient care.",
                          style: GoogleFonts.outfit(
                            color: Colors.grey.shade700,
                            height: 1.5,
                          ),
                        ),
                        SizedBox(height: 24),

                        // Stats Row
                        Row(
                          children: [
                            Expanded(
                              child: _infoCard(
                                Icons.work_outline,
                                "${_doctorData['experience'] ?? 0}+ Years",
                                "Experience",
                              ),
                            ),
                            SizedBox(width: 16),
                            Expanded(
                              child: _infoCard(
                                Icons.people_outline,
                                "${_doctorData['recentPatientCount'] ?? _doctorData['earnings']?['appointmentCount'] ?? 0}+",
                                "Recent Patients",
                              ),
                            ),
                            SizedBox(width: 16),
                            Expanded(
                              child: _infoCard(Icons.star_outline, "${_doctorData['ratings']?['averageRating']?.toStringAsFixed(1) ?? '0.0'}", "Rating"),
                            ),
                          ],
                        ),
                        SizedBox(height: 24),
                        
                        if (_doctorData['genderPreference'] != null && _doctorData['genderPreference'] != 'Both')
                          Container(
                            margin: EdgeInsets.only(bottom: 24),
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.pink.shade50,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.pink.shade100),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.person, color: Colors.pink),
                                SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    "Treats: ${_doctorData['genderPreference']} Patients Only",
                                    style: GoogleFonts.outfit(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.pink.shade800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                        // Clinic Info
                        Text(
                          "Hospital / Clinic Details",
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Card(
                          margin: EdgeInsets.only(top: 12),
                          elevation: 0,
                          color: Colors.grey.shade50,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                            side: BorderSide(color: Colors.grey.shade200),
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.blue.shade100,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Icon(
                                        Icons.local_hospital,
                                        color: Colors.blue,
                                        size: 20,
                                      ),
                                    ),
                                    SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        clinic['name'] ?? 'Clinic Name',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 12),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.location_on_outlined,
                                      size: 18,
                                      color: Colors.grey,
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        "${clinic['street'] != null ? '${clinic['street']}, ' : ''}${clinic['city'] ?? ''}${clinic['state'] != null ? ', ${clinic['state']}' : ''}",
                                        style: GoogleFonts.outfit(
                                          color: Colors.grey.shade700,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        _buildFacilities(_doctorData['facilities']),
                        _buildLanguages(_doctorData['languages'] as List<dynamic>?),
                        _buildImageGallery("Treatment Cases", _doctorData['diseaseImages'] as List<dynamic>?),
                        _buildImageGallery("Clinic Photos", _doctorData['clinicImages'] as List<dynamic>?),
                      ],
                    ),
                  ),
                  
                  // Bottom Booking Button
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 10, 20, 40),
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => BookAppointmentScreen(
                      doctor: _doctorData,
                    ),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 56),
                backgroundColor: Colors.blue.shade700,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Text(
                "Book Appointment",
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
      ),
      ),
    );
  }

  Widget _infoCard(IconData icon, String value, String label) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade100,
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.blue, size: 24),
          SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.outfit(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }
  Widget _buildFacilities(Map<String, dynamic>? facilities) {
    if (facilities == null) return const SizedBox.shrink();
    
    List<Widget> chips = [];
    facilities.forEach((key, value) {
      if (value == true) {
        String label = key.replaceAllMapped(RegExp(r'[A-Z]'), (match) => ' ${match.group(0)}');
        label = label[0].toUpperCase() + label.substring(1);
        chips.add(Chip(
          label: Text(label, style: const TextStyle(fontSize: 12)),
          backgroundColor: Colors.green.shade50,
          labelStyle: TextStyle(color: Colors.green.shade800, fontWeight: FontWeight.bold),
          side: BorderSide(color: Colors.green.shade200),
          avatar: const Icon(Icons.check_circle_outline, color: Colors.green, size: 16),
        ));
      }
    });

    if (chips.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Text("Facilities", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(spacing: 8, runSpacing: 8, children: chips),
      ],
    );
  }

  Widget _buildLanguages(List<dynamic>? languages) {
    if (languages == null || languages.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Text("Languages Spoken", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: languages.map((lang) => Chip(
            label: Text(lang.toString(), style: const TextStyle(fontSize: 12)),
            backgroundColor: Colors.purple.shade50,
            labelStyle: TextStyle(color: Colors.purple.shade800, fontWeight: FontWeight.bold),
            side: BorderSide(color: Colors.purple.shade200),
            avatar: const Icon(Icons.language, color: Colors.purple, size: 16),
          )).toList(),
        ),
      ],
    );
  }

  Widget _buildImageGallery(String title, List<dynamic>? images) {
    if (images == null || images.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: images.length,
            itemBuilder: (context, index) {
              return Container(
                margin: EdgeInsets.only(right: 12),
                width: 120,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  image: DecorationImage(
                    image: NetworkImage(images[index].toString()),
                    fit: BoxFit.cover,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
