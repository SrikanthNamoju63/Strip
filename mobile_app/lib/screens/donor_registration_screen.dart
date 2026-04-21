import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class DonorRegistrationScreen extends StatefulWidget {
  const DonorRegistrationScreen({super.key});

  @override
  State<DonorRegistrationScreen> createState() =>
      _DonorRegistrationScreenState();
}

class _DonorRegistrationScreenState extends State<DonorRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();

  bool _isLoading = false;

  // Form Fields
  String? _selectedBloodGroup;
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  bool _isDateSet = false;
  DateTime _lastDonationDate = DateTime.now();
  Map<String, dynamic>? _userProfile; // Added missing variable

  // Specific Questions
  bool _isFirstTimeDonor = false;
  bool _consumedAlcohol = false;
  bool _isSmoker = false;

  final List<String> _bloodGroups = [
    'A+',
    'A-',
    'B+',
    'B-',
    'AB+',
    'AB-',
    'O+',
    'O-',
  ];

  @override
  void initState() {
    super.initState();
    _fetchUserProfile();
  }

  Future<void> _fetchUserProfile() async {
    final profile = await _apiService.getUserProfile();
    if (profile != null) {
      setState(() {
        _userProfile = profile;
        if (profile['weight'] != null) {
          _weightController.text = profile['weight'].toString();
        }
        if (profile['age'] != null) {
          _ageController.text = profile['age'].toString();
        }
        // Calculate age if not set but DOB is
        if (profile['age'] == null && profile['dob'] != null) {
          final dob = DateTime.parse(profile['dob']);
          final age = DateTime.now().year - dob.year;
          _ageController.text = age.toString();
        }
        if (profile['bloodGroup'] != null) {
          _selectedBloodGroup = profile['bloodGroup'];
        }
      });
    }
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;

    // Custom Validation
    if (!_isFirstTimeDonor && !_isDateSet) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select last donation date')),
      );
      return;
    }

    setState(() => _isLoading = true);

    // Eligibility Check Logic (Visual mainly, backend enforces too)
    int age = int.tryParse(_ageController.text) ?? 0;
    double weight = double.tryParse(_weightController.text) ?? 0;

    if (age < 18) {
      _showError('You must be 18+ to donate blood.');
      return;
    }
    if (weight < 50) {
      _showError('Weight must be at least 50kg.');
      return;
    }
    if (_consumedAlcohol) {
      _showError('Cannot donate if alcohol consumed in last 48hrs.');
      return;
    }

    // Construct Payload
    Map<String, dynamic> donorData = {
      'bloodGroup': _selectedBloodGroup,
      'age': age,
      'weight': weight,
      'alcoholic': _consumedAlcohol,
      'smoking': _isSmoker,
      'lastDonationDate':
          _isFirstTimeDonor ? null : _lastDonationDate.toIso8601String(),
    };

    final success = await _apiService.registerDonor(donorData);

    setState(() => _isLoading = false);

    if (success) {
      if (mounted) {
        showDialog(
          context: context,
          builder:
              (ctx) => AlertDialog(
                title: const Text('Registered Successfully!'),
                content: const Text(
                  'Thank you for becoming a donor. You are now visible to those in need.',
                ),
                actions: [
                  TextButton(
                    onPressed: () {
                      Navigator.pop(ctx); // Close dialog
                      Navigator.pop(context, true); // Go back to finder
                    },
                    child: const Text('OK'),
                  ),
                ],
              ),
        );
      }
    } else {
      _showError('Registration failed. Please try again.');
    }
  }

  void _showError(String msg) {
    setState(() => _isLoading = false);
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Donor Registration',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Become a Hero',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Please verify your details below to register.',
                style: GoogleFonts.outfit(color: Colors.grey.shade600),
              ),
              const SizedBox(height: 32),

              // Basic Details
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Age',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        suffixText: 'yrs',
                      ),
                      validator:
                          (v) => (v == null || v.isEmpty) ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _weightController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Weight',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        suffixText: 'kg',
                      ),
                      validator:
                          (v) => (v == null || v.isEmpty) ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _selectedBloodGroup,
                decoration: InputDecoration(
                  labelText: 'Blood Group',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                items:
                    _bloodGroups
                        .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                        .toList(),
                onChanged: (v) => setState(() => _selectedBloodGroup = v),
                validator: (v) => v == null ? 'Required' : null,
              ),

              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),

              Text(
                'Health & Lifestyle',
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),

              SwitchListTile(
                title: Text(
                  'Consumed alcohol in last 48 hrs?',
                  style: GoogleFonts.outfit(),
                ),
                value: _consumedAlcohol,
                onChanged: (v) => setState(() => _consumedAlcohol = v),
                activeColor: Colors.red,
              ),
              SwitchListTile(
                title: Text('Do you smoke?', style: GoogleFonts.outfit()),
                value: _isSmoker,
                onChanged: (v) => setState(() => _isSmoker = v),
                activeColor: Colors.red,
              ),

              const SizedBox(height: 16),
              CheckboxListTile(
                title: Text(
                  'First time donor?',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
                ),
                value: _isFirstTimeDonor,
                onChanged: (v) => setState(() => _isFirstTimeDonor = v!),
                activeColor: Colors.red,
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),

              if (!_isFirstTimeDonor) ...[
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now(),
                      firstDate: DateTime(2000),
                      lastDate: DateTime.now(),
                    );
                    if (picked != null) {
                      setState(() {
                        _lastDonationDate = picked;
                        _isDateSet = true;
                      });
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      vertical: 16,
                      horizontal: 12,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _isDateSet
                              ? 'Last Donation: ${DateFormat('dd MMM yyyy').format(_lastDonationDate)}'
                              : 'Select Last Donation Date',
                          style: GoogleFonts.outfit(),
                        ),
                        const Icon(Icons.calendar_today, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
              ],

              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitRegistration,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child:
                      _isLoading
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                          : Text(
                            'Register as Donor',
                            style: GoogleFonts.outfit(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
