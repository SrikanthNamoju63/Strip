import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import '../widgets/empty_state_widget.dart';

class MedicalReportsScreen extends StatefulWidget {
  const MedicalReportsScreen({super.key});

  @override
  State<MedicalReportsScreen> createState() => _MedicalReportsScreenState();
}

class _MedicalReportsScreenState extends State<MedicalReportsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> reports = [];
  bool isLoading = true;

  final _testNameController = TextEditingController();
  final _reportTypeController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => isLoading = true);
    try {
      final result = await _apiService.getMedicalReports();

      if (result != null && mounted) {
        setState(() {
          reports = result['reports'] ?? [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading reports: $e')));
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _uploadReport() async {
    if (_testNameController.text.isEmpty ||
        _reportTypeController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill required fields')),
      );
      return;
    }

    // Note: In a real app, you'd handle file selection here
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('File upload feature coming soon')),
    );
  }

  void _showAddReportDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => Padding(
            padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom,
              left: 16,
              right: 16,
              top: 16,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Add Medical Report',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _testNameController,
                    label: 'Test Name',
                    hint: 'e.g., Blood Test, CT Scan',
                  ),
                  _buildDropdown(),
                  _buildTextField(
                    controller: _notesController,
                    label: 'Notes (Optional)',
                    hint: 'Additional information',
                    maxLines: 3,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _uploadReport,
                      child: const Text('Choose File & Upload'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
    );
  }

  Widget _buildDropdown() {
    final reportTypes = [
      'BLOOD_TEST',
      'X_RAY',
      'ECG',
      'ULTRASOUND',
      'MRI',
      'CT_SCAN',
      'OTHER',
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<String>(
        value:
            _reportTypeController.text.isEmpty
                ? null
                : _reportTypeController.text,
        decoration: InputDecoration(
          labelText: 'Report Type',
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        ),
        items:
            reportTypes
                .map((type) => DropdownMenuItem(value: type, child: Text(type)))
                .toList(),
        onChanged: (value) {
          _reportTypeController.text = value ?? '';
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Medical Reports'), elevation: 0),
      body:
          isLoading
              ? const Center(child: ConicLoader())
              : reports.isEmpty
              ? EmptyStateWidget(
                title: 'No Medical Reports',
                message: 'Upload medical test reports and documents here',
                onAction: _showAddReportDialog,
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: reports.length,
                itemBuilder: (context, index) {
                  final report = reports[index];
                  return _ReportCard(report: report)
                      .animate()
                      .fadeIn(duration: (300 + index * 100).ms)
                      .slideX(
                        begin: 0.2,
                        duration: (300 + index * 100).ms,
                        curve: Curves.easeOut,
                      );
                },
              ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddReportDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  @override
  void dispose() {
    _testNameController.dispose();
    _reportTypeController.dispose();
    _notesController.dispose();
    super.dispose();
  }
}

class _ReportCard extends StatelessWidget {
  final Map<String, dynamic> report;

  const _ReportCard({required this.report});

  String _formatDate(String date) {
    try {
      final dt = DateTime.parse(date);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (e) {
      return date;
    }
  }

  IconData _getReportIcon(String? type) {
    switch (type?.toUpperCase()) {
      case 'BLOOD_TEST':
        return Icons.bloodtype;
      case 'X_RAY':
        return Icons.medical_services;
      case 'ECG':
        return Icons.favorite;
      case 'ULTRASOUND':
        return Icons.radar;
      case 'MRI':
      case 'CT_SCAN':
        return Icons.layers;
      default:
        return Icons.description;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.green.withValues(alpha: 0.2),
          child: Icon(
            _getReportIcon(report['reportType']),
            color: Colors.green,
          ),
        ),
        title: Text(
          report['testName'] ?? 'Report',
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              report['reportType'] ?? 'N/A',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
            Text(
              _formatDate(report['date'] ?? ''),
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        trailing: Icon(Icons.file_present, color: Colors.orange),
      ),
    );
  }
}
