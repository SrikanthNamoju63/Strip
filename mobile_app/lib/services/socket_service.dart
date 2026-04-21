import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'notification_service.dart';
import 'dart:async';

class SocketService {
  static final SocketService _instance = SocketService._internal();

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  io.Socket? socket;
  final NotificationService _notificationService = NotificationService();
  bool _isConnected = false;

  // Stream to allow UI components to listen to real-time updates
  final StreamController<Map<String, dynamic>> _eventStreamController =
      StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get eventStream => _eventStreamController.stream;

  void init() {
    // Determine URL. For Android Emulator: 10.0.2.2, for real device: LAN IP, for Windows: localhost
    const String socketUrl = 'http://localhost:6002';

    socket = io.io(socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
    });

    socket!.onConnect((_) {
      debugPrint('Socket connected');
      _isConnected = true;
      _joinRoom();
    });

    socket!.onDisconnect((_) {
      debugPrint('Socket disconnected');
      _isConnected = false;
    });

    socket!.on('notification', (data) async {
      _eventStreamController.add({'event': 'notification', 'data': data});
      
      // Check settings before showing
      final prefs = await SharedPreferences.getInstance();
      final bool notificationsEnabled =
          prefs.getBool('notifications_enabled') ?? true;

      if (notificationsEnabled) {
        _notificationService.showNotification(
          id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
          title: data['title'] ?? 'Notification',
          body: data['message'] ?? '',
          payload: data.toString(),
        );
      }
    });

    socket!.on('appointment_update', (data) {
      _eventStreamController.add({'event': 'appointment_update', 'data': data});
    });

    socket!.on('doctor_profile_update', (data) {
      _eventStreamController.add({'event': 'doctor_profile_update', 'data': data});
    });

    socket!.connect();
  }

  Future<void> _joinRoom() async {
    final prefs = await SharedPreferences.getInstance();
    final String? userId = prefs.getString(
      'user_id',
    ); // Assuming we store this on login

    if (userId != null) {
      socket!.emit('join_room', 'user_$userId');
      debugPrint('Joined room: user_$userId');
    }
  }

  void joinUserRoom(String userId) {
    if (_isConnected && socket != null) {
      socket!.emit('join_room', 'user_$userId');
      debugPrint('Joined room: user_$userId (manual update)');
    }
  }
}
