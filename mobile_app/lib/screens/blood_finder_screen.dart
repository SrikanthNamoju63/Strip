import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'donor_registration_screen.dart';

class BloodFinderScreen extends StatefulWidget {
  const BloodFinderScreen({super.key});

  @override
  State<BloodFinderScreen> createState() => _BloodFinderScreenState();
}

class _BloodFinderScreenState extends State<BloodFinderScreen> {
  final _apiService = ApiService();
  List<dynamic> _donors = [];
  bool _isLoading = true;

  // Search Filters
  String _selectedBloodGroup = 'All';
  final List<String> _filterGroups = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  // double _radius = 20.0; // Future

  @override
  void initState() {
    super.initState();
    _fetchDonors();
  }

  void _fetchDonors() async {
    setState(() => _isLoading = true);
    final group = _selectedBloodGroup == 'All' ? null : _selectedBloodGroup;
    final donors = await _apiService.getBloodDonors(bloodGroup: group);
    setState(() {
      _donors = donors;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Blood Finder (Within 20km)', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const DonorRegistrationScreen()),
          );
          if (result == true) {
             _fetchDonors(); // Refresh list if they registered
          }
        },
        label: const Text('Register as Donor'),
        icon: const Icon(Icons.person_add),
        backgroundColor: Colors.red,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
           // Filters
           Container(
             padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
             color: Colors.white,
             child: Row(
               children: [
                 const Icon(Icons.filter_list, color: Colors.grey),
                 const SizedBox(width: 12),
                 Expanded(
                   child: DropdownButtonHideUnderline(
                     child: DropdownButton<String>(
                       value: _selectedBloodGroup,
                       items: _filterGroups.map((g) => DropdownMenuItem(value: g, child: Text(g))).toList(),
                       onChanged: (v) {
                         if (v != null) {
                           _selectedBloodGroup = v;
                           _fetchDonors();
                         }
                       },
                       isExpanded: true,
                       hint: const Text('Filter by Blood Group'),
                     ),
                   ),
                 ),
               ],
             ),
           ),
           Expanded(
             child: _isLoading 
                ? const Center(child: ConicLoader()) 
                : _donors.isEmpty 
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.bloodtype, size: 64, color: Colors.grey.shade300),
                          const SizedBox(height: 16),
                          Text('No donors found nearby', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _donors.length,
                      itemBuilder: (context, index) {
                         final donor = _donors[index];
                         return _buildDonorCard(donor);
                      },
                    ),
           ),
        ],
      )
    );
  }

  Widget _buildDonorCard(dynamic donor) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.red.shade100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  donor['bloodGroup'],
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.red.shade700
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    donor['userId'] != null ? donor['userId']['name'] : 'Donor',
                    style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '${donor['age']} yrs • ${donor['weight']} kg',
                    style: GoogleFonts.outfit(color: Colors.grey),
                  ),
                  // Mock Distance
                  Row(
                    children: [
                       Icon(Icons.location_on, size: 14, color: Colors.grey.shade400),
                       const SizedBox(width: 4),
                       Text('~5.2 km away', style: GoogleFonts.outfit(fontSize: 12, color: Colors.grey.shade400)),
                    ],
                  )
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.phone, color: Colors.green),
              onPressed: () {},
            )
          ],
        ),
      ),
    );
  }
}
