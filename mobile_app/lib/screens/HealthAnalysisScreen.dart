import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import '../widgets/empty_state_widget.dart';

class HealthAnalysisScreen extends StatefulWidget {
  const HealthAnalysisScreen({Key? key}) : super(key: key);

  @override
  State<HealthAnalysisScreen> createState() => _HealthAnalysisScreenState();
}

class _HealthAnalysisScreenState extends State<HealthAnalysisScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> analyses = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadAnalyses();
  }

  Future<void> _loadAnalyses() async {
    setState(() => isLoading = true);
    try {
      final result = await _apiService.getHealthAnalyses();

      if (result != null && mounted) {
        setState(() {
          analyses = result['analyses'] ?? [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading health analyses: $e')),
        );
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Health Analysis'), elevation: 0),
      body:
          isLoading
              ? const Center(child: CircularProgressIndicator())
              : analyses.isEmpty
              ? EmptyStateWidget(
                title: 'No Health Analyses',
                message:
                    'Your doctor will assign health analyses after appointments',
                onAction: _loadAnalyses,
              )
              : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: analyses.length,
                itemBuilder: (context, index) {
                  final analysis = analyses[index];
                  return _AnalysisCard(analysis: analysis)
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

class _AnalysisCard extends StatefulWidget {
  final Map<String, dynamic> analysis;

  const _AnalysisCard({required this.analysis});

  @override
  State<_AnalysisCard> createState() => _AnalysisCardState();
}

class _AnalysisCardState extends State<_AnalysisCard> {
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

  Color _getRiskColor(String? riskLevel) {
    switch (riskLevel?.toLowerCase()) {
      case 'high':
        return Colors.red;
      case 'medium':
        return Colors.orange;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final analysisType = widget.analysis['analysisType'] ?? 'Health Analysis';
    final riskLevel = widget.analysis['riskLevel'] ?? 'low';
    final date = widget.analysis['analysisDate'] ?? '';
    final doctorName = widget.analysis['doctorId']?['name'] ?? 'Doctor';

    return GestureDetector(
      onTap: () {
        setState(() => _isExpanded = !_isExpanded);
      },
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.only(bottom: 12),
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            analysisType,
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(fontWeight: FontWeight.bold),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            doctorName,
                            style: Theme.of(
                              context,
                            ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _getRiskColor(riskLevel).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        riskLevel.toUpperCase(),
                        style: TextStyle(
                          color: _getRiskColor(riskLevel),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDate(date),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                if (_isExpanded) ...[
                  const SizedBox(height: 12),
                  const Divider(),
                  const SizedBox(height: 12),
                  _buildAnalysisDetails(),
                ],
                if (!_isExpanded)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Icon(Icons.expand_more, size: 20, color: Colors.grey),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAnalysisDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailSection('Findings', widget.analysis['findings'] ?? 'N/A'),
        if (widget.analysis['recommendations'] != null) ...[
          const SizedBox(height: 12),
          _buildDetailSection(
            'Recommendations',
            widget.analysis['recommendations'],
          ),
        ],
        if (widget.analysis['followUpDate'] != null) ...[
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.event_note, size: 16, color: Colors.blue),
              const SizedBox(width: 8),
              Text(
                'Follow-up: ${_formatDate(widget.analysis['followUpDate'])}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.blue,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _buildDetailSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(content, style: Theme.of(context).textTheme.bodySmall),
        ),
      ],
    );
  }
}
