import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/smart_watch_service.dart';
import '../services/api_service.dart';

class HealthMonitorScreen extends StatefulWidget {
  const HealthMonitorScreen({super.key});

  @override
  State<HealthMonitorScreen> createState() => _HealthMonitorScreenState();
}

class _HealthMonitorScreenState extends State<HealthMonitorScreen> {
  final SmartWatchService _watchService = SmartWatchService();
  final ApiService _apiService = ApiService();

  bool _isConnected = false;
  bool _isConnecting = false;
  Map<String, dynamic> _currentData = {};

  final List<Map<String, dynamic>> _dataBuffer = [];
  Timer? _uploadTimer;

  Map<String, dynamic>? _userProfile;
  Map<String, dynamic>? _analysisResult;
  bool _analyzing = false;
  String? _analysisError;

  @override
  void initState() {
    super.initState();
    _checkConnection();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    final profile = await _apiService.getUserProfile();
    if (mounted) {
      setState(() => _userProfile = profile);
    }
  }

  void _checkConnection() {
    setState(() {
      _isConnected = _watchService.isConnected;
    });

    if (_isConnected) {
      _startListening();
    }
  }

  void _startListening() {
    _watchService.dataStream.listen((data) {
      if (mounted) {
        setState(() {
          _currentData = data;
        });

        // Add to buffer for upload
        _dataBuffer.add(data);

        // Upload every 10 data points or so (every 30 seconds)
        if (_dataBuffer.length >= 5) {
          _flushBuffer();
        }
      }
    });
  }

  Future<void> _flushBuffer() async {
    if (_dataBuffer.isEmpty) return;
    final dataToSend = _dataBuffer.last; // Send latest snapshot
    _dataBuffer.clear();
    await _apiService.sendHealthReading(dataToSend);
  }

  Future<void> _connect() async {
    setState(() => _isConnecting = true);
    final success = await _watchService.connectToWatch();
    if (success) {
      setState(() {
        _isConnected = true;
        _isConnecting = false;
      });
      _startListening();
    } else {
      setState(() => _isConnecting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to connect to watch')),
        );
      }
    }
  }

  Future<void> _analyze() async {
    setState(() {
      _analyzing = true;
      _analysisError = null;
    });

    final result = await _apiService.analyzeHealth();

    if (mounted) {
      setState(() {
        _analyzing = false;
        if (result != null) {
          if (result['canAnalyze'] == false) {
            _analysisError = result['message'];
          } else {
            _analysisResult = result['analysis'];
          }
        } else {
          _analysisError = "Analysis service unavailable";
        }
      });

      if (_analysisError != null) {
        _showAnalysisDialog("Analysis Pending", _analysisError!);
      } else if (_analysisResult != null) {
        _showResultsDialog(_analysisResult!);
      }
    }
  }

  void _showAnalysisDialog(String title, String message) {
    showDialog(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: Text(
              title,
              style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
            ),
            content: Text(message, style: GoogleFonts.outfit()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          ),
    );
  }

  void _showResultsDialog(Map<String, dynamic> analysis) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (ctx) => Container(
            padding: const EdgeInsets.all(24),
            height: MediaQuery.of(context).size.height * 0.8,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Health AI Report",
                  style: GoogleFonts.outfit(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:
                        analysis['riskLevel'] == 'High'
                            ? Colors.red.shade50
                            : Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.health_and_safety,
                        color:
                            analysis['riskLevel'] == 'High'
                                ? Colors.red
                                : Colors.green,
                      ),
                      const SizedBox(width: 12),
                      Text(
                        "Risk Level: ${analysis['riskLevel']}",
                        style: GoogleFonts.outfit(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  "Analysis",
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  analysis['analysisText'] ?? 'No detail provided.',
                  style: GoogleFonts.outfit(color: Colors.grey.shade700),
                ),
                const SizedBox(height: 24),
                Text(
                  "Recommendations",
                  style: GoogleFonts.outfit(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                ...(analysis['recommendations'] as List<dynamic>? ?? [])
                    .map(
                      (rec) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.check_circle_outline,
                              size: 16,
                              color: Colors.blue,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                rec.toString(),
                                style: GoogleFonts.outfit(),
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                    ,
              ],
            ),
          ),
    );
  }

  @override
  void dispose() {
    _watchService.disconnect();
    _uploadTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text(
          'Health Monitor',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.black,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        actions: [
          if (_isConnected)
            IconButton(icon: const Icon(Icons.sync), onPressed: _flushBuffer),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            _buildStatusCard(),

            const SizedBox(height: 24),

            if (_isConnected) ...[
              Text(
                "Live Readings",
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _buildGrid(),

              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _analyzing ? null : _analyze,
                  icon:
                      _analyzing
                          ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: ConicLoader(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                          : const Icon(Icons.auto_awesome),
                  label: Text(
                    _analyzing
                        ? "Analyzing Data..."
                        : "Analyze Health Risks (AI)",
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple.shade700,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Center(
                child: Text(
                  "Requires min 5 hours of gathered data",
                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey),
                ),
              ),
            ] else ...[
              const Center(
                child: Padding(
                  padding: EdgeInsets.only(top: 100),
                  child: Text("Connect watch to start monitoring"),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _isConnected ? Colors.blue.shade600 : Colors.grey.shade800,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color:
                _isConnected
                    ? Colors.blue.withValues(alpha: 0.3)
                    : Colors.black12,
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            _isConnected ? Icons.watch : Icons.watch_off_outlined,
            color: Colors.white,
            size: 40,
          ),
          const SizedBox(height: 16),
          Text(
            _isConnected ? "Smart Watch Connected" : "Device Disconnected",
            style: GoogleFonts.outfit(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _isConnected
                ? "Syncing data in realtime..."
                : "Connect to track your vitals",
            style: GoogleFonts.outfit(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 20),
          if (!_isConnected)
            ElevatedButton(
              onPressed: _isConnecting ? null : _connect,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child:
                  _isConnecting
                      ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: ConicLoader(strokeWidth: 2),
                      )
                      : const Text("Connect Device"),
            ),
        ],
      ),
    );
  }

  Widget _buildGrid() {
    return LayoutBuilder(
      builder: (context, constraints) {
        return Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _buildMetricCard(
              Icons.favorite,
              "Heart Rate",
              "${_currentData['heartRate'] ?? '--'}",
              "bpm",
              Colors.red,
            ),
            _buildMetricCard(
              Icons.water_drop,
              "SpO2",
              "${_currentData['spo2'] ?? '--'}",
              "%",
              Colors.blue,
            ),
            _buildMetricCard(
              Icons.directions_walk,
              "Steps",
              "${_currentData['steps'] ?? '--'}",
              "",
              Colors.orange,
            ),
            _buildMetricCard(
              Icons.bedtime,
              "Sleep",
              double.tryParse(_currentData['sleepHours']?.toString() ?? '0')?.toStringAsFixed(1) ?? '--',
              "hrs",
              Colors.indigo,
            ),
            _buildMetricCard(
              Icons.local_fire_department,
              "Calories",
              "${_currentData['caloriesBurned'] ?? '--'}",
              "kcal",
              Colors.deepOrange,
            ),
            _buildMetricCard(
              Icons.fitness_center,
              "Exercise",
              "${_currentData['exerciseMinutes'] ?? '--'}",
              "min",
              Colors.green,
            ),
            _buildMetricCard(
              Icons.local_drink,
              "Water",
              "${_currentData['waterIntake'] ?? '--'}",
              "ml",
              Colors.cyan,
            ),
            if (_userProfile?['gender'] == 'Female' ||
                _currentData['womenHealth'] != null)
              _buildMetricCard(
                Icons.woman,
                "Cycle",
                "${_currentData['womenHealth']?['cycleLength'] ?? '--'}",
                "days",
                Colors.pink,
              ),
          ],
        );
      },
    );
  }

  Widget _buildMetricCard(
    IconData icon,
    String title,
    String value,
    String unit,
    Color color,
  ) {
    final width = (MediaQuery.of(context).size.width - 56) / 2; // 2 cols
    return Container(
      width: width,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: GoogleFonts.outfit(
              color: Colors.grey.shade600,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(width: 4),
              Text(
                unit,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  color: Colors.grey.shade400,
                ),
              ),
            ],
          ),
        ],
      ),
    ); // Removed animation that was hiding empty cards
  }
}
