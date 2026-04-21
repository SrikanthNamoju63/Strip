import 'package:flutter/material.dart';
import '../services/api_service.dart';

class RatingScreen extends StatefulWidget {
  final String appointmentId;
  const RatingScreen({super.key, required this.appointmentId});

  @override
  _RatingScreenState createState() => _RatingScreenState();
}

class _RatingScreenState extends State<RatingScreen> {
  int _rating = 5;
  final TextEditingController _reviewController = TextEditingController();
  bool _submitting = false;

  void _submit() async {
    setState(() => _submitting = true);
    final api = ApiService();
    final res = await api.submitRating(
      widget.appointmentId,
      _rating,
      null,
      _reviewController.text,
      true,
    );
    setState(() => _submitting = false);
    if (mounted) {
      if (res != null && res['success'] == true) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Rating submitted')));
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to submit rating')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Rate Appointment')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 12),
            Text(
              'Overall Rating',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Row(
              children: List.generate(5, (i) {
                final idx = i + 1;
                return IconButton(
                  onPressed: () => setState(() => _rating = idx),
                  icon: Icon(
                    idx <= _rating ? Icons.star : Icons.star_border,
                    color: Colors.amber,
                  ),
                );
              }),
            ),
            SizedBox(height: 12),
            TextField(
              controller: _reviewController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Write a short review (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            Spacer(),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                child:
                    _submitting
                        ? CircularProgressIndicator(color: Colors.white)
                        : Text('Submit Rating'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
