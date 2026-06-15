import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:convert';
import '../services/db_helper.dart';
import '../widgets/empty_state_widget.dart';
import 'add_medicine_screen.dart';
import 'medicine_history_screen.dart';

class MedicineRemindersScreen extends StatefulWidget {
  const MedicineRemindersScreen({super.key});

  @override
  State<MedicineRemindersScreen> createState() =>
      _MedicineRemindersScreenState();
}

class _MedicineRemindersScreenState extends State<MedicineRemindersScreen> {
  List<Map<String, dynamic>> reminders = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReminders();
  }

  Future<void> _loadReminders() async {
    setState(() => isLoading = true);
    try {
      final result = await DBHelper().getMedicines();
      if (mounted) {
        setState(() {
          reminders = result;
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading reminders: $e'))
        );
        setState(() => isLoading = false);
      }
    }
  }

  Future<void> _deleteReminder(int id) async {
    try {
      await DBHelper().deleteMedicine(id);
      if (mounted) {
         _loadReminders();
         ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('Reminder deleted')),
         );
      }
    } catch (e) {
       if (mounted) {
         ScaffoldMessenger.of(context).showSnackBar(
           SnackBar(content: Text('Error: $e'))
         );
       }
    }
  }

  void _navigateToAddMedicine() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const AddMedicineScreen()),
    );
    if (result == true) {
      _loadReminders();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('Medicine Reminders', style: GoogleFonts.outfit(color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        actions: [
          IconButton(
            icon: const Icon(Icons.history, color: Colors.blue),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const MedicineHistoryScreen()),
              );
            },
          )
        ],
      ),
      body: isLoading
          ? const Center(child: ConicLoader())
          : reminders.isEmpty
              ? const EmptyStateWidget(
                  title: 'No Reminders',
                  message: 'Add medicine reminders to stay on track',
                  icon: Icons.medication,
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: reminders.length,
                  itemBuilder: (context, index) {
                    final reminder = reminders[index];
                    return _ReminderCard(
                      reminder: reminder,
                      onDelete: () => _deleteReminder(reminder['id']),
                    ).animate().fadeIn(duration: (300 + index * 100).ms)
                     .slideX(begin: 0.2, curve: Curves.easeOut);
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToAddMedicine,
        backgroundColor: Colors.blue,
        icon: const Icon(Icons.add, color: Colors.white),
        label: Text('Add Medicine', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
    );
  }
}

class _ReminderCard extends StatelessWidget {
  final Map<String, dynamic> reminder;
  final VoidCallback onDelete;

  const _ReminderCard({required this.reminder, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    List<dynamic> times = [];
    try {
      times = jsonDecode(reminder['reminder_times'] ?? '[]');
    } catch (e) {
      // ignore
    }

    String nextDose = times.isNotEmpty ? times.first.toString() : 'N/A';
    
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ]
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        reminder['medicine_name'] ?? 'Medicine',
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        reminder['dosage'] ?? 'N/A',
                        style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey.shade600),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.access_time, size: 14, color: Colors.blue),
                      const SizedBox(width: 4),
                      Text(
                        nextDose,
                        style: GoogleFonts.outfit(fontSize: 14, color: Colors.blue, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
                PopupMenuButton(
                  icon: const Icon(Icons.more_vert, color: Colors.grey),
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      onTap: onDelete,
                      child: const Text('Delete'),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildInfoChip(Icons.restaurant, reminder['food_timing'] ?? 'N/A', Colors.orange),
                const SizedBox(width: 8),
                _buildInfoChip(Icons.calendar_today, reminder['frequency'] ?? 'Daily', Colors.purple),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.outfit(fontSize: 12, color: color, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
