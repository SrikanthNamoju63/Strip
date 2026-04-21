import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import '../widgets/empty_state_widget.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> prescriptions = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPrescriptions();
  }

  Future<void> _loadPrescriptions() async {
    setState(() => isLoading = true);
    try {
      final result = await _apiService.getMyPrescriptions();

      if (result != null && mounted) {
        setState(() {
          prescriptions = result['prescriptions'] ?? [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading prescriptions: $e')),
        );
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Prescriptions'), elevation: 0),
      body:
          isLoading
              ? const Center(child: CircularProgressIndicator())
              : prescriptions.isEmpty
              ? EmptyStateWidget(
                title: 'No Prescriptions',
                message:
                    'Your prescriptions from doctor appointments will appear here',
                onAction: () {
                  Navigator.pop(context);
                },
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: prescriptions.length,
                itemBuilder: (context, index) {
                  final prescription = prescriptions[index];
                  return _PrescriptionCard(prescription: prescription)
                      .animate()
                      .fadeIn(duration: (300 + index * 100).ms)
                      .slideX(
                        begin: 0.2,
                        duration: (300 + index * 100).ms,
                        curve: Curves.easeOut,
                      );
                },
              ),
    );
  }
}

class _PrescriptionCard extends StatefulWidget {
  final Map<String, dynamic> prescription;

  const _PrescriptionCard({required this.prescription});

  @override
  State<_PrescriptionCard> createState() => _PrescriptionCardState();
}

class _PrescriptionCardState extends State<_PrescriptionCard> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = false;
  }

  String _formatDate(String date) {
    try {
      final dt = DateTime.parse(date);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (e) {
      return date;
    }
  }

  @override
  Widget build(BuildContext context) {
    final medicines = widget.prescription['medicines'] ?? [];
    final doctorName = widget.prescription['doctorName'] ?? 'Unknown Doctor';
    final appointmentDate = widget.prescription['appointmentDate'] ?? '';

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        children: [
          ListTile(
            onTap: () {
              setState(() => _isExpanded = !_isExpanded);
            },
            title: Text(
              doctorName,
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              'Appointment on ${_formatDate(appointmentDate)}',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
            trailing: Icon(
              _isExpanded ? Icons.expand_less : Icons.expand_more,
              color: Colors.grey,
            ),
          ),
          if (_isExpanded)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(),
                  const SizedBox(height: 8),
                  ...medicines.asMap().entries.map((entry) {
                    final medicine = entry.value;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: _buildMedicineItem(context, medicine),
                    );
                  }).toList(),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMedicineItem(
    BuildContext context,
    Map<String, dynamic> medicine,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            medicine['medicineName'] ?? 'Medicine',
            style: Theme.of(
              context,
            ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          _buildMedicineRow('Dosage', medicine['dosage'] ?? 'N/A'),
          _buildMedicineRow('Frequency', medicine['frequency'] ?? 'N/A'),
          _buildMedicineRow('Duration', medicine['duration'] ?? 'N/A'),
          if (medicine['notes'] != null &&
              medicine['notes'].toString().isNotEmpty)
            Column(
              children: [
                const SizedBox(height: 8),
                _buildMedicineRow('Notes', medicine['notes'] ?? ''),
              ],
            ),
        ],
      ),
    );
  }

  Widget _buildMedicineRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label: ',
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 12))),
        ],
      ),
    );
  }
}
