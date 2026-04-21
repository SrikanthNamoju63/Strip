import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:async';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../widgets/empty_state_widget.dart';

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key});

  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen> {
  final ApiService _apiService = ApiService();
  List<dynamic> appointments = [];
  bool isLoading = true;
  String selectedStatus = 'all';
  int currentPage = 1;
  final int itemsPerPage = 10;
  StreamSubscription? _socketSubscription;

  @override
  void initState() {
    super.initState();
    _loadAppointments();
    
    // Listen for real-time socket events
    _socketSubscription = SocketService().eventStream.listen((event) {
      if (event['event'] == 'appointment_update' || event['event'] == 'notification') {
        _loadAppointments(isBackground: true);
      }
    });
  }

  @override
  void dispose() {
    _socketSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadAppointments({bool isBackground = false}) async {
    if (!isBackground) setState(() => isLoading = true);
    try {
      final result = await _apiService.getMyAppointments(
        status: selectedStatus == 'all' ? '' : selectedStatus,
        page: currentPage,
        limit: itemsPerPage,
      );

      if (result != null && mounted) {
        setState(() {
          appointments = result['appointments'] ?? [];
          isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading appointments: $e')),
        );
        setState(() => isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Appointments'), elevation: 0),
      body: Column(
        children: [
          // Status Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(16),
            child: Row(
              children:
                  ['all', 'pending', 'confirmed', 'completed', 'cancelled']
                      .map(
                        (status) => Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(status.capitalize()),
                            selected: selectedStatus == status,
                            onSelected: (selected) {
                              setState(() {
                                selectedStatus = status;
                                currentPage = 1;
                              });
                              _loadAppointments();
                            },
                          ),
                        ),
                      )
                      .toList(),
            ),
          ),
          // Appointments List
          Expanded(
            child:
                isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : appointments.isEmpty
                    ? EmptyStateWidget(
                      title: 'No Appointments',
                      message:
                          'You don\'t have any appointments yet. Book one now!',
                      onAction: () {
                        Navigator.pop(context);
                      },
                    )
                    : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: appointments.length,
                      itemBuilder: (context, index) {
                        final appt = appointments[index];
                        return _AppointmentCard(
                              appointment: appt,
                              onTap: () {
                                Navigator.pushNamed(
                                  context,
                                  '/appointment-detail',
                                  arguments: appt['_id'],
                                );
                              },
                            )
                            .animate()
                            .fadeIn(duration: 300.ms)
                            .slideX(
                              begin: 0.2,
                              duration: 300.ms,
                              curve: Curves.easeOut,
                            );
                      },
                    ),
          ),
        ],
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onTap;

  const _AppointmentCard({required this.appointment, required this.onTap});

  String _formatDate(String date) {
    try {
      final dt = DateTime.parse(date);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (e) {
      return date;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      case 'completed':
        return Colors.blue;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final doctor = appointment['doctorId'] ?? {};
    final status = appointment['status'] ?? 'pending';
    final appointmentDate = appointment['appointmentDate'] ?? '';
    final appointmentTime = appointment['appointmentTime'] ?? '';

    return GestureDetector(
      onTap: onTap,
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                          doctor['name'] ?? 'Unknown Doctor',
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          doctor['specialization'] ?? 'Specialist',
                          style: Theme.of(
                            context,
                          ).textTheme.bodySmall?.copyWith(color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(status).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      status.capitalize(),
                      style: TextStyle(
                        color: _getStatusColor(status),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _formatDate(appointmentDate),
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(width: 16),
                  const Icon(Icons.access_time, size: 16, color: Colors.grey),
                  const SizedBox(width: 8),
                  Text(
                    appointmentTime,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              if (appointment['notes'] != null &&
                  appointment['notes'].toString().isNotEmpty)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 12),
                    Text(
                      appointment['notes'],
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }
}

extension StringCapitalize on String {
  String capitalize() {
    if (isEmpty) return this;
    return this[0].toUpperCase() + substring(1).toLowerCase();
  }
}
