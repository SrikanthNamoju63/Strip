import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
// Assuming this import exists, or we use named routes
import 'rating_screen.dart';

class BookingSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> appointmentDetails;

  const BookingSuccessScreen({super.key, required this.appointmentDetails});

  @override
  Widget build(BuildContext context) {
    // Extract details or use defaults
    final doctorName = appointmentDetails['doctorName'] ?? 'Doctor';
    final token = appointmentDetails['tokenNumber'] ?? 'Unknown';
    final payment = appointmentDetails['payment'];

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(height: 40), // Top spacing

                // Animated Checkmark
                Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                            Icons.check_rounded,
                            size: 80,
                            color: Colors.green,
                          )
                          .animate()
                          .scale(duration: 600.ms, curve: Curves.elasticOut)
                          .fadeIn(duration: 400.ms),
                    )
                    .animate(
                      onPlay: (controller) => controller.repeat(reverse: true),
                    )
                    .scale(
                      begin: Offset(1.0, 1.0),
                      end: Offset(1.15, 1.15),
                      duration: 1000.ms,
                      curve: Curves.easeInOut,
                    ),

                SizedBox(height: 32),

                Text(
                  "Booking Confirmed!",
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 300.ms).moveY(begin: 20, end: 0),

                SizedBox(height: 16),

                Text(
                  "Your appointment with $doctorName has been booked successfully.",
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                    height: 1.5,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 500.ms),

                SizedBox(height: 24),

                Container(
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.shade100),
                  ),
                  child: Column(
                    children: [
                      Text(
                        "Token Number",
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.blue[800],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        "TK-$token",
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[900],
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 700.ms).scale(),

                if (payment != null) ...[
                  SizedBox(height: 16),
                  Card(
                    elevation: 0,
                    color: Colors.grey[50],
                    child: Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Payment Summary',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          SizedBox(height: 12),
                          // Payment ID
                          if (payment['paymentId'] != null || payment['paymentDetails']?['paymentId'] != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 8.0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Payment ID',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                  Text(
                                    '${'${payment['paymentDetails']?['paymentId'] ?? payment['paymentId'] ?? 'N/A'}'.substring(0, 12)}...',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                      fontFamily: 'monospace',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          Divider(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Total Paid',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                '₹${payment['totalAmount'] ?? 0}',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                  color: Colors.green[700],
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: 8),
                          if (payment['transactionId'] != null)
                            Text(
                              'Txn ID: ${payment['transactionId']}',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.grey[500],
                                fontFamily: 'monospace',
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],

                SizedBox(height: 24),

                Text(
                  "A confirmation email has been sent.",
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                    fontStyle: FontStyle.italic,
                  ),
                ).animate().fadeIn(delay: 900.ms),

                SizedBox(height: 40),

                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(
                        context,
                      ).pushNamedAndRemoveUntil('/home', (route) => false);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 2,
                    ),
                    child: Text(
                      "Go Home",
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ).animate().fadeIn(delay: 1100.ms).moveY(begin: 50, end: 0),

                SizedBox(height: 12),
                if (appointmentDetails['appointment'] != null)
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: OutlinedButton(
                      onPressed: () {
                        final appointment = appointmentDetails['appointment'];
                        final id = appointment['_id'] ?? appointment['id'];
                        if (id == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Appointment ID not available'),
                            ),
                          );
                          return;
                        }
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => RatingScreen(appointmentId: id),
                          ),
                        );
                      },
                      child: Text('Rate Appointment'),
                    ),
                  ),

                SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
