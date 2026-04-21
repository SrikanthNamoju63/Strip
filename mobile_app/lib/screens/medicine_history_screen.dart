import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/db_helper.dart';

class MedicineHistoryScreen extends StatefulWidget {
  const MedicineHistoryScreen({super.key});

  @override
  State<MedicineHistoryScreen> createState() => _MedicineHistoryScreenState();
}

class _MedicineHistoryScreenState extends State<MedicineHistoryScreen> {
  List<Map<String, dynamic>> history = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => isLoading = true);
    final results = await DBHelper().getHistory(); // ordered by date DESC, time DESC
    
    // In a real app we might join the `medicine_name` from medicines table,
    // but right now history only has `medicine_id`.
    // Let's fetch all medicines to map ID to name
    final medicines = await DBHelper().getMedicines();
    Map<int, String> nameMap = {};
    for (var m in medicines) {
      nameMap[m['id']] = m['medicine_name'];
    }

    List<Map<String, dynamic>> enrichedHistory = [];
    for (var h in results) {
      final name = nameMap[h['medicine_id']] ?? 'Unknown Medicine (Deleted)';
      enrichedHistory.add({
        ...h,
        'medicine_name': name,
      });
    }

    if (mounted) {
      setState(() {
        history = enrichedHistory;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: Text('Medicine History', style: GoogleFonts.outfit(color: Colors.black87)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : history.isEmpty
              ? Center(
                  child: Text(
                    'No history found',
                    style: GoogleFonts.outfit(color: Colors.grey, fontSize: 16),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: history.length,
                  itemBuilder: (context, index) {
                    final item = history[index];
                    return _buildHistoryCard(item);
                  },
                ),
    );
  }

  Widget _buildHistoryCard(Map<String, dynamic> item) {
    Color statusColor = Colors.grey;
    IconData statusIcon = Icons.help_outline;

    switch (item['status']) {
      case 'Taken':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        break;
      case 'Skipped':
        statusColor = Colors.orange;
        statusIcon = Icons.skip_next;
        break;
      case 'Missed':
        statusColor = Colors.red;
        statusIcon = Icons.error_outline;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item['medicine_name'],
                  style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  '${item['date']} at ${item['time']}',
                  style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          Text(
            item['status'],
            style: GoogleFonts.outfit(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: statusColor,
            ),
          ),
        ],
      ),
    );
  }
}
