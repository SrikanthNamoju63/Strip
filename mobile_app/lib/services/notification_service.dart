import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:intl/intl.dart';
import 'dart:io';
import 'db_helper.dart';

@pragma('vm:entry-point')
void notificationTapBackground(NotificationResponse notificationResponse) {
  // Handle background tap
  NotificationService().handleAction(notificationResponse);
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();

  factory NotificationService() {
    return _instance;
  }

  NotificationService._internal();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  Future<void> init() async {
    if (_initialized) return;

    // Android initialization
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    final InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      // iOS: const DarwinInitializationSettings(),
    );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse details) {
        handleAction(details);
      },
      onDidReceiveBackgroundNotificationResponse: notificationTapBackground,
    );
    
    // Request permissions for Android 13+
    await flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();

    _initialized = true;
  }

  void handleAction(NotificationResponse details) async {
    if (details.payload != null && details.actionId != null) {
      final medicineId = int.tryParse(details.payload!);
      if (medicineId != null) {
        final now = DateTime.now();
        final dateStr = DateFormat('yyyy-MM-dd').format(now);
        final timeStr = DateFormat('hh:mm a').format(now);
        
        String status = 'Missed';
        if (details.actionId == 'action_taken') {
          status = 'Taken';
        } else if (details.actionId == 'action_skip') {
          status = 'Skipped';
        }

        await DBHelper().insertHistory({
          'medicine_id': medicineId,
          'date': dateStr,
          'time': timeStr,
          'status': status,
        });
      }
    }
  }

  Future<void> scheduleMedicineReminder({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledTime,
    required String payload,
  }) async {
    if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
      // Scheduled notifications are not fully supported on desktop platforms yet
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final bool isEnabled = prefs.getBool('notifications_enabled') ?? true;
    
    if (!isEnabled) return;

    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'medicine_reminder_channel',
      'Medicine Reminders',
      channelDescription: 'Notifications for medicine reminders',
      importance: Importance.max,
      priority: Priority.high,
      actions: <AndroidNotificationAction>[
        AndroidNotificationAction('action_taken', 'Taken',
            showsUserInterface: true),
        AndroidNotificationAction('action_skip', 'Skip',
            showsUserInterface: true),
      ],
    );
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);

    if (scheduledTime.isBefore(DateTime.now())) {
       return; // time already passed
    }

    try {
      await flutterLocalNotificationsPlugin.zonedSchedule(
        id,
        title,
        body,
        tz.TZDateTime.from(scheduledTime, tz.local),
        platformChannelSpecifics,
        androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
        payload: payload,
      );
    } catch (e) {
      // Catch UnimplementedError or any other error so it doesn't crash the save process
      print('Notification scheduling error: $e');
    }
  }

  Future<void> cancelReminder(int id) async {
    await flutterLocalNotificationsPlugin.cancel(id);
  }

  Future<void> showNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    // Check if notifications are enabled in settings
    final prefs = await SharedPreferences.getInstance();
    final bool isEnabled = prefs.getBool('notifications_enabled') ?? true;
    
    if (!isEnabled) {
      return; // Do not show notification
    }

    const AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'your_channel_id',
      'your_channel_name',
      channelDescription: 'your_channel_description',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker',
    );
    const NotificationDetails platformChannelSpecifics =
        NotificationDetails(android: androidPlatformChannelSpecifics);
    
    await flutterLocalNotificationsPlugin.show(
      id,
      title,
      body,
      platformChannelSpecifics,
      payload: payload,
    );
  }
}
