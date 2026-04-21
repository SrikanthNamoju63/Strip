import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class RescheduleAppointmentScreen extends StatefulWidget {
  final Map<String, dynamic> appointment;

  const RescheduleAppointmentScreen({super.key, required this.appointment});

  @override
  State<RescheduleAppointmentScreen> createState() =>
      _RescheduleAppointmentScreenState();
}

class _RescheduleAppointmentScreenState
    extends State<RescheduleAppointmentScreen> {
  DateTime _selectedDate = DateTime.now();
  String? _selectedSlot;
  List<dynamic> _availableSlots = [];
  bool _loadingSlots = false;
  bool _isProcessing = false;
  final TextEditingController _reasonController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Start with next day to avoid confusion or same day issues
    _selectedDate = DateTime.now().add(Duration(days: 1));
    _fetchSlots(_selectedDate);
  }

  Future<void> _fetchSlots(DateTime date) async {
    setState(() {
      _loadingSlots = true;
      _availableSlots = [];
      _selectedSlot = null;
    });

    try {
      final dateStr = date.toIso8601String().split('T')[0];
      final doctorId =
          widget.appointment['doctorId'] is Map
              ? widget.appointment['doctorId']['_id']
              : widget.appointment['doctorId'];

      final slots = await ApiService.getDoctorSlots(doctorId, dateStr);

      if (mounted) {
        setState(() {
          _availableSlots = slots; // Keep raw slot objects
          _loadingSlots = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingSlots = false);
    }
  }

  Future<void> _reschedule() async {
    if (_selectedSlot == null) return;
    if (_reasonController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Please enter a reason')));
        return;
    }

    setState(() => _isProcessing = true);

    try {
      final api = ApiService();
      final dateStr = _selectedDate.toIso8601String().split('T')[0];
      
      final result = await api.rescheduleAppointment(
        widget.appointment['_id'],
        dateStr,
        _selectedSlot!,
        _reasonController.text
      );

      setState(() => _isProcessing = false);

      if (mounted && result != null) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: Text("Rescheduled Successfully"),
            content: Text("Your appointment has been moved to $dateStr at $_selectedSlot.\nA confirmation has been sent."),
            actions: [
                TextButton(onPressed: () {
                    Navigator.pop(ctx); // Close Dialog
                    Navigator.pop(context); // Close Screen
                   // Optionally refresh profile
                }, child: Text("OK"))
            ],
          )
        );
      }
    } catch (e) {
      setState(() => _isProcessing = false);
       if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Reschedule Appointment", style: GoogleFonts.outfit()),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                "Select New Date & Time",
                style: GoogleFonts.outfit(
                    fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 16),
              // Date Picker Button
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(Duration(days: 60)),
                  );
                  if (picked != null) {
                    setState(() => _selectedDate = picked);
                    _fetchSlots(picked);
                  }
                },
                icon: Icon(Icons.calendar_today),
                label: Text(DateFormat('EEE, MMM dd, yyyy').format(_selectedDate)),
                style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                ),
              ),
              
              SizedBox(height: 24),

              // Slots
              if (_loadingSlots)
                Center(child: CircularProgressIndicator())
              else if (_availableSlots.isEmpty)
                Center(child: Text("No slots available", style: GoogleFonts.outfit(color: Colors.grey)))
              else
                 Wrap(
                    spacing: 12,
                    runSpacing: 12,
                    children: _availableSlots.map((slotObj) {
                        final slotTime = slotObj is Map ? slotObj['time'] : slotObj;
                        final status = slotObj is Map ? slotObj['status'] : 'available';
                        final isAvailable = status == 'available';
                        final isSelected = _selectedSlot == slotTime;

                        return IgnorePointer(
                            ignoring: !isAvailable,
                            child: ChoiceChip(
                                label: Text(slotTime),
                                selected: isSelected,
                                onSelected: (val) {
                                    setState(() => _selectedSlot = val ? slotTime : null);
                                },
                                disabledColor: Colors.grey.shade200,
                                selectedColor: Colors.blue.shade100,
                                labelStyle: TextStyle(
                                    color: !isAvailable ? Colors.grey : (isSelected ? Colors.blue : Colors.black)
                                ),
                            ),
                        );
                    }).toList(),
                 ),

                SizedBox(height: 32),
                TextField(
                    controller: _reasonController,
                    decoration: InputDecoration(
                        labelText: "Reason for Rescheduling",
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        hintText: "e.g. Work conflict, Feeling better..."
                    ),
                    maxLines: 3,
                ),

                SizedBox(height: 32),
                ElevatedButton(
                    onPressed: _isProcessing || _selectedSlot == null ? null : _reschedule,
                    style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        padding: EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                    ),
                    child: _isProcessing 
                        ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
                        : Text("Confirm Reschedule", style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                )
            ],
          ),
        ),
      ),
    );
  }
}
