import 'dart:io';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import '../services/api_service.dart';

class FeedbackScreen extends StatefulWidget {
  const FeedbackScreen({super.key});

  @override
  _FeedbackScreenState createState() => _FeedbackScreenState();
}

class _FeedbackScreenState extends State<FeedbackScreen> {
  final _formKey = GlobalKey<FormState>();
  String _selectedType = 'BUG';
  final _textController = TextEditingController();
  bool _isLoading = false;
  final ApiService _apiService = ApiService();

  final List<String> _feedbackTypes = ['BUG', 'FEATURE', 'GENERAL', 'EXPERIENCE'];

  Future<void> _submitFeedback() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      // Get App Version
      final packageInfo = await PackageInfo.fromPlatform();
      final appVersion = '${packageInfo.version}+${packageInfo.buildNumber}';

      // Get Device Info
      final deviceInfoPlugin = DeviceInfoPlugin();
      String deviceInfoString = 'Unknown';

      if (Platform.isAndroid) {
        final androidInfo = await deviceInfoPlugin.androidInfo;
        deviceInfoString =
            '${androidInfo.brand} ${androidInfo.model} (SDK ${androidInfo.version.sdkInt})';
      } else if (Platform.isWindows) {
        final windowsInfo = await deviceInfoPlugin.windowsInfo;
        deviceInfoString = windowsInfo.productName;
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfoPlugin.iosInfo;
        deviceInfoString = '${iosInfo.name} ${iosInfo.systemName} ${iosInfo.systemVersion}';
      }

      final result = await _apiService.submitFeedback(
        _selectedType,
        _textController.text,
        appVersion,
        deviceInfoString,
      );

      if (result != null && result['success'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Thank you for your feedback!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      } else {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit feedback. Please try again.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('An error occurred: $e')),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('App Feedback'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'We value your feedback!',
                style: Theme.of(context).textTheme.titleLarge,
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 8),
              Text(
                'Help us improve the app by reporting bugs or suggesting features.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
              ),
              SizedBox(height: 24),
              DropdownButtonFormField<String>(
                value: _selectedType,
                decoration: InputDecoration(
                  labelText: 'Feedback Type',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(_getIconForType(_selectedType)),
                ),
                items: _feedbackTypes.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(_formatType(type)),
                  );
                }).toList(),
                onChanged: (value) {
                  if (value != null) setState(() => _selectedType = value);
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _textController,
                decoration: InputDecoration(
                  labelText: 'Your Feedback',
                  border: OutlineInputBorder(),
                  alignLabelWithHint: true,
                ),
                maxLines: 5,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter your feedback';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitFeedback,
                style: ElevatedButton.styleFrom(
                  padding: EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text(
                        'Submit Feedback',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatType(String type) {
    switch (type) {
      case 'BUG':
        return 'Bug Report';
      case 'FEATURE':
        return 'Feature Request';
      case 'GENERAL':
        return 'General Feedback';
      case 'EXPERIENCE':
        return 'App Experience';
      default:
        return type;
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'BUG':
        return Icons.bug_report;
      case 'FEATURE':
        return Icons.lightbulb;
      case 'GENERAL':
        return Icons.comment;
      case 'EXPERIENCE':
        return Icons.sentiment_satisfied;
      default:
        return Icons.feedback;
    }
  }
}
