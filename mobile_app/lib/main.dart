import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/get_started_screen.dart';
import 'screens/home_screen.dart';
import 'screens/MyAppointmentsScreen.dart';
import 'screens/AppointmentDetailScreen.dart';
import 'screens/MedicineRemindersScreen.dart';
import 'screens/HealthDashboardScreen.dart';
import 'screens/PrescriptionsScreen.dart';
import 'screens/EmergencyContactsScreen.dart';
import 'screens/MedicalReportsScreen.dart';
import 'screens/HealthAnalysisScreen.dart';

import 'package:window_manager/window_manager.dart';
import 'services/notification_service.dart';
import 'dart:io';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:timezone/data/latest.dart' as tz;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();

  // Initialize timezone
  tz.initializeTimeZones();

  // Initialize sqflite for Windows/Desktop
  if (Platform.isWindows || Platform.isLinux || Platform.isMacOS) {
    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
  }

  // Initialize Notification Service
  try {
    await NotificationService().init();
  } catch (e) {
    debugPrint('Notification init error: $e');
  }

  WindowOptions windowOptions = const WindowOptions(
    size: Size(400, 800),
    center: true,
    title: 'Health Predict Mobile View',
  );

  windowManager.waitUntilReadyToShow(windowOptions, () async {
    await windowManager.show();
    await windowManager.focus();
  });

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Health Predict',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
        textTheme: GoogleFonts.outfitTextTheme(),
      ),
      home: const GetStartedScreen(),
      routes: {
        '/home': (context) => const HomeScreen(),
        '/my-appointments': (context) => const MyAppointmentsScreen(),
        '/medicine-reminders': (context) => const MedicineRemindersScreen(),
        '/health-dashboard': (context) => const HealthDashboardScreen(),
        '/prescriptions': (context) => const PrescriptionsScreen(),
        '/emergency-contacts': (context) => const EmergencyContactsScreen(),
        '/medical-reports': (context) => const MedicalReportsScreen(),
        '/health-analysis': (context) => const HealthAnalysisScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/appointment-detail') {
          final appointmentId = settings.arguments as String;
          return MaterialPageRoute(
            builder:
                (context) =>
                    AppointmentDetailScreen(appointmentId: appointmentId),
          );
        }
        return null;
      },
    );
  }
}
