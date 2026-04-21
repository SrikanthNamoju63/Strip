import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'appointment_history_screen.dart';
import 'reschedule_appointment_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();

  Map<String, dynamic>? _userProfile;
  List<dynamic> _appointments = [];
  List<dynamic> _pastAppointments = [];
  List<dynamic> _donations = [];
  bool _isLoading = true;
  String? _localImagePath; // For immediate preview

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final profile = await _apiService.getUserProfile();
      final appointments = await _apiService.getUserAppointments();
      final donations = await _apiService.getDonationHistory();

      if (mounted) {
        setState(() {
          _userProfile = profile;

          // Split appointments into Active and Past
          final allAppointments = appointments;
          _appointments =
              allAppointments
                  .where(
                    (a) =>
                        a['status'] != 'COMPLETED' &&
                        a['status'] != 'CANCELLED',
                  )
                  .toList();
          _pastAppointments =
              allAppointments
                  .where(
                    (a) =>
                        a['status'] == 'COMPLETED' ||
                        a['status'] == 'CANCELLED',
                  )
                  .toList();

          _donations = donations;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _uploadImage() async {
    try {
      final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _localImagePath = image.path;
        });

        final serverPath = await _apiService.uploadProfileImage(
          File(image.path),
        );
        if (serverPath != null) {
          _fetchData();
        } else {
          if (mounted) {
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(const SnackBar(content: Text('Upload failed')));
          }
        }
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _openEditProfile() {
    // ... (Keep existing simple editor logic or expand later)
    // For brevity, keeping just the height/weight update logic here
    // or we can reuse the previous one.
    final heightController = TextEditingController(
      text: _userProfile?['height']?.toString() ?? '',
    );
    final weightController = TextEditingController(
      text: _userProfile?['weight']?.toString() ?? '',
    );
    String? selectedGender = _userProfile?['gender'];

    DateTime? selectedDate =
        _userProfile?['dob'] != null
            ? DateTime.parse(_userProfile!['dob'])
            : null;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (ctx) => StatefulBuilder(
            builder: (BuildContext context, StateSetter setModalState) {
              return Padding(
                padding: EdgeInsets.only(
                  bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
                  top: 20,
                  left: 20,
                  right: 20,
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Edit Profile',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),

                    // DOB Picker
                    InkWell(
                      onTap: () async {
                        final DateTime? picked = await showDatePicker(
                          context: ctx,
                          initialDate: selectedDate ?? DateTime.now(),
                          firstDate: DateTime(1900),
                          lastDate: DateTime.now(),
                        );
                        if (picked != null) {
                          setModalState(() {
                            selectedDate = picked;
                          });
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 16,
                        ),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              selectedDate != null
                                  ? 'DOB: ${DateFormat('dd MMM yyyy').format(selectedDate!)}'
                                  : 'Select Date of Birth',
                              style: GoogleFonts.outfit(fontSize: 16),
                            ),
                            const Icon(
                              Icons.calendar_today,
                              color: Colors.grey,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    DropdownButtonFormField<String>(
                      value: selectedGender,
                      decoration: InputDecoration(
                        labelText: 'Gender',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      items:
                          ['Male', 'Female', 'Other']
                              .map(
                                (g) =>
                                    DropdownMenuItem(value: g, child: Text(g)),
                              )
                              .toList(),
                      onChanged: (v) => selectedGender = v,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: heightController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Height (cm)',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: TextField(
                            controller: weightController,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'Weight (kg)',
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () async {
                        final height = double.tryParse(heightController.text);
                        final weight = double.tryParse(weightController.text);

                        Map<String, dynamic> updateData = {
                          'gender': selectedGender,
                          'height': height,
                          'weight': weight,
                        };

                        if (selectedDate != null) {
                          updateData['dob'] = selectedDate!.toIso8601String();
                          updateData['age'] =
                              DateTime.now().year - selectedDate!.year;
                        }

                        await _apiService.updateUserProfile(updateData);

                        if (mounted) {
                          Navigator.pop(ctx);
                          await _fetchData();
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Save Changes'),
                    ),
                  ],
                ),
              );
            },
          ),
    );
  }

  Future<void> _handleLogout() async {
    await _apiService.logout();
    if (mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  ImageProvider? _getAvatarImage() {
    if (_localImagePath != null) {
      return FileImage(File(_localImagePath!));
    }
    if (_userProfile?['profileImage'] != null) {
      String path = _userProfile!['profileImage'];
      final cleanPath = path.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
      return NetworkImage(
        '${ApiService.baseUrl.replaceAll('/api', '')}/$cleanPath',
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'My Profile',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            onPressed: _openEditProfile,
          ),
        ],
      ),
      body:
          _isLoading
              ? const Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                onRefresh: _fetchData,
                child: SingleChildScrollView(
                  physics:
                      const AlwaysScrollableScrollPhysics(), // Ensure scroll works even if content is short
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    children: [
                      // Avatar with Edit Overlay
                      GestureDetector(
                        onTap: _uploadImage,
                        child: Stack(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.blue.shade100,
                                  width: 2,
                                ),
                              ),
                              child: CircleAvatar(
                                radius: 60,
                                backgroundColor: Colors.blue.shade50,
                                backgroundImage: _getAvatarImage(),
                                child:
                                    _getAvatarImage() == null
                                        ? Text(
                                          (_userProfile?['name'] ?? 'U')
                                              .substring(0, 1)
                                              .toUpperCase(),
                                          style: GoogleFonts.outfit(
                                            fontSize: 40,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                          ),
                                        )
                                        : null,
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.blue,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 2,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().scale(),

                      const SizedBox(height: 16),
                      Text(
                        _userProfile?['name'] ?? 'User Name',
                        style: GoogleFonts.outfit(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        _userProfile?['email'] ?? 'email@example.com',
                        style: GoogleFonts.outfit(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Detailed Info Section
                      _buildSectionHeader('Personal Details'),
                      _buildDetailRow(
                        Icons.person_outline,
                        'Age',
                        _userProfile?['age']?.toString() ??
                            _calculateAge(_userProfile?['dob']),
                      ),
                      _buildDetailRow(
                        Icons.male,
                        'Gender',
                        _userProfile?['gender'] ?? 'Not Set',
                      ),
                      _buildDetailRow(
                        Icons.phone_outlined,
                        'Phone',
                        _userProfile?['phone'] ?? 'N/A',
                      ),
                      _buildDetailRow(
                        Icons.cake_outlined,
                        'DOB',
                        _formatDate(_userProfile?['dob']),
                      ),

                      const SizedBox(height: 24),
                      _buildSectionHeader('Body Vitals'),
                      Row(
                        children: [
                          Expanded(
                            child: _buildInfoCard(
                              Icons.height,
                              'Height',
                              '${_userProfile?['height'] ?? '-'} cm',
                              Colors.orange,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildInfoCard(
                              Icons.monitor_weight_outlined,
                              'Weight',
                              '${_userProfile?['weight'] ?? '-'} kg',
                              Colors.green,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),

                      const SizedBox(height: 24),
                      // Appointments Header with History Button
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Appointments',
                            style: GoogleFonts.outfit(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          TextButton.icon(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder:
                                      (context) => AppointmentHistoryScreen(
                                        initialAppointments: _pastAppointments,
                                      ),
                                ),
                              );
                            },
                            icon: const Icon(Icons.history, size: 16),
                            label: const Text('History'),
                            style: TextButton.styleFrom(
                              foregroundColor: Colors.blue,
                              textStyle: GoogleFonts.outfit(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (_appointments.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Text('No active appointments'),
                        )
                      else
                        ..._appointments.map(
                          (appt) => _buildAppointmentCard(appt),
                        ),

                      const SizedBox(height: 24),
                      _buildSectionHeader('Blood Donation History'),
                      if (_donations.isEmpty)
                        const Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Text('No donation history found'),
                        )
                      else
                        ..._donations.map((d) => _buildDonationCard(d)),

                      const SizedBox(height: 40),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: _handleLogout,
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            foregroundColor: Colors.red.shade600,
                            side: BorderSide(color: Colors.red.shade200),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          icon: const Icon(Icons.logout),
                          label: const Text('Logout'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          title,
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: Colors.grey.shade600),
          ),
          const SizedBox(width: 16),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 16,
              color: Colors.grey.shade600,
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              color: Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppointmentCard(dynamic appt) {
    final date =
        appt['appointmentDate'] != null
            ? DateFormat(
              'MMM dd, yyyy',
            ).format(DateTime.parse(appt['appointmentDate']))
            : 'Unknown';
    final token = appt['tokenNumber']?.toString() ?? '-';
    final doctorName =
        appt['doctorId'] is Map ? appt['doctorId']['name'] : 'Doctor';

    return InkWell(
      onTap: () => _showAppointmentDetails(appt),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.blue.shade100),
          boxShadow: [
            BoxShadow(
              color: Colors.blue.shade50,
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Token Box
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Token",
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      color: Colors.blue.shade800,
                    ),
                  ),
                  Text(
                    token,
                    style: GoogleFonts.outfit(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.blue.shade900,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctorName,
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Text(
                    '$date • ${appt['appointmentTime']}',
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      color: Colors.grey.shade700,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color:
                    appt['status'] == 'COMPLETED'
                        ? Colors.green.shade50
                        : Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                appt['status'] ?? 'BOOKED',
                style: GoogleFonts.outfit(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color:
                      appt['status'] == 'COMPLETED'
                          ? Colors.green
                          : Colors.orange,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showAppointmentDetails(dynamic appt) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (ctx) => DraggableScrollableSheet(
            initialChildSize: 0.7,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) {
              return SingleChildScrollView(
                controller: scrollController,
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      "Appointment Ticket",
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // QR Code
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.grey.shade200),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          QrImageView(
                            data: appt['_id'] ?? 'Unknown',
                            version: QrVersions.auto,
                            size: 200.0,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "Scan at clinic",
                            style: GoogleFonts.outfit(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),
                    _buildTicketRow(
                      "Token Number",
                      "#${appt['tokenNumber'] ?? '-'}",
                      true,
                    ),
                    const Divider(),
                    _buildTicketRow(
                      "Doctor",
                      appt['doctorId'] is Map
                          ? appt['doctorId']['name']
                          : 'N/A',
                      false,
                    ),
                    _buildTicketRow(
                      "Date",
                      appt['appointmentDate']?.toString().split('T')[0] ?? '-',
                      false,
                    ),
                    _buildTicketRow(
                      "Time",
                      appt['appointmentTime'] ?? '-',
                      false,
                    ),
                    const Divider(),
                    _buildTicketRow(
                      "Consultation Fee",
                      "₹${appt['paymentStatus'] == 'COMPLETED' ? (appt['consultationFee'] ?? 0) : (appt['fee'] ?? 0)}", // Show actual fee logic
                      false,
                    ),
                    _buildTicketRow(
                      "Total Paid",
                      "₹${appt['paymentId'] is Map ? (appt['paymentId']['totalAmount'] ?? '-') : '-'}",
                      false,
                    ),
                    _buildTicketRow(
                      "Payment ID",
                      appt['paymentId'] is Map
                          ? (appt['paymentId']['_id'] ?? '-')
                          : (appt['paymentId'] ?? '-'),
                      false,
                    ),
                    _buildTicketRow("Status", appt['status'] ?? 'BOOKED', true),

                    if (appt['status'] == 'CANCELLED' ||
                        appt['status'] == 'REFUNDED') ...[
                      const Divider(color: Colors.red),
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          "Refund Details",
                          style: GoogleFonts.outfit(
                            fontWeight: FontWeight.bold,
                            color: Colors.red,
                          ),
                        ),
                      ),
                      _buildTicketRow(
                        "Refund Status",
                        appt['paymentId'] is Map
                            ? (appt['paymentId']['paymentStatus'] == 'REFUNDED'
                                ? 'Processed'
                                : 'Pending')
                            : 'Pending',
                        false,
                      ),
                      _buildTicketRow(
                        "Refund Amount",
                        appt['paymentId'] is Map
                            ? "₹${appt['paymentId']['refundAmount'] ?? appt['paymentId']['totalAmount'] ?? 0}"
                            : "-",
                        false,
                      ),
                    ],

                    const SizedBox(height: 24),

                    const SizedBox(height: 24),
                    // Action Buttons
                    if (appt['status'] != 'CANCELLED' &&
                        appt['status'] != 'COMPLETED')
                      Builder(
                        builder: (context) {
                          // Rule Check Logic
                          final status = appt['status'];
                          final isCheckedIn = status == 'CHECKED_IN';

                          // Reschedule Checks
                          final rescheduleCount = appt['rescheduledCount'] ?? 0;
                          final maxReschedules = 1;
                          final canRescheduleCount =
                              rescheduleCount < maxReschedules;

                          // Time Check (2 hours)
                          bool isTimeValid = true;
                          if (appt['appointmentDate'] != null &&
                              appt['appointmentTime'] != null) {
                            try {
                              final datePart =
                                  appt['appointmentDate'].toString().split(
                                    'T',
                                  )[0];
                              final timePart = appt['appointmentTime'];
                              final appointmentDateTime = DateTime.parse(
                                "$datePart $timePart",
                              );
                              final diff = appointmentDateTime.difference(
                                DateTime.now(),
                              );
                              if (diff.inMinutes < 120) {
                                isTimeValid = false;
                              }
                            } catch (e) {}
                          }

                          final canReschedule =
                              !isCheckedIn && canRescheduleCount && isTimeValid;

                          return Column(
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceEvenly,
                                children: [
                                  _buildActionButton(
                                    icon: Icons.directions,
                                    label: "Directions",
                                    color: Colors.blue,
                                    onTap: () async {
                                      // Launch Maps
                                      final doctor = appt['doctorId'];
                                      if (doctor is Map &&
                                          doctor['clinicAddress'] != null) {
                                        final coords =
                                            doctor['clinicAddress']['coordinates'];
                                        if (coords != null &&
                                            coords is List &&
                                            coords.length == 2) {
                                          final lat = coords[1];
                                          final lng = coords[0];
                                          final uri = Uri.parse(
                                            'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
                                          );
                                          if (await canLaunchUrl(uri)) {
                                            await launchUrl(
                                              uri,
                                              mode:
                                                  LaunchMode
                                                      .externalApplication,
                                            );
                                          } else {
                                            if (mounted) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                SnackBar(
                                                  content: Text(
                                                    'Could not launch maps',
                                                  ),
                                                ),
                                              );
                                            }
                                          }
                                        }
                                      }
                                    },
                                  ),

                                  // RESCHEDULE BUTTON
                                  Opacity(
                                    opacity: canReschedule ? 1.0 : 0.5,
                                    child: _buildActionButton(
                                      icon: Icons.calendar_month_outlined,
                                      label: "Reschedule",
                                      color: Colors.orange,
                                      onTap: () {
                                        if (!canReschedule) {
                                          String msg = "Cannot reschedule.";
                                          if (isCheckedIn) {
                                            msg = "Already checked-in.";
                                          } else if (!canRescheduleCount) {
                                            msg =
                                                "Reschedule limit reached (Max 1).";
                                          } else if (!isTimeValid) {
                                            msg =
                                                "Only allowed before 2 hours.";
                                          }
                                          ScaffoldMessenger.of(
                                            ctx,
                                          ).showSnackBar(
                                            SnackBar(content: Text(msg)),
                                          );
                                          return;
                                        }
                                        Navigator.pop(ctx);
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder:
                                                (context) =>
                                                    RescheduleAppointmentScreen(
                                                      appointment: appt,
                                                    ),
                                          ),
                                        );
                                      },
                                    ),
                                  ),

                                  // CANCEL BUTTON
                                  Opacity(
                                    opacity: !isCheckedIn ? 1.0 : 0.5,
                                    child: _buildActionButton(
                                      icon: Icons.cancel_outlined,
                                      label: "Cancel",
                                      color: Colors.red,
                                      onTap: () {
                                        if (isCheckedIn) {
                                          ScaffoldMessenger.of(
                                            ctx,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                "Cannot cancel checked-in appointment.",
                                              ),
                                            ),
                                          );
                                          return;
                                        }
                                        _showCancelDialog(
                                          ctx,
                                          appt['_id'],
                                          appt,
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                              if (!canReschedule && !isCheckedIn)
                                Padding(
                                  padding: const EdgeInsets.only(top: 8.0),
                                  child: Text(
                                    !canRescheduleCount
                                        ? "Max reschedules reached"
                                        : "Reschedule only allowed before 2 hours",
                                    style: GoogleFonts.outfit(
                                      color: Colors.red,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                            ],
                          );
                        },
                      ),

                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(ctx),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue.shade800,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          "Close",
                          style: TextStyle(color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
    );
  }

  void _showCancelDialog(BuildContext ctx, String appointmentId, dynamic appt) {
    TextEditingController reasonController = TextEditingController();

    // Calculate refund info for display
    String refundMsg = "Refunding based on policy.";
    int refundPercent = 0;
    if ((appt['rescheduledCount'] ?? 0) > 0) {
      refundPercent = 0;
      refundMsg = "Refund Forfeited: Rescheduled Appointment";
    } else if (appt['appointmentDate'] != null &&
        appt['appointmentTime'] != null) {
      try {
        final datePart = appt['appointmentDate'].toString().split('T')[0];
        final timePart = appt['appointmentTime'];
        final appointmentDateTime = DateTime.parse("$datePart $timePart");
        final diff = appointmentDateTime.difference(DateTime.now());
        final hours = diff.inMinutes / 60.0;

        if (hours >= 6) {
          refundPercent = 100;
        } else if (hours >= 2) {
          refundPercent = 50;
        } else {
          refundPercent = 0;
        }

        if (refundPercent == 0) {
          refundMsg = "Checking cancel policy (likely 0% refund).";
        } else {
          refundMsg = "Estimated Refund: $refundPercent% of Consultation Fee.";
        }
      } catch (e) {}
    }

    showDialog(
      context: ctx,
      builder:
          (context) => AlertDialog(
            title: Text("Cancel Appointment"),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Are you sure you want to cancel?"),
                SizedBox(height: 8),
                Text(
                  refundMsg,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: refundPercent > 0 ? Colors.green : Colors.red,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  "Note: Platform fees are non-refundable.",
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                ),
                SizedBox(height: 16),
                TextField(
                  controller: reasonController,
                  decoration: InputDecoration(
                    labelText: "Reason",
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text("Back"),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                onPressed: () async {
                  Navigator.pop(context); // Close Dialog

                  // Close Sheet as well to prevent stale state
                  if (Navigator.canPop(ctx)) Navigator.pop(ctx);

                  // Show loading indicator overlay or simple snackbar
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text("Processing...")));

                  final result = await _apiService.cancelAppointment(
                    appointmentId,
                    reasonController.text,
                  );
                  if (result != null) {
                    _fetchData(); // Refresh list
                    // Show refund details from server response
                    final rAmount = result['refundAmount'] ?? 0;
                    final rPercent = result['refundPercent'] ?? 0;
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            "Cancelled. Refund: ₹$rAmount ($rPercent%)",
                          ),
                        ),
                      );
                    }
                  } else {
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text("Failed to cancel or Server Error"),
                        ),
                      );
                    }
                  }
                },
                child: Text("Confirm Cancel"),
              ),
            ],
          ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Colors.grey.shade800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTicketRow(String label, String value, bool highlight) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(color: Colors.grey.shade600)),
          Text(
            value,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              fontSize: highlight ? 18 : 16,
              color: highlight ? Colors.blue.shade900 : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDonationCard(dynamic donation) {
    final date =
        donation['donationDate'] != null
            ? DateFormat(
              'MMM dd, yyyy',
            ).format(DateTime.parse(donation['donationDate']))
            : 'Unknown';
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.red.shade50,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.bloodtype, color: Colors.red, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Blood Donation',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                ),
                Text(
                  '$date • ${donation['units']} Unit(s)',
                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
                ),
                if (donation['location'] != null)
                  Text(
                    donation['location'],
                    style: GoogleFonts.outfit(
                      fontSize: 10,
                      color: Colors.grey.shade400,
                    ),
                  ),
              ],
            ),
          ),
          Text(
            donation['status'] ?? 'COMPLETED',
            style: GoogleFonts.outfit(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  String _calculateAge(dynamic dob) {
    if (dob == null) return 'N/A';
    try {
      final birthDate = DateTime.parse(dob.toString());
      final today = DateTime.now();
      int age = today.year - birthDate.year;
      if (today.month < birthDate.month ||
          (today.month == birthDate.month && today.day < birthDate.day)) {
        age--;
      }
      return '$age yrs';
    } catch (e) {
      return 'N/A';
    }
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'N/A';
    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(date.toString()));
    } catch (e) {
      return 'N/A';
    }
  }
}
