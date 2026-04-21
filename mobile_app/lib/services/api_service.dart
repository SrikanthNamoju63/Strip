import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Simple logging helper
class _Log {
  static void debug(String message) {
    // Replace with proper logging framework in production (e.g., logger package)
    // print(message);
  }

  static void error(String message, [Object? error]) {
    // Replace with proper logging framework in production
    // print('ERROR: $message${error != null ? ' - $error' : ''}');
  }
}

class ApiService {
  // Use 127.0.0.1 for Windows, 10.0.2.2 for Android Emulator
  static String get baseUrl {
    if (Platform.isAndroid) return 'http://10.0.2.2:6002/api';
    return 'http://127.0.0.1:6002/api';
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<String?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        return null;
      } else {
        return jsonDecode(response.body)['msg'] ?? 'Login failed';
      }
    } catch (e) {
      return 'Connection error: $e';
    }
  }

  Future<String?> register(
    String name,
    String email,
    String phone,
    String password,
    DateTime dob,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
          'role': 'USER',
          'dob': dob.toIso8601String(),
          'age':
              (DateTime.now().year -
                  dob.year), // Approximate age for initial sign up
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['token'];
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', token);
        return null;
      } else {
        return jsonDecode(response.body)['msg'] ?? 'Registration failed';
      }
    } catch (e) {
      return 'Connection error: $e';
    }
  }

  Future<List<dynamic>> getDoctors() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/doctors'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      _Log.debug('Get Doctors Error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getDoctorById(String doctorId) async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/doctors/$doctorId'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.debug('Get Doctor By Id Error: $e');
      return null;
    }
  }

  static Future<List<dynamic>> searchDoctors(
    String location,
    String query,
  ) async {
    try {
      // Note: This needs to be a POST request to send body data, checking backend implementation
      final response = await http.post(
        Uri.parse('$baseUrl/doctors/search'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'location': location, 'query': query}),
      );

      if (response.statusCode == 200) {
        return List<dynamic>.from(jsonDecode(response.body));
      }
      return [];
    } catch (e) {
      _Log.error('Search Error', e);
      rethrow;
    }
  }

  static Future<List<dynamic>> getDoctorSlots(
    String doctorId,
    String date,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/doctors/$doctorId/slots?date=$date'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['slots'] ?? [];
      }
      return [];
    } catch (e) {
      _Log.debug('Slot Fetch Error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> getUserProfile() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/me'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get User Profile Error', e);
      return null;
    }
  }

  // --- Booking ---
  Future<String?> forgotPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );

      if (response.statusCode == 200) {
        return null; // Success
      } else {
        return jsonDecode(response.body)['msg'] ?? 'Request failed';
      }
    } catch (e) {
      return 'Connection error: $e';
    }
  }

  Future<Map<String, dynamic>?> bookAppointment(
    String doctorId,
    String date,
    String time,
    String reason,
    String patientName, {
    int? age,
    String? gender,
    String? contact,
    String? couponCode,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/appointments'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'doctorId': doctorId,
          'appointmentDate': date,
          'appointmentTime': time,
          'diseaseKeyword': reason,
          if (couponCode != null) 'couponCode': couponCode,
          'patientDetails': {
            'name': patientName,
            'age': age ?? 0,
            'gender': gender ?? 'Unknown',
            'contact': contact ?? '',
          },
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(
          error['msg'] ?? 'Booking failed with status ${response.statusCode}',
        );
      }
    } catch (e) {
      _Log.error('Book Appointment Error', e);
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> initiatePayment(
    String appointmentId,
    String paymentMethod,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/payments/initiate'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'appointmentId': appointmentId,
          'paymentMethod': paymentMethod, // 'CARD', 'UPI'
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      _Log.debug(
        'Initiate Payment Failed: ${response.statusCode} - ${response.body}',
      );
      return null;
    } catch (e) {
      _Log.error('Initiate Payment Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> verifyPayment(
    String paymentId,
    String orderId,
    String signature,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/payments/verify'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'paymentId': paymentId,
          'orderId': orderId,
          'signature': signature,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map<String, dynamic>) return data;
        return Map<String, dynamic>.from(data);
      }
      return null;
    } catch (e) {
      _Log.error('Verify Payment Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> cancelAppointment(
    String appointmentId,
    String reason,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/appointments/$appointmentId/cancel'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({'reason': reason}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(
          response.body,
        ); // {msg, refundAmount, cancellationFee}
      }
      return null;
    } catch (e) {
      _Log.error('Cancel Appointment Error', e);
      return null;
    }
  }

  // --- Blood Module ---
  Future<List<dynamic>> getBloodDonors({String? bloodGroup}) async {
    try {
      final token = await _getToken();
      String query = '';
      if (bloodGroup != null && bloodGroup.isNotEmpty) {
        query = '?bloodGroup=$bloodGroup'; // &radius=20
      }

      final response = await http.get(
        Uri.parse('$baseUrl/blood/donors$query'),
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token ?? '',
        },
      );
      if (response.statusCode == 200) {
        return List<dynamic>.from(jsonDecode(response.body));
      }
      return [];
    } catch (e) {
      _Log.debug('Get Blood Donors Error: $e');
      return [];
    }
  }

  Future<List<dynamic>> getDonationHistory() async {
    final token = await _getToken();
    final response = await http.get(
      Uri.parse('$baseUrl/blood/history'),
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token ?? '',
      },
    );

    if (response.statusCode == 200) {
      return List<dynamic>.from(json.decode(response.body));
    } else {
      // If endpoint doesn't exist yet, return empty list instead of crashing
      if (response.statusCode == 404) return [];
      throw Exception('Failed to load history');
    }
  }

  Future<List<dynamic>> getUserAppointments() async {
    try {
      final token = await _getToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/appointments/my'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      _Log.debug('Get User Appointments Error: $e');
      return [];
    }
  }

  Future<Map<String, dynamic>?> updateUserProfile(
    Map<String, dynamic> data,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.put(
        Uri.parse('$baseUrl/users/me'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode(data),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Update User Profile Error', e);
      return null;
    }
  }

  Future<bool> registerDonor(Map<String, dynamic> donorData) async {
    try {
      final token = await _getToken();
      if (token == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/blood/donor'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode(donorData),
      );

      return response.statusCode == 200;
    } catch (e) {
      _Log.error('Register Donor Error', e);
      return false;
    }
  }

  Future<Map<String, dynamic>?> submitRating(
    String appointmentId,
    int overallRating,
    Map<String, int>? serviceRatings,
    String? reviewText,
    bool? wouldRecommend,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final url = Uri.parse('$baseUrl/ratings');
      _Log.debug('Submitting Rating to: $url');
      _Log.debug('Payload: $appointmentId, $overallRating, $reviewText');

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'appointmentId': appointmentId,
          'overallRating': overallRating,
          'serviceRatings': serviceRatings,
          'reviewText': reviewText,
          'wouldRecommend': wouldRecommend,
        }),
      );

      _Log.debug(
        "Submit Rating Response: ${response.statusCode} - ${response.body}",
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.debug('Submit Rating Error: $e');
      _Log.error('Submit Rating Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> checkPendingFeedback() async {
    try {
      final token = await _getToken();
      _Log.debug("CheckPendingFeedback Token: $token");
      if (token == null) return null;

      final url = Uri.parse('$baseUrl/ratings/pending');
      _Log.debug("Requesting: $url");

      final response = await http.get(
        url,
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
      );

      _Log.debug(
        "CheckPendingFeedback Response: ${response.statusCode} - ${response.body}",
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.debug('Check Pending Feedback Error: $e');
      _Log.error('Check Pending Feedback Error', e);
      return null;
    }
  }

  Future<String?> uploadProfileImage(File imageFile) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/users/me/avatar'),
      );
      request.headers['x-auth-token'] = token;

      request.files.add(
        await http.MultipartFile.fromPath('image', imageFile.path),
      );

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['profileImage'];
      } else {
        _Log.error(
          'Upload Failed',
          '${response.statusCode} - ${response.body}',
        );
        return null;
      }
    } catch (e) {
      _Log.error('Upload Exception', e);
      return null;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  Future<Map<String, dynamic>?> rescheduleAppointment(
    String appointmentId,
    String date,
    String time,
    String reason,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/appointments/$appointmentId/reschedule'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({'date': date, 'time': time, 'reason': reason}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        // Attempt to parse JSON error, otherwise throw generic
        try {
          final error = jsonDecode(response.body);
          throw Exception(error['msg'] ?? 'Reschedule failed');
        } catch (e) {
          // Likely HTML or other error
          throw Exception(
            'Server Error: ${response.statusCode}. ${response.body.substring(0, min(100, response.body.length))}...',
          );
        }
      }
    } catch (e) {
      _Log.error('Reschedule Error', e);
      rethrow;
    }
  }

  // --- Fee Config ---
  static Future<Map<String, dynamic>?> getFeeConfig() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/fees/config'),
      ); // No auth header needed if public, but good to check

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.debug('Get Fee Config Error: $e');
      return null;
    }
  }

  // --- Coupon ---
  Future<Map<String, dynamic>?> getWelcomeCoupon() async {
    try {
      final token = await _getToken();
      if (token == null) return null;
      final response = await http.get(
        Uri.parse('$baseUrl/coupons/welcome'),
        headers: {'x-auth-token': token},
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return null;
    } catch (e) {
      _Log.error('Get Welcome Coupon Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> validateCoupon(String code) async {
    try {
      final token = await _getToken();
      if (token == null) return null;
      final response = await http.post(
        Uri.parse('$baseUrl/coupons/validate'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({'code': code}),
      );
      if (response.statusCode == 200) return jsonDecode(response.body);
      return jsonDecode(response.body); // For error messages
    } catch (e) {
      _Log.error('Validate Coupon Error', e);
      return null;
    }
  }

  // ===== MY APPOINTMENTS =====
  Future<Map<String, dynamic>?> getMyAppointments({
    String status = '',
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      String url = '$baseUrl/users/appointments?page=$page&limit=$limit';
      if (status.isNotEmpty) url += '&status=$status';

      final response = await http.get(
        Uri.parse(url),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get My Appointments Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> getAppointmentDetails(
    String appointmentId,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/appointments/$appointmentId'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Appointment Details Error', e);
      return null;
    }
  }

  // ===== PRESCRIPTIONS =====
  Future<Map<String, dynamic>?> getMyPrescriptions() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/prescriptions'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Prescriptions Error', e);
      return null;
    }
  }

  // ===== MEDICINE REMINDERS =====
  Future<Map<String, dynamic>?> getMedicineReminders() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/medicine-reminders'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Medicine Reminders Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> addMedicineReminder({
    required String medicineName,
    required String dosage,
    required String frequency,
    required String time,
    required String duration,
    String? notes,
    String? appointmentId,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/users/medicine-reminders'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'medicineName': medicineName,
          'dosage': dosage,
          'frequency': frequency,
          'time': time,
          'duration': duration,
          'notes': notes,
          'appointmentId': appointmentId,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Add Medicine Reminder Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> deleteMedicineReminder(
    String reminderId,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.delete(
        Uri.parse('$baseUrl/users/medicine-reminders/$reminderId'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Delete Medicine Reminder Error', e);
      return null;
    }
  }

  // ===== HEALTH ANALYSIS =====
  Future<Map<String, dynamic>?> getHealthAnalyses() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/health-analysis'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Health Analyses Error', e);
      return null;
    }
  }

  // ===== REFUNDS & PAYMENTS =====
  Future<Map<String, dynamic>?> getMyRefunds() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/refunds'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Refunds Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> getPaymentHistory() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/payments'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Payment History Error', e);
      return null;
    }
  }

  // ===== EMERGENCY CONTACTS =====
  Future<Map<String, dynamic>?> getEmergencyContacts() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/emergency-contacts'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Emergency Contacts Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> addEmergencyContact({
    required String name,
    required String phone,
    String? relationship,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/users/emergency-contacts'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'name': name,
          'phone': phone,
          'relationship': relationship,
        }),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Add Emergency Contact Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> deleteEmergencyContact(String contactId) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.delete(
        Uri.parse('$baseUrl/users/emergency-contacts/$contactId'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Delete Emergency Contact Error', e);
      return null;
    }
  }

  // ===== HEALTH DATA =====
  Future<Map<String, dynamic>?> getUserHealthSummary() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/health-summary'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Health Summary Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> getHealthTrends() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/health-trends'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Health Trends Error', e);
      return null;
    }
  }

  // ===== MEDICAL REPORTS =====
  Future<Map<String, dynamic>?> getMedicalReports() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/medical-reports'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Medical Reports Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> uploadMedicalReport({
    required String reportType,
    required String testName,
    String? notes,
    String? filePath,
  }) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/users/medical-reports'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'reportType': reportType,
          'testName': testName,
          'notes': notes,
          'filePath': filePath,
        }),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Upload Medical Report Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> sendHealthReading(
    Map<String, dynamic> readingData,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/health/readings'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode(readingData),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Send Health Reading Error', e);
      return null;
    }
  }

  // ===== APPOINTMENT REMINDERS =====
  Future<Map<String, dynamic>?> getAppointmentReminders() async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.get(
        Uri.parse('$baseUrl/users/appointment-reminders'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Get Appointment Reminders Error', e);
      return null;
    }
  }

  Future<Map<String, dynamic>?> markReminderSeen(String reminderId) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.put(
        Uri.parse('$baseUrl/users/appointment-reminders/$reminderId/seen'),
        headers: {'x-auth-token': token},
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Mark Reminder Seen Error', e);
      return null;
    }
  }

  // --- App Feedback ---
  Future<Map<String, dynamic>?> submitFeedback(
    String feedbackType,
    String feedbackText,
    String appVersion,
    String deviceInfo,
  ) async {
    try {
      final token = await _getToken();
      if (token == null) return null;

      final response = await http.post(
        Uri.parse('$baseUrl/app-feedback/submit'),
        headers: {'Content-Type': 'application/json', 'x-auth-token': token},
        body: jsonEncode({
          'feedbackType': feedbackType,
          'feedbackText': feedbackText,
          'appVersion': appVersion,
          'deviceInfo': deviceInfo,
        }),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      _Log.error('Submit Feedback Error', e);
      return null;
    }
  }
}
