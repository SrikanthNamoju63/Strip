import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class BookingScreen extends StatefulWidget {
  final Map<String, dynamic> doctor;

  const BookingScreen({super.key, required this.doctor});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final _apiService = ApiService();
  DateTime _selectedDate = DateTime.now();
  String? _selectedTime;
  final _reasonController = TextEditingController();
  final _patientNameController = TextEditingController();
  bool _isLoading = false;

  // Mock slots for now - ideally these come from the backend based on date
  final List<String> _timeSlots = [
    '09:00 AM',
    '10:00 AM',
    '11:00 AM',
    '02:00 PM',
    '03:00 PM',
    '04:00 PM',
  ];

  void _bookAppointment() async {
    if (_selectedTime == null ||
        _reasonController.text.isEmpty ||
        _patientNameController.text.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Please fill all fields')));
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final appointment = await _apiService.bookAppointment(
      widget.doctor['_id'],
      _selectedDate.toIso8601String(),
      _selectedTime!,
      _reasonController.text,
      _patientNameController.text,
    );

    setState(() {
      _isLoading = false;
    });

    if (appointment != null && mounted) {
      _showPaymentDialog(appointment);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to book appointment')),
      );
    }
  }

  void _showPaymentDialog(Map<String, dynamic> appointment) {
    bool isPaying = false;
    final double amount = (widget.doctor['consultationFee'] ?? 500).toDouble();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => StatefulBuilder(
            builder: (context, setState) {
              return AlertDialog(
                title: Text(
                  'Payment Required',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                ),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Consultation Fee',
                      style: GoogleFonts.outfit(color: Colors.grey),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '₹${amount.toStringAsFixed(2)}',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 16),
                    Text(
                      'Select Payment Method',
                      style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        _paymentMethodIcon(Icons.credit_card, 'Card'),
                        _paymentMethodIcon(Icons.qr_code, 'UPI'),
                        _paymentMethodIcon(
                          Icons.account_balance_wallet,
                          'Wallet',
                        ),
                      ],
                    ),
                    if (isPaying) ...[
                      const SizedBox(height: 20),
                      const LinearProgressIndicator(),
                      const SizedBox(height: 10),
                      const Text(
                        'Processing Payment...',
                        style: TextStyle(fontSize: 12),
                      ),
                    ],
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed:
                        isPaying
                            ? null
                            : () {
                              Navigator.pop(context); // Close dialog
                              // Should we cancel the appointment here if they don't pay?
                              // For now, let's just close. Appointment remains PENDING payment.
                              _showSuccessDialog(); // Show standard success but mention payment pending
                            },
                    child: const Text('Pay Later'),
                  ),
                  ElevatedButton(
                    onPressed:
                        isPaying
                            ? null
                            : () async {
                              setState(() => isPaying = true);

                              // 1. Initiate
                              final paymentData = await _apiService
                                  .initiatePayment(appointment['_id'], 'CARD');

                              if (paymentData != null &&
                                  paymentData['success']) {
                                // Simulate Gateway delay
                                await Future.delayed(
                                  const Duration(seconds: 2),
                                );

                                // 2. Verify (Simulate backend callback / webhook verification)
                                // In real app, Gateway SDK handles this. Here we manually trigger verify.
                                final verifySuccess = await _apiService
                                    .verifyPayment(
                                      paymentData['data']['paymentId'] ?? '',
                                      paymentData['data']['orderId'] ?? 'TXN_${DateTime.now().millisecondsSinceEpoch}',
                                      'MOCK_SIGNATURE',
                                    );

                                if (verifySuccess != null) {
                                  if (mounted) {
                                    Navigator.pop(
                                      context,
                                    ); // Close Payment Dialog
                                    _showSuccessDialog(paymentSuccess: true);
                                  }
                                } else {
                                  setState(() => isPaying = false);
                                  if (mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(
                                        content: Text(
                                          'Payment Verification Failed',
                                        ),
                                      ),
                                    );
                                  }
                                }
                              } else {
                                setState(() => isPaying = false);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text(
                                        'Payment Initiation Failed',
                                      ),
                                    ),
                                  );
                                }
                              }
                            },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                    ),
                    child: const Text('Pay Now'),
                  ),
                ],
              );
            },
          ),
    );
  }

  Widget _paymentMethodIcon(IconData icon, String label) {
    return Column(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: Colors.blue.shade50,
          child: Icon(icon, color: Colors.blue),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 10)),
      ],
    );
  }

  void _showSuccessDialog({bool paymentSuccess = false}) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Success!'),
            content: Text(
              paymentSuccess
                  ? 'Appointment booked and payment successful.'
                  : 'Appointment booked. Please complete payment later.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Go back to doctor list
                },
                child: const Text('OK'),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Book Appointment',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Doctor Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    child: Text(widget.doctor['name'][0]),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.doctor['name'],
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          widget.doctor['specialization'],
                          style: GoogleFonts.outfit(
                            color: Colors.grey.shade700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text(
              'Select Date',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 30)),
                );
                if (date != null) {
                  setState(() {
                    _selectedDate = date;
                  });
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      DateFormat('EEE, MMM d, yyyy').format(_selectedDate),
                      style: GoogleFonts.outfit(fontSize: 16),
                    ),
                    const Icon(
                      Icons.calendar_today,
                      size: 20,
                      color: Colors.blue,
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),
            Text(
              'Select Time',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children:
                  _timeSlots.map((time) {
                    final isSelected = _selectedTime == time;
                    return ChoiceChip(
                      label: Text(time),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _selectedTime = selected ? time : null;
                        });
                      },
                      selectedColor: Colors.blue,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black,
                      ),
                    );
                  }).toList(),
            ),

            const SizedBox(height: 24),
            Text(
              'Patient Details',
              style: GoogleFonts.outfit(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _patientNameController,
              decoration: InputDecoration(
                labelText: 'Patient Name',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _reasonController,
              decoration: InputDecoration(
                labelText: 'Reason for Visit',
                hintText: 'e.g., Fever, Checkup',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _bookAppointment,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.blue.shade600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child:
                    _isLoading
                        ? const ConicLoader(color: Colors.white)
                        : Text(
                          'Confirm Booking',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
