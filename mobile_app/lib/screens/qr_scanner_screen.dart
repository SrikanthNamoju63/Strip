import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:google_fonts/google_fonts.dart';
import 'doctor_details_screen.dart';
import '../services/api_service.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  final MobileScannerController controller = MobileScannerController();
  bool _isProcessing = false;

  void _handleDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;
    
    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? rawValue = barcodes.first.rawValue;
      if (rawValue != null && rawValue.startsWith("healthpredict://doctor/")) {
        setState(() {
          _isProcessing = true;
        });

        final doctorId = rawValue.replaceFirst("healthpredict://doctor/", "");
        
        try {
          final apiService = ApiService();
          final doctorData = await apiService.getDoctorById(doctorId);
          
          if (!mounted) return;
          
          if (doctorData != null && doctorData['_id'] != null) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => DoctorDetailsScreen(doctor: doctorData),
              ),
            );
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Doctor not found or invalid QR.')),
            );
            setState(() {
              _isProcessing = false;
            });
            // Re-start scanner
          }
        } catch (e) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: $e')),
          );
          setState(() {
            _isProcessing = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If desktop, provide manual text field as fallback
    if (!kIsWeb && (Platform.isWindows || Platform.isLinux || Platform.isMacOS)) {
      return Scaffold(
        appBar: AppBar(title: const Text('Scan Doctor QR')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.qr_code_scanner, size: 80, color: Colors.blue),
                const SizedBox(height: 16),
                const Text("Scanner is not supported on Desktop."),
                const Text("Enter doctor ID to continue:"),
                const SizedBox(height: 16),
                TextField(
                  onSubmitted: (val) async {
                    if (val.isNotEmpty) {
                       final apiService = ApiService();
                       final data = await apiService.getDoctorById(val);
                       if (data != null && data['_id'] != null) {
                         Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => DoctorDetailsScreen(doctor: data)));
                       }
                    }
                  },
                  decoration: const InputDecoration(border: OutlineInputBorder(), hintText: "Doctor ID"),
                )
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Scan QR Code', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.yellow),
            onPressed: () => controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () => controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: _handleDetect,
          ),
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Text(
                  'Align QR code within the frame',
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 16),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }
}
