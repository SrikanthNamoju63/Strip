import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class AppointmentHistoryScreen extends StatefulWidget {
  final List<dynamic>? initialAppointments; // Optional initial data

  const AppointmentHistoryScreen({super.key, this.initialAppointments});

  @override
  State<AppointmentHistoryScreen> createState() => _AppointmentHistoryScreenState();
}

class _AppointmentHistoryScreenState extends State<AppointmentHistoryScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    if (widget.initialAppointments != null) {
      _appointments = widget.initialAppointments!;
      _isLoading = false;
    } else {
      _fetchAppointments();
    }
  }

  Future<void> _fetchAppointments() async {
    try {
      final appts = await _apiService.getUserAppointments();
      if (mounted) {
        setState(() {
          _appointments = appts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Appointment History', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: ConicLoader())
          : RefreshIndicator(
              onRefresh: _fetchAppointments,
              child: _appointments.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                        Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.history, size: 64, color: Colors.grey.shade300),
                              const SizedBox(height: 16),
                              Text('No past appointments', style: GoogleFonts.outfit(fontSize: 16, color: Colors.grey)),
                            ],
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _appointments.length,
                      itemBuilder: (context, index) {
                        return _buildHistoryCard(_appointments[index]);
                      },
                    ),
            ),
    );
  }

  Widget _buildHistoryCard(dynamic appt) {
    final date = appt['appointmentDate'] != null 
        ? DateFormat('MMM dd, yyyy').format(DateTime.parse(appt['appointmentDate'])) 
        : 'Unknown';
    final doctorName = appt['doctorId'] is Map ? appt['doctorId']['name'] : 'Doctor';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.grey.shade100, blurRadius: 4, offset: const Offset(0, 2))
        ],
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _getStatusColor(appt['status']).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_getStatusIcon(appt['status']), color: _getStatusColor(appt['status'])),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(doctorName, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87)),
                    const SizedBox(height: 4),
                    Text('$date • ${appt['appointmentTime']}', style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey.shade600)),
                    const SizedBox(height: 8),
                    // Payment Status Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getPaymentStatusColor(appt['paymentStatus']).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Payment: ${appt['paymentStatus'] ?? 'PENDING'}', 
                        style: GoogleFonts.outfit(
                          fontSize: 12, 
                          fontWeight: FontWeight.bold, 
                          color: _getPaymentStatusColor(appt['paymentStatus'])
                        )
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(appt['status']).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      (appt['status'] ?? 'UNKNOWN').toString().toUpperCase(), 
                      style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: _getStatusColor(appt['status'])),
                    ),
                  ),
                ],
              ),
            ],
          ),
          if (appt['status'] == 'PENDING' || appt['status'] == 'CONFIRMED') ...[
             const SizedBox(height: 16),
             const Divider(),
             const SizedBox(height: 8),
             SizedBox(
               width: double.infinity,
               child: OutlinedButton.icon(
                 onPressed: () => _confirmCancel(appt['_id']),
                 icon: const Icon(Icons.cancel_outlined, size: 18, color: Colors.red),
                 label: const Text('Cancel Appointment', style: TextStyle(color: Colors.red)),
                 style: OutlinedButton.styleFrom(
                   side: const BorderSide(color: Colors.red),
                   padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 10), // Compact
                 ),
               ),
             )
          ]
        ],
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'COMPLETED': return Colors.green;
      case 'CANCELLED': return Colors.red;
      case 'CONFIRMED': return Colors.blue;
      default: return Colors.orange;
    }
  }

  IconData _getStatusIcon(String? status) {
    switch (status) {
      case 'COMPLETED': return Icons.check_circle;
      case 'CANCELLED': return Icons.cancel;
      case 'CONFIRMED': return Icons.calendar_today;
      default: return Icons.schedule;
    }
  }

  Color _getPaymentStatusColor(String? status) {
    if (status == 'COMPLETED' || status == 'CAPTURED') return Colors.green;
    if (status == 'REFUNDED') return Colors.purple;
    return Colors.orange;
  }

  Future<void> _confirmCancel(String id) async {
    final reasonController = TextEditingController();
    
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Appointment?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
             const Text('Are you sure you want to cancel? Refunds will be processed based on cancellation policy.'),
             const SizedBox(height: 10),
             TextField(
               controller: reasonController,
               decoration: const InputDecoration(labelText: 'Reason (Optional)', border: OutlineInputBorder()),
             )
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true), 
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Yes, Cancel')
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      final result = await _apiService.cancelAppointment(id, reasonController.text);
      
      if (mounted) {
        setState(() => _isLoading = false);
        if (result != null) {
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Cancelled. Refund: ₹${result['refundAmount'] ?? 0}')));
           _fetchAppointments(); // Refresh list
        } else {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to cancel. It might be too late.')));
        }
      }
    }
  }
}
