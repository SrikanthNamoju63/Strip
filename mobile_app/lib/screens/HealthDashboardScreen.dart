import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import '../widgets/empty_state_widget.dart';

class HealthDashboardScreen extends StatefulWidget {
  const HealthDashboardScreen({super.key});

  @override
  State<HealthDashboardScreen> createState() => _HealthDashboardScreenState();
}

class _HealthDashboardScreenState extends State<HealthDashboardScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? healthSummary;
  List<dynamic> healthTrends = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHealthData();
  }

  Future<void> _loadHealthData() async {
    setState(() => isLoading = true);
    try {
      final summaryResult = await _apiService.getUserHealthSummary();
      final trendsResult = await _apiService.getHealthTrends();

      if (mounted) {
        setState(() {
          if (summaryResult != null) {
            healthSummary = summaryResult['summary'];
          }
          if (trendsResult != null) {
            healthTrends = trendsResult['trends'] ?? [];
          }
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading health data: $e')),
        );
        setState(() => isLoading = false);
      }
    }
  }

  String _getHealthStatus(String status) {
    switch (status.toLowerCase()) {
      case 'healthy':
        return '✓ Healthy';
      case 'at-risk':
        return '⚠ At Risk';
      case 'critical':
        return '⛔ Critical';
      default:
        return 'Unknown';
    }
  }

  Color _getHealthStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'healthy':
        return Colors.green;
      case 'at-risk':
        return Colors.orange;
      case 'critical':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Health Dashboard'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadHealthData,
          ),
        ],
      ),
      body:
          isLoading
              ? const Center(child: ConicLoader())
              : healthSummary == null
              ? EmptyStateWidget(
                title: 'No Health Data',
                message: 'Start adding health readings to track your health',
                onAction: _loadHealthData,
              )
              : SingleChildScrollView(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHealthStatusCard(),
                      const SizedBox(height: 24),
                      _buildVitalsGrid(),
                      const SizedBox(height: 24),
                      _buildHealthMetrics(),
                      const SizedBox(height: 24),
                      if (healthTrends.isNotEmpty) _buildTrendsSummary(),
                    ],
                  ),
                ),
              ),
    );
  }

  Widget _buildHealthStatusCard() {
    final status = healthSummary?['healthStatus'] ?? 'healthy';
    final bmi = healthSummary?['bmi'] ?? 0;
    final age = healthSummary?['age'];
    final bloodGroup = healthSummary?['bloodGroup'] ?? 'N/A';

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              _getHealthStatusColor(status).withValues(alpha: 0.2),
              _getHealthStatusColor(status).withValues(alpha: 0.05),
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Health Status',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _getHealthStatus(status),
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: _getHealthStatusColor(status),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'BMI: ${bmi.toStringAsFixed(1)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      'Age: ${age ?? "N/A"}',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    Text(
                      bloodGroup,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: -0.2, duration: 300.ms);
  }

  Widget _buildVitalsGrid() {
    final heartRate = healthSummary?['latestVitals']?['heartRate'] ?? '--';
    final bloodOxygen = healthSummary?['latestVitals']?['bloodOxygen'] ?? '--';
    final temperature = healthSummary?['latestVitals']?['temperature'] ?? '--';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Vital Signs', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildVitalCard(
                icon: Icons.favorite,
                label: 'Heart Rate',
                value: '$heartRate',
                unit: 'BPM',
                color: Colors.red,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildVitalCard(
                icon: Icons.air,
                label: 'Oxygen',
                value: '$bloodOxygen',
                unit: '%',
                color: Colors.blue,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildVitalCard(
                icon: Icons.thermostat,
                label: 'Temperature',
                value: '$temperature',
                unit: '°F',
                color: Colors.orange,
              ),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.2, duration: 400.ms);
  }

  Widget _buildVitalCard({
    required IconData icon,
    required String label,
    required dynamic value,
    required String unit,
    required Color color,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: '$value',
                    style: TextStyle(
                      color: color,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextSpan(
                    text: ' $unit',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthMetrics() {
    final height = healthSummary?['height'] ?? '--';
    final weight = healthSummary?['weight'] ?? '--';
    final appointmentCount = healthSummary?['appointmentCount'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Health Metrics', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildMetricRow('Height', '$height cm'),
                const Divider(),
                _buildMetricRow('Weight', '$weight kg'),
                const Divider(),
                _buildMetricRow('Total Appointments', '$appointmentCount'),
              ],
            ),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.2, duration: 500.ms);
  }

  Widget _buildMetricRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: Theme.of(context).textTheme.bodyMedium),
        Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildTrendsSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('30-Day Trends', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children:
                  healthTrends.take(5).map((trend) {
                    return Column(
                      children: [
                        _buildTrendItem(trend),
                        if (healthTrends.indexOf(trend) < 4) const Divider(),
                      ],
                    );
                  }).toList(),
            ),
          ),
        ),
        const SizedBox(height: 24),
      ],
    ).animate().fadeIn(duration: 600.ms).slideY(begin: -0.2, duration: 600.ms);
  }

  Widget _buildTrendItem(Map<String, dynamic> trend) {
    final date = trend['date'] ?? 'N/A';
    final heartRate = trend['avgHeartRate'] ?? '--';
    final steps = trend['avgSteps'] ?? '--';

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(date, style: Theme.of(context).textTheme.bodyMedium),
            Text(
              'HR: $heartRate | Steps: $steps',
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: Colors.grey),
            ),
          ],
        ),
      ],
    );
  }
}
