import 'dart:async';
import 'dart:math';
// import 'package:flutter_blue_plus/flutter_blue_plus.dart'; 

class SmartWatchService {
  bool _isMocking = false; // Default to false so we can trigger connect flow
  Timer? _mockTimer;
  final _controller = StreamController<Map<String, dynamic>>.broadcast();
  
  // Cumulative mock data
  int _totalSteps = 5400;

  Stream<Map<String, dynamic>> get dataStream => _controller.stream;
  bool get isConnected => _isMocking;

  Future<bool> connectToWatch() async {
    // Windows implementation requires separate plugin or mock
    // For this demo, we simulate connection success immediately
    await Future.delayed(const Duration(seconds: 2));
    _isMocking = true;
    _startDataEmission();
    return true;
  }

  void _startDataEmission() {
    _mockTimer?.cancel();
    _mockTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _totalSteps += Random().nextInt(10);
      
      final data = {
        'heartRate': 70 + Random().nextInt(30),
        'spo2': 96 + Random().nextInt(4),
        'steps': _totalSteps,
        'sleepHours': 7 + (Random().nextDouble() * 2), // 7.0 - 9.0
        'caloriesBurned': ( _totalSteps * 0.04 ).toInt(),
        'exerciseMinutes': 45,
        'waterIntake': 1500 + Random().nextInt(500),
        'womenHealth': {
          'cycleLength': 28,
          'lastPeriodDate': DateTime.now().subtract(const Duration(days: 12)).toIso8601String()
        }
      };
      
      _controller.add(data);
    });
  }

  void disconnect() {
    _mockTimer?.cancel();
    _isMocking = false;
  }
}
