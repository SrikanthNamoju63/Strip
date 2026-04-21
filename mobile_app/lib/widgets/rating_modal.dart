import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';

class RatingModal extends StatefulWidget {
  final Map<String, dynamic> appointmentData;
  final VoidCallback onRatingSubmitted;

  const RatingModal({
    super.key,
    required this.appointmentData,
    required this.onRatingSubmitted,
  });

  @override
  State<RatingModal> createState() => _RatingModalState();
}

class _RatingModalState extends State<RatingModal> {
  int _rating = 0;
  final TextEditingController _feedbackController = TextEditingController();
  bool _isSubmitting = false;

  void _submitRating() async {
    if (_rating == 0) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a star rating')),
        );
      }
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final api = ApiService();
      final response = await api.submitRating(
        widget.appointmentData['appointmentId'],
        _rating,
        null, // serviceRatings
        _feedbackController.text,
        true, // wouldRecommend
      );

      if (response != null && response['success'] == true) {
        if (mounted) {
          Navigator.of(context).pop(); // Close modal
          widget.onRatingSubmitted(); // Callback to refresh or show next
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Thank you for your feedback!')),
          );
        }
      } else {
        throw Exception(response?['message'] ?? 'Failed to submit');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.appointmentData;
    final doctorName = data['doctorName'] ?? 'Doctor';
    final hospitalName = data['hospitalName'] ?? 'Clinic';
    final date =
        data['appointmentDate'] != null
            ? data['appointmentDate'].toString().split('T')[0]
            : '';
    final time = data['appointmentTime'] ?? '';
    final photoUrl = data['doctorPhoto'];

    return PopScope(
      canPop: false, // Prevent closing by back button
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Rate Your Visit',
                style: GoogleFonts.outfit(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),

              // Doctor Info
              Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundImage:
                        photoUrl != null
                            ? NetworkImage(
                              '${ApiService.baseUrl.replaceAll('/api', '')}/${photoUrl.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '')}',
                            )
                            : null,
                    backgroundColor: Colors.blue.shade100,
                    child:
                        photoUrl == null
                            ? Text(
                              doctorName.isNotEmpty ? doctorName[0] : 'Dr',
                              style: GoogleFonts.outfit(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                            : null,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          doctorName,
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          hospitalName,
                          style: GoogleFonts.outfit(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$date • $time',
                          style: GoogleFonts.outfit(
                            color: Colors.blue,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),

              // Star Rating
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final isSelected = index < _rating;
                  return IconButton(
                    onPressed: () {
                      setState(() {
                        _rating = index + 1;
                      });
                    },
                    icon: Icon(
                          isSelected ? Icons.star : Icons.star_border,
                          key: ValueKey(
                            isSelected,
                          ), // Triggers animation on state change
                          color: Colors.amber,
                          size: 32,
                        )
                        .animate()
                        .scale(
                          duration: 400.ms,
                          curve: Curves.easeOutBack,
                          begin: const Offset(0.6, 0.6),
                          end: const Offset(1, 1),
                        )
                        .fadeIn(duration: 200.ms),
                  );
                }),
              ),

              const SizedBox(height: 16),

              // Feedback Text
              TextField(
                controller: _feedbackController,
                decoration: InputDecoration(
                  hintText: 'Describe your experience (optional)',
                  hintStyle: GoogleFonts.outfit(color: Colors.grey),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 12,
                  ),
                ),
                maxLines: 3,
              ),

              const SizedBox(height: 24),

              // Buttons
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed:
                          () => Navigator.of(context).pop(), // Skip for now
                      child: Text(
                        'Skip',
                        style: GoogleFonts.outfit(color: Colors.grey),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitRating,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child:
                          _isSubmitting
                              ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                              : Text(
                                'Submit',
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                    ),
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
