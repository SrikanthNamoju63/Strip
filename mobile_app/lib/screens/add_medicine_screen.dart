import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import '../services/db_helper.dart';
import '../services/notification_service.dart';

class AddMedicineScreen extends StatefulWidget {
  const AddMedicineScreen({super.key});

  @override
  State<AddMedicineScreen> createState() => _AddMedicineScreenState();
}

class _AddMedicineScreenState extends State<AddMedicineScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _dosageController = TextEditingController();
  final _notesController = TextEditingController();

  String _foodTiming = 'After Food';
  final List<String> _foodTimingOptions = [
    'Before Food',
    'After Food',
    'With Food'
  ];

  List<TimeOfDay> _reminderTimes = [TimeOfDay.now()];

  String _frequency = 'Every Day';
  final List<String> _frequencyOptions = ['Every Day', 'Specific Days'];

  // 0=Mon, 1=Tue... 6=Sun
  List<bool> _selectedDays = List.filled(7, false);

  String _reminderOffset = 'Exact time';
  final List<String> _offsetOptions = [
    '10 minutes before',
    '5 minutes before',
    'Exact time',
    '10 minutes after'
  ];

  DateTime _startDate = DateTime.now();
  DateTime? _endDate;

  bool _isSaving = false;

  void _addReminderTime() async {
    final TimeOfDay? time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (time != null) {
      setState(() {
        _reminderTimes.add(time);
      });
    }
  }

  void _removeReminderTime(int index) {
    setState(() {
      _reminderTimes.removeAt(index);
    });
  }

  void _selectStartDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime(2100),
    );
    if (picked != null && picked != _startDate) {
      setState(() {
        _startDate = picked;
      });
    }
  }

  void _selectEndDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endDate ?? _startDate,
      firstDate: _startDate,
      lastDate: DateTime(2100),
    );
    if (picked != null) {
      setState(() {
        _endDate = picked;
      });
    }
  }

  Future<void> _saveMedicine() async {
    if (!_formKey.currentState!.validate()) return;
    if (_reminderTimes.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one reminder time')),
      );
      return;
    }
    if (_frequency == 'Specific Days' && !_selectedDays.contains(true)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one day')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      // Prepare data
      List<String> formattedTimes = _reminderTimes.map((t) {
        final now = DateTime.now();
        final dt = DateTime(now.year, now.month, now.day, t.hour, t.minute);
        return DateFormat('HH:mm').format(dt);
      }).toList();

      List<int> activeDaysIndex = [];
      if (_frequency == 'Specific Days') {
        for (int i = 0; i < _selectedDays.length; i++) {
          if (_selectedDays[i]) activeDaysIndex.add(i + 1); // 1 = Monday, 7 = Sunday
        }
      }

      final Map<String, dynamic> medicineData = {
        'medicine_name': _nameController.text,
        'dosage': _dosageController.text,
        'food_timing': _foodTiming,
        'reminder_times': jsonEncode(formattedTimes),
        'frequency': _frequency,
        'days': jsonEncode(activeDaysIndex),
        'start_date': DateFormat('yyyy-MM-dd').format(_startDate),
        'end_date': _endDate != null ? DateFormat('yyyy-MM-dd').format(_endDate!) : null,
        'notes': _notesController.text,
        'reminder_offset': _reminderOffset,
      };

      final int id = await DBHelper().insertMedicine(medicineData);

      // Schedule notifications for next 7 days (as an example)
      await _scheduleNotifications(id, formattedTimes, activeDaysIndex);

      if (mounted) {
        Navigator.pop(context, true); // Return true indicating success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  Future<void> _scheduleNotifications(int medicineId, List<String> times, List<int> activeDaysIndex) async {
    int offsetMinutes = 0;
    if (_reminderOffset == '10 minutes before') offsetMinutes = -10;
    if (_reminderOffset == '5 minutes before') offsetMinutes = -5;
    if (_reminderOffset == '10 minutes after') offsetMinutes = 10;

    final now = DateTime.now();
    
    // We schedule for the next 7 days statically. 
    // In a real app, you might use a background job to schedule continuously.
    for (int i = 0; i < 7; i++) {
      DateTime checkDate = now.add(Duration(days: i));
      
      // Check date bounds
      if (checkDate.isBefore(DateTime(_startDate.year, _startDate.month, _startDate.day))) continue;
      if (_endDate != null) {
        if (checkDate.isAfter(_endDate!.add(const Duration(days: 1)))) continue;
      }

      // Check frequency
      if (_frequency == 'Specific Days') {
        if (!activeDaysIndex.contains(checkDate.weekday)) continue; // weekday: 1=Mon, 7=Sun
      }

      for (String t in times) {
        final parts = t.split(':');
        final hour = int.parse(parts[0]);
        final min = int.parse(parts[1]);

        DateTime scheduledTime = DateTime(
          checkDate.year,
          checkDate.month,
          checkDate.day,
          hour,
          min,
        ).add(Duration(minutes: offsetMinutes));

        if (scheduledTime.isAfter(now)) {
          // Generate a more unique, smaller integer ID by wrapping or hashing
          // using modulo to avoid 32-bit int bounds on Android Local Notifications
          int notificationId = (medicineId * 10000 + i * 100 + hour * 10 + min).abs() % 2147483647;

          await NotificationService().scheduleMedicineReminder(
            id: notificationId,
            title: 'Time to take your medicine',
            body: '${_nameController.text} ${_dosageController.text}\n$_foodTiming',
            scheduledTime: scheduledTime,
            payload: medicineId.toString(),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('Add Medicine', style: GoogleFonts.outfit(color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('Medicine Details'),
              _buildCard(
                child: Column(
                  children: [
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Medicine Name',
                        hintText: 'Example: Paracetamol',
                        border: InputBorder.none,
                      ),
                      validator: (value) => value == null || value.isEmpty ? 'Required' : null,
                    ),
                    const Divider(),
                    TextFormField(
                      controller: _dosageController,
                      decoration: const InputDecoration(
                        labelText: 'Dosage',
                        hintText: 'Example: 1 Tablet / 5ml',
                        border: InputBorder.none,
                      ),
                    ),
                    const Divider(),
                    DropdownButtonFormField<String>(
                      value: _foodTiming,
                      decoration: const InputDecoration(
                        labelText: 'Food Timing',
                        border: InputBorder.none,
                      ),
                      items: _foodTimingOptions
                          .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                          .toList(),
                      onChanged: (val) => setState(() => _foodTiming = val!),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              _buildSectionTitle('Reminder Schedule'),
              _buildCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Reminder Times'),
                        TextButton.icon(
                          onPressed: _addReminderTime,
                          icon: const Icon(Icons.add),
                          label: const Text('Add Time'),
                        )
                      ],
                    ),
                    Wrap(
                      spacing: 8.0,
                      children: _reminderTimes.asMap().entries.map((entry) {
                        int idx = entry.key;
                        TimeOfDay t = entry.value;
                        return Chip(
                          label: Text(t.format(context)),
                          onDeleted: () => _removeReminderTime(idx),
                          backgroundColor: Colors.blue.shade50,
                        );
                      }).toList(),
                    ),
                    const Divider(),
                    DropdownButtonFormField<String>(
                      value: _frequency,
                      decoration: const InputDecoration(
                        labelText: 'Reminder Frequency',
                        border: InputBorder.none,
                      ),
                      items: _frequencyOptions
                          .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                          .toList(),
                      onChanged: (val) => setState(() => _frequency = val!),
                    ),
                    if (_frequency == 'Specific Days') ...[
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: ['M', 'T', 'W', 'T', 'F', 'S', 'S']
                              .asMap()
                              .entries
                              .map((entry) {
                            int idx = entry.key;
                            String day = entry.value;
                            bool isSelected = _selectedDays[idx];
                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedDays[idx] = !isSelected;
                                });
                              },
                              child: Container(
                                margin: const EdgeInsets.only(right: 8),
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.blue : Colors.grey.shade200,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  day,
                                  style: TextStyle(
                                    color: isSelected ? Colors.white : Colors.black54,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 24),
              _buildSectionTitle('Preferences & Duration'),
              _buildCard(
                child: Column(
                  children: [
                    DropdownButtonFormField<String>(
                      value: _reminderOffset,
                      decoration: const InputDecoration(
                        labelText: 'Reminder Offset',
                        border: InputBorder.none,
                      ),
                      items: _offsetOptions
                          .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                          .toList(),
                      onChanged: (val) => setState(() => _reminderOffset = val!),
                    ),
                    const Divider(),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: _selectStartDate,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Start Date', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text(DateFormat('dd MMM yyyy').format(_startDate)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Container(width: 1, height: 40, color: Colors.grey.shade300),
                        Expanded(
                          child: InkWell(
                            onTap: _selectEndDate,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('End Date (Optional)', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                                  const SizedBox(height: 4),
                                  Text(_endDate != null ? DateFormat('dd MMM yyyy').format(_endDate!) : 'Not set'),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              _buildCard(
                child: TextFormField(
                  controller: _notesController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    hintText: 'Take with warm water...',
                    border: InputBorder.none,
                  ),
                ),
              ),

              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveMedicine,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isSaving
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text('Save Medicine', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.black87,
        ),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}
