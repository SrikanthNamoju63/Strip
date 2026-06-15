import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:async';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
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
  bool _isBioExpanded = false;

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
    final specialization = _doctorData['specialization'] ?? 'General Physician';
    final imageProvider = _getProfileImage(_doctorData);

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FD),
      appBar: AppBar(
        centerTitle: true,
        title: Text(
          "Doctor Details",
          style: GoogleFonts.outfit(
            color: const Color(0xFF1E293B),
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFFE8F0FE),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
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
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [const Color(0xFFE8F0FE), const Color(0xFFF3F4FD)],
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                  ),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(36),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade100.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 4),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.blue.shade800.withOpacity(0.15),
                            blurRadius: 12,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: CircleAvatar(
                        radius: 56,
                        backgroundColor: Colors.blue.shade100,
                        backgroundImage: imageProvider,
                        onBackgroundImageError: imageProvider != null ? (_, __) {} : null,
                        child: imageProvider == null
                            ? Text(
                                (_doctorData['name'] ?? 'D')[0],
                                style: GoogleFonts.outfit(
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blue.shade800,
                                ),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _doctorData['name'] ?? '',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      specialization,
                      style: GoogleFonts.outfit(
                        fontSize: 16,
                        color: Colors.blue.shade700,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded, color: Colors.amber, size: 20),
                          const SizedBox(width: 4),
                          Text(
                            "${_doctorData['ratings']?['averageRating']?.toStringAsFixed(1) ?? '0.0'}",
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                          Text(
                            " (${_doctorData['ratings']?['totalReviews'] ?? 0} Reviews)",
                            style: GoogleFonts.outfit(
                              color: Colors.grey.shade600,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ).animate().fadeIn(duration: 350.ms).slideY(begin: 0.08, end: 0),
              ),

              Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stats Cards Row
                    Row(
                      children: [
                        Expanded(
                          child: _infoCard(
                            Icons.work_outline,
                            "${_doctorData['experience'] ?? 0}+ Years",
                            "Experience",
                            Colors.blue,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _infoCard(
                            Icons.people_outline,
                            "${_doctorData['recentPatientCount'] ?? _doctorData['earnings']?['appointmentCount'] ?? 0}+",
                            "Patients",
                            Colors.green,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _infoCard(
                            Icons.star_outline,
                            "${_doctorData['ratings']?['averageRating']?.toStringAsFixed(1) ?? '0.0'}",
                            "Rating",
                            Colors.amber,
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 50.ms, duration: 350.ms).slideY(begin: 0.08, end: 0),
                    const SizedBox(height: 24),
                    
                    if (_doctorData['genderPreference'] != null && _doctorData['genderPreference'] != 'Both')
                      Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.pink.shade50,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.pink.shade100),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.person, color: Colors.pink),
                            const SizedBox(width: 8),
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
                      ).animate().fadeIn(delay: 100.ms),

                    // About Section (Collapsible)
                    Text(
                      "About Doctor",
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final bioText = _doctorData['bio'] ?? "Dedicated medical professional with a focus on patient care.";
                        final canExpand = bioText.length > 180;
                        
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              canExpand && !_isBioExpanded
                                  ? "${bioText.substring(0, 180)}..."
                                  : bioText,
                              style: GoogleFonts.outfit(
                                color: Colors.grey.shade700,
                                fontSize: 14,
                                height: 1.5,
                              ),
                              textAlign: TextAlign.justify,
                            ),
                            if (canExpand)
                              GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _isBioExpanded = !_isBioExpanded;
                                  });
                                },
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 6.0),
                                  child: Text(
                                    _isBioExpanded ? "Read Less" : "Read More",
                                    style: GoogleFonts.outfit(
                                      color: Colors.blue.shade700,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        );
                      },
                    ).animate().fadeIn(delay: 150.ms, duration: 400.ms).slideY(begin: 0.08, end: 0),
                    const SizedBox(height: 24),

                    // Education & Qualifications Section
                    if (_doctorData['education'] != null || _doctorData['educationDetails'] != null) ...[
                      Text(
                        "Education & Qualifications",
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.03),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                          border: Border.all(color: Colors.grey.shade100),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [const Color(0xFF3B82F6), const Color(0xFF1D4ED8)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF1D4ED8).withValues(alpha: 0.15),
                                    blurRadius: 8,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.school_rounded, color: Colors.white, size: 22),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (_doctorData['education'] != null)
                                    Text(
                                      _doctorData['education'],
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Colors.black87,
                                      ),
                                    ),
                                  if (_doctorData['educationDetails'] != null && _doctorData['educationDetails']['college'] != null)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 6.0),
                                      child: Text(
                                        "${_doctorData['educationDetails']['college']} ${_doctorData['educationDetails']['yearOfPassing'] != null ? '(${_doctorData['educationDetails']['yearOfPassing']})' : ''}",
                                        style: GoogleFonts.outfit(
                                          color: Colors.grey.shade600,
                                          fontSize: 13,
                                          height: 1.4,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.08, end: 0),
                      const SizedBox(height: 24),
                    ],

                    // Clinic Info Section
                    Text(
                      "Hospital / Clinic Details",
                      style: GoogleFonts.outfit(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF1E293B),
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.only(top: 12),
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.03),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                        border: Border.all(color: Colors.grey.shade100),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [const Color(0xFF0D9488), const Color(0xFF0F766E)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF0F766E).withValues(alpha: 0.15),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.local_hospital_rounded,
                                  color: Colors.white,
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      clinic['name'] ?? 'Clinic Name',
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Colors.black87,
                                      ),
                                    ),
                                    if (_doctorData['practiceType'] != null && _doctorData['practiceType'].toString().isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: Colors.teal.shade50,
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Icon(
                                              Icons.domain_rounded,
                                              size: 12,
                                              color: Colors.teal.shade700,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              _doctorData['practiceType'].toString().toUpperCase(),
                                              style: GoogleFonts.outfit(
                                                color: Colors.teal.shade700,
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                letterSpacing: 0.5,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const Divider(height: 1, color: Color(0xFFF1F5F9)),
                          const SizedBox(height: 16),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: Colors.red.shade50,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.place_rounded,
                                  size: 16,
                                  color: Colors.red.shade600,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      "${clinic['street'] != null ? '${clinic['street']}, ' : ''}${clinic['city'] ?? ''}${clinic['state'] != null ? ', ${clinic['state']}' : ''}",
                                      style: GoogleFonts.outfit(
                                        color: Colors.grey.shade700,
                                        fontSize: 13,
                                        height: 1.4,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    if (clinic['landmark'] != null && clinic['landmark'].toString().isNotEmpty) ...[
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          Icon(Icons.explore_rounded, size: 14, color: Colors.teal.shade600),
                                          const SizedBox(width: 6),
                                          Expanded(
                                            child: Text(
                                              "Landmark: ${clinic['landmark']}",
                                              style: GoogleFonts.outfit(
                                                color: Colors.grey.shade600,
                                                fontSize: 12,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                    if (clinic['pincode'] != null && clinic['pincode'].toString().isNotEmpty) ...[
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Icon(Icons.pin_drop_rounded, size: 14, color: Colors.teal.shade600),
                                          const SizedBox(width: 6),
                                          Text(
                                            "Pincode: ${clinic['pincode']}",
                                            style: GoogleFonts.outfit(
                                              color: Colors.grey.shade600,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 250.ms, duration: 400.ms).slideY(begin: 0.08, end: 0),
                    
                    _buildConsultationModes(_doctorData['consultationModes'] as List<dynamic>?),
                    _buildFacilities(_doctorData['facilities']),
                    _buildLanguages(_doctorData['languages'] as List<dynamic>?),
                    _buildTimings(_doctorData['weeklyAvailability'] as List<dynamic>?),
                    _buildImageGallery("Treatment Cases", _doctorData['diseaseImages'] as List<dynamic>?),
                    _buildImageGallery("Clinic Photos", _doctorData['clinicImages'] as List<dynamic>?),
                  ],
                ),
              ),
              
              // Bottom Booking Button Section
              Container(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          "Consultation Fee",
                          style: GoogleFonts.outfit(
                            color: Colors.grey.shade500,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          "₹${((_doctorData['consultationFee'] ?? 0) as num).toStringAsFixed(2)}",
                          style: GoogleFonts.outfit(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade700,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 24),
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          gradient: LinearGradient(
                            colors: [Colors.blue.shade600, Colors.blue.shade800],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blue.shade800.withOpacity(0.25),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
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
                            minimumSize: const Size(double.infinity, 56),
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: Text(
                            "Book Appointment",
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoCard(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.12), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.outfit(
              color: Colors.grey.shade500,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
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
        chips.add(Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle_outline, color: Colors.green.shade700, size: 16),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.outfit(
                  color: Colors.green.shade800,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
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
          children: languages.map((lang) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.purple.shade50,
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.language, color: Colors.purple.shade700, size: 16),
                const SizedBox(width: 6),
                Text(
                  lang.toString(),
                  style: GoogleFonts.outfit(
                    color: Colors.purple.shade800,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          )).toList(),
        ),
      ],
    );
  }

  Widget _buildConsultationModes(List<dynamic>? modes) {
    if (modes == null || modes.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Text("Consultation Modes", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: modes.map((mode) {
            String label = mode.toString().replaceAll('_', ' ');
            label = label.split(' ').map((word) => word[0].toUpperCase() + word.substring(1).toLowerCase()).join(' ');
            
            bool isVideo = mode.toString().contains('VIDEO');
            Color color = isVideo ? Colors.orange : Colors.teal;
            
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isVideo ? Icons.videocam : Icons.person,
                    color: color,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    label,
                    style: GoogleFonts.outfit(
                      color: color,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTimings(List<dynamic>? schedule) {
    if (schedule == null || schedule.isEmpty) return const SizedBox.shrink();

    List<Widget> dayRows = [];
    for (var dayObj in schedule) {
      if (dayObj is Map) {
        String day = dayObj['day'] ?? '';
        bool isOff = dayObj['isOff'] ?? false;
        String start = dayObj['startTime'] ?? '';
        String end = dayObj['endTime'] ?? '';

        dayRows.add(
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 6.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  day,
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    fontSize: 14,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: isOff ? Colors.red.shade50 : Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    isOff ? "Closed" : "$start - $end",
                    style: GoogleFonts.outfit(
                      color: isOff ? Colors.red.shade700 : Colors.blue.shade700,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          )
        );
      }
    }

    if (dayRows.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        Text("Clinic Timings", style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: dayRows,
          ),
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
        Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1E293B),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: images.length,
            itemBuilder: (context, index) {
              final imgUrl = images[index].toString();
              ImageProvider imageProvider;
              if (imgUrl.startsWith('http')) {
                imageProvider = NetworkImage(imgUrl);
              } else if (imgUrl.startsWith('uploads/') || imgUrl.startsWith('/uploads/')) {
                final cleanPath = imgUrl.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
                imageProvider = NetworkImage('${ApiService.baseUrl.replaceAll('/api', '')}/$cleanPath');
              } else {
                try {
                  String base64String = imgUrl;
                  if (base64String.contains(',')) {
                    base64String = base64String.split(',').last;
                  }
                  imageProvider = MemoryImage(base64Decode(base64String));
                } catch (e) {
                  imageProvider = const AssetImage('assets/placeholder.png');
                }
              }

              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => FullScreenImageViewer(
                        images: images,
                        initialIndex: index,
                        galleryTitle: title,
                      ),
                    ),
                  );
                },
                child: Container(
                  margin: const EdgeInsets.only(right: 12),
                  width: 120,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Hero(
                      tag: "${title}_$index",
                      child: Image(
                        image: imageProvider,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey.shade100,
                            child: Icon(Icons.broken_image, color: Colors.grey.shade400),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class FullScreenImageViewer extends StatefulWidget {
  final List<dynamic> images;
  final int initialIndex;
  final String galleryTitle;

  const FullScreenImageViewer({
    super.key,
    required this.images,
    required this.initialIndex,
    required this.galleryTitle,
  });

  @override
  State<FullScreenImageViewer> createState() => _FullScreenImageViewerState();
}

class _FullScreenImageViewerState extends State<FullScreenImageViewer> {
  late PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  ImageProvider _getImageProvider(String imgUrl) {
    if (imgUrl.startsWith('http')) {
      return NetworkImage(imgUrl);
    } else if (imgUrl.startsWith('uploads/') || imgUrl.startsWith('/uploads/')) {
      final cleanPath = imgUrl.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
      return NetworkImage('${ApiService.baseUrl.replaceAll('/api', '')}/$cleanPath');
    } else {
      try {
        String base64String = imgUrl;
        if (base64String.contains(',')) {
          base64String = base64String.split(',').last;
        }
        return MemoryImage(base64Decode(base64String));
      } catch (e) {
        return const AssetImage('assets/placeholder.png');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Fullscreen PageView for sliding images
          PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            onPageChanged: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            itemBuilder: (context, index) {
              final imgUrl = widget.images[index].toString();
              return InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: Hero(
                    tag: "${widget.galleryTitle}_$index",
                    child: Image(
                      image: _getImageProvider(imgUrl),
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.grey.shade900,
                          child: const Icon(Icons.broken_image, color: Colors.white54, size: 64),
                        );
                      },
                    ),
                  ),
                ),
              );
            },
          ),
          
          // Top Left close button
          Positioned(
            top: MediaQuery.of(context).padding.top + 10,
            left: 16,
            child: GestureDetector(
              onTap: () => Navigator.pop(context),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.close_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
          
          // Image index indicator at the bottom
          Positioned(
            bottom: MediaQuery.of(context).padding.bottom + 20,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  "${_currentIndex + 1} / ${widget.images.length}",
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
