import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';

class AppointmentDetailScreen extends StatefulWidget {
  final String appointmentId;

  const AppointmentDetailScreen({super.key, required this.appointmentId});

  @override
  State<AppointmentDetailScreen> createState() =>
      _AppointmentDetailScreenState();
}

class _AppointmentDetailScreenState extends State<AppointmentDetailScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? appointmentData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAppointmentDetails();
  }

  Future<void> _loadAppointmentDetails() async {
    try {
      final result = await _apiService.getAppointmentDetails(
        widget.appointmentId,
      );

      if (result != null && mounted) {
        setState(() {
          appointmentData = result['appointment'];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading appointment: $e')),
        );
        setState(() => isLoading = false);
      }
    }
  }

  String _formatDate(String date) {
    try {
      final dt = DateTime.parse(date);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (e) {
      return date;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      case 'completed':
        return Colors.blue;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Appointment Details'), elevation: 0),
      body:
          isLoading
              ? const Center(child: ConicLoader())
              : appointmentData == null
              ? const Center(child: Text('Appointment not found'))
              : SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildDoctorCard(),
                      const SizedBox(height: 24),
                      _buildAppointmentDetails(),
                      const SizedBox(height: 24),
                      if (appointmentData!['consultationNotes'] != null)
                        _buildConsultationNotes(),
                      if (appointmentData!['prescriptions'] != null &&
                          (appointmentData!['prescriptions'] as List)
                              .isNotEmpty)
                        _buildPrescriptions(),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              ),
    );
  }

  Widget _buildDoctorCard() {
    final doctor = appointmentData!['doctorId'] ?? {};

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 40,
              backgroundImage:
                  doctor['profileImage'] != null
                      ? NetworkImage(doctor['profileImage'].toString().startsWith('http') ? doctor['profileImage'] : '${ApiService.baseUrl.replaceAll('/api', '')}/${doctor['profileImage'].toString().replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '')}')
                      : null,
              child:
                  doctor['profileImage'] == null
                      ? const Icon(Icons.person, size: 40)
                      : null,
            ),
            const SizedBox(height: 12),
            Text(
              doctor['name'] ?? 'Dr. Unknown',
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            Text(
              doctor['specialization'] ?? 'Specialist',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 16),
                const SizedBox(width: 4),
                Text(
                  '${doctor['rating']?.toStringAsFixed(1) ?? 'N/A'} (${doctor['reviewCount'] ?? 0} reviews)',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.2, duration: 300.ms);
  }

  Widget _buildAppointmentDetails() {
    final status = appointmentData!['status'] ?? 'pending';
    final appointmentDate = appointmentData!['appointmentDate'] ?? '';
    final appointmentTime = appointmentData!['appointmentTime'] ?? '';
    final fee = appointmentData!['fee'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Appointment Details',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 16),
        _buildDetailRow(
          icon: Icons.calendar_today,
          label: 'Date',
          value: _formatDate(appointmentDate),
        ),
        _buildDetailRow(
          icon: Icons.access_time,
          label: 'Time',
          value: appointmentTime,
        ),
        _buildDetailRow(
          icon: Icons.info,
          label: 'Status',
          value: status.toUpperCase(),
          valueColor: _getStatusColor(status),
        ),
        _buildDetailRow(
          icon: Icons.currency_rupee,
          label: 'Consultation Fee',
          value: '₹ ${(fee as num).toStringAsFixed(2)}',
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, duration: 400.ms);
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: Colors.grey),
              const SizedBox(width: 12),
              Text(label, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConsultationNotes() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Consultation Notes',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              appointmentData!['consultationNotes'] ?? '',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.2, duration: 500.ms);
  }

  Widget _buildPrescriptions() {
    final prescriptions = appointmentData!['prescriptions'] as List;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Prescriptions', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        ...prescriptions.asMap().entries.map((entry) {
          final index = entry.key;
          final rx = entry.value;
          return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          rx['medicineName'] ?? 'Medicine',
                          style: Theme.of(context).textTheme.titleSmall
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Dosage: ${rx['dosage'] ?? 'N/A'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          'Frequency: ${rx['frequency'] ?? 'N/A'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          'Duration: ${rx['duration'] ?? 'N/A'}',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        if (rx['notes'] != null &&
                            rx['notes'].toString().isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),
                            child: Text(
                              rx['notes'],
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              )
              .animate()
              .fadeIn(duration: (600 + index * 100).ms)
              .slideY(begin: -0.2, duration: (600 + index * 100).ms);
        }),
      ],
    );
  }
}
