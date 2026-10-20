import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'find_doctor_screen.dart';
import 'doctor_search_results_screen.dart';
import 'doctor_details_screen.dart';
import '../widgets/rating_modal.dart';
import '../services/db_helper.dart';
import 'package:intl/intl.dart';
import 'dart:convert';
import 'MedicineRemindersScreen.dart';
import 'qr_scanner_screen.dart';
import 'appointment_history_screen.dart';
import 'PrescriptionsScreen.dart';
import 'MedicalReportsScreen.dart';

import 'blood_finder_screen.dart';
import 'insurance_screen.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _userProfile;
  bool _isLoading = true;
  List<Map<String, dynamic>> _todayMedicines = [];
  List<dynamic> _topDoctors = [];
  bool _isLoadingDoctors = true;
  bool _welcomeCouponShown = false;

  // Banner State
  final PageController _pageController = PageController(initialPage: 1000);
  int _currentPage = 0;
  Timer? _timer;

  // Search State
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  bool _isSearchEmpty = true;

  // Navigation State
  int _selectedIndex = 0;

  StreamSubscription? _socketSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    SocketService().init(); // Initialize socket connection
    _searchController.addListener(() {
      setState(() {
        _isSearchEmpty = _searchController.text.isEmpty;
      });
    });
    _searchFocusNode.addListener(() {
      setState(() {});
    });
    _fetchProfile();
    _fetchTopDoctors();
    _startAutoSlide();

    _socketSubscription = SocketService().eventStream.listen((event) {
      if (event['event'] == 'appointment_update' || event['event'] == 'notification') {
        debugPrint('🔄 Real-time update received in HomeScreen, refreshing...');
        _checkPendingReview();
        // Background refresh
        _apiService.getUserProfile().then((profile) {
          if (mounted) setState(() => _userProfile = profile);
        });
      }
    });
  }

  @override
  void dispose() {
    _socketSubscription?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    _searchController.dispose();
    _searchFocusNode.dispose();
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _checkPendingReview();
      _fetchProfile(); // Also refresh profile to get latest appointments/status
    }
  }

  void _startAutoSlide() {
    _timer = Timer.periodic(const Duration(seconds: 4), (Timer timer) {
      if (_pageController.hasClients) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  Future<void> _fetchProfile() async {
    try {
      final profile = await _apiService.getUserProfile();
      if (mounted) {
        setState(() {
          _userProfile = profile;
          _isLoading = false;

          if (_userProfile != null && _userProfile!['_id'] != null) {
            SocketService().joinUserRoom(_userProfile!['_id']);
            _checkPendingReview();
            _checkWelcomeCoupon();
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
    await _fetchTodayMedicines();
  }

  Future<void> _fetchTopDoctors() async {
    try {
      final doctors = await _apiService.getDoctors();
      // Sort by rating descending
      doctors.sort((a, b) {
        final ratingA = (a['ratings']?['averageRating'] ?? 0).toDouble();
        final ratingB = (b['ratings']?['averageRating'] ?? 0).toDouble();
        return ratingB.compareTo(ratingA);
      });
      if (mounted) {
        setState(() {
          _topDoctors = doctors.take(10).toList();
          _isLoadingDoctors = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingDoctors = false;
        });
      }
    }
  }

  Future<void> _fetchTodayMedicines() async {
    try {
      final allMeds = await DBHelper().getMedicines();
      // simplified filtering: show max 3 active reminders for UX
      if (mounted) {
        setState(() {
          _todayMedicines = allMeds.take(3).toList();
        });
      }
    } catch (e) {
      debugPrint('Error fetching meds: $e');
    }
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    if (index == 0) {
      _checkPendingReview();
    }
  }

  ImageProvider? _getAvatarImage() {
    if (_userProfile?['profileImage'] != null) {
      String path = _userProfile!['profileImage'];
      final cleanPath = path.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
      return NetworkImage(
        '${ApiService.baseUrl.replaceAll('/api', '')}/$cleanPath',
      );
    }
    return null;
  }

  void _checkPendingReview() async {
    debugPrint("Checking pending review...");
    final result = await _apiService.checkPendingFeedback();
    debugPrint("Pending review result: $result");

    if (result != null &&
        result['success'] == true &&
        result['pending'] == true) {
      if (mounted) {
        debugPrint("Showing rating modal");
        showDialog(
          context: context,
          barrierDismissible: false,
          builder:
              (context) => RatingModal(
                appointmentData: result['data'],
                onRatingSubmitted: () {
                  // After submission, check if there are more pending reviews
                  // Delay slightly to allow modal to close fully
                  Future.delayed(Duration(seconds: 1), _checkPendingReview);
                },
              ),
        );
      }
    }
  }

  void _checkWelcomeCoupon() async {
    // Only show once per session to avoid repeated checks if not needed
    if (_welcomeCouponShown) return;

    final prefs = await SharedPreferences.getInstance();
    final isDismissed = prefs.getBool('welcome_coupon_dismissed') ?? false;
    if (isDismissed) {
      _welcomeCouponShown = true;
      return;
    }

    final res = await _apiService.getWelcomeCoupon();
    if (res != null && res['coupon'] != null) {
      if (mounted) {
        _welcomeCouponShown = true; // Mark as shown for this session
        final coupon = res['coupon'];
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: Row(
              children: [
                Icon(Icons.local_offer, color: Colors.orange),
                SizedBox(width: 8),
                Text("Welcome Offer!"),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text("Use code below to get a discount on your first appointment!", textAlign: TextAlign.center),
                SizedBox(height: 16),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.orange.shade200, width: 2, style: BorderStyle.solid),
                  ),
                  child: Text(
                    coupon['code'],
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.orange.shade900),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () async {
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setBool('welcome_coupon_dismissed', true);
                  if (mounted) Navigator.pop(ctx);
                },
                child: Text("Got it!"),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If we're on the Settings tab (index 1), show separate content or placeholder
    // If we're on the Settings tab (index 1), show separate content or placeholder
    if (_selectedIndex == 1) {
      return SettingsScreen(
        bottomNavigationBar: _buildBottomNavBar(),
        showBackButton: false,
      );
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child:
            _isLoading
                ? const Center(child: ConicLoader())
                : RefreshIndicator(
                  onRefresh: _fetchProfile,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 1. Header with Greeting and Profile
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Hello,',
                                  style: GoogleFonts.outfit(
                                    fontSize: 16,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                Text(
                                  _userProfile?['name'] ?? 'User',
                                  style: GoogleFonts.outfit(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                            // Profile Avatar
                            GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const ProfileScreen(),
                                  ),
                                ).then((_) => _fetchProfile());
                              },
                              child: CircleAvatar(
                                radius: 25,
                                backgroundColor: Colors.blue.shade100,
                                backgroundImage: _getAvatarImage(),
                                child:
                                    _getAvatarImage() == null
                                        ? Text(
                                          (_userProfile?['name'] ?? 'U')
                                              .substring(0, 1)
                                              .toUpperCase(),
                                          style: GoogleFonts.outfit(
                                            fontSize: 20,
                                            fontWeight: FontWeight.bold,
                                            color: Colors.blue,
                                          ),
                                        )
                                        : null,
                              ),
                            ),
                          ],
                        ).animate().fadeIn().slideY(),

                        const SizedBox(height: 24),

                        // 2. Search Bar
                        Container(
                          height: 56,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Stack(
                            alignment: Alignment.centerLeft,
                            children: [
                              if (_isSearchEmpty && !_searchFocusNode.hasFocus)
                                Padding(
                                  padding: const EdgeInsets.only(left: 48.0),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        'Search for ',
                                        style: GoogleFonts.outfit(
                                          color: Colors.grey.shade500,
                                          fontSize: 16,
                                        ),
                                      ),
                                      AnimatedTextKit(
                                        repeatForever: true,
                                        pause: const Duration(milliseconds: 1000),
                                        animatedTexts: [
                                          TypewriterAnimatedText(
                                            'find doctor',
                                            textStyle: GoogleFonts.outfit(
                                              color: Colors.grey.shade800,
                                              fontSize: 16,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            speed: const Duration(milliseconds: 100),
                                            cursor: '',
                                          ),
                                          TypewriterAnimatedText(
                                            'blood finder',
                                            textStyle: GoogleFonts.outfit(
                                              color: Colors.grey.shade800,
                                              fontSize: 16,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            speed: const Duration(milliseconds: 100),
                                            cursor: '',
                                          ),
                                          TypewriterAnimatedText(
                                            'insurance',
                                            textStyle: GoogleFonts.outfit(
                                              color: Colors.grey.shade800,
                                              fontSize: 16,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            speed: const Duration(milliseconds: 100),
                                            cursor: '',
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              TextField(
                                controller: _searchController,
                                focusNode: _searchFocusNode,
                                style: GoogleFonts.outfit(fontSize: 16, color: Colors.black87),
                                decoration: InputDecoration(
                                  border: InputBorder.none,
                                  prefixIcon: Icon(
                                    Icons.search,
                                    color: Colors.grey.shade500,
                                  ),
                                  contentPadding: const EdgeInsets.symmetric(vertical: 16),
                                  hintText: _searchFocusNode.hasFocus ? "Type a doctor or feature..." : null,
                                  hintStyle: GoogleFonts.outfit(color: Colors.grey.shade400),
                                ),
                                textInputAction: TextInputAction.search,
                                onSubmitted: (value) {
                                  final query = value.trim().toLowerCase();
                                  if (query.isEmpty) return;

                                  if (query.contains('blood') || query.contains('donor')) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const BloodFinderScreen()));
                                  } else if (query.contains('insurance')) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const InsuranceScreen()));
                                  } else if (query.contains('appointment') || query.contains('book')) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const AppointmentHistoryScreen()));
                                  } else if (query.contains('medicine') || query.contains('reminder')) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicineRemindersScreen()));
                                  } else if (query.contains('prescription')) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const PrescriptionsScreen()));
                                  } else if (query.contains('report') || query.contains('record')) {
                                    Navigator.push(context, MaterialPageRoute(builder: (_) => const MedicalReportsScreen()));
                                  } else {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => DoctorSearchResultsScreen(
                                          location: "",
                                          query: value.trim(),
                                        ),
                                      ),
                                    );
                                  }
                                },
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: 100.ms),

                        const SizedBox(height: 24),

                        // 3. Ads Banner Slider
                        SizedBox(
                          height: 186,
                          child: PageView.builder(
                            clipBehavior: Clip.none,
                            controller: _pageController,
                            onPageChanged: (int page) {
                              setState(() {
                                _currentPage = page % 4;
                              });
                            },
                             itemBuilder: (context, index) {
                              final int realIndex = index % 4;
                              if (realIndex == 0) {
                                final hasTopDoc = _topDoctors.isNotEmpty;
                                final topDoc = hasTopDoc ? _topDoctors[0] : null;
                                return GestureDetector(
                                  onTap: () {
                                    if (hasTopDoc) {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => DoctorDetailsScreen(doctor: topDoc),
                                        ),
                                      );
                                    } else {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => FindDoctorScreen(),
                                        ),
                                      );
                                    }
                                  },
                                  child: _buildBanner(
                                    const LinearGradient(
                                      colors: [Color(0xFF2563EB), Color(0xFF4F46E5)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    hasTopDoc
                                        ? "Consult ${topDoc['name']}"
                                        : "Top Rated Doctors",
                                    hasTopDoc
                                        ? "${topDoc['specialization']}"
                                        : "Consult Specialists",
                                    hasTopDoc
                                        ? CircleAvatar(
                                            radius: 36,
                                            backgroundColor: Colors.white24,
                                            backgroundImage: _getDoctorImage(topDoc),
                                            child: _getDoctorImage(topDoc) == null
                                                ? Text(
                                                    (topDoc['name'] ?? 'D')[0],
                                                    style: GoogleFonts.outfit(
                                                      fontSize: 24,
                                                      fontWeight: FontWeight.bold,
                                                      color: Colors.white,
                                                    ),
                                                  )
                                                : null,
                                          )
                                        : const Icon(
                                            Icons.star_rounded,
                                            color: Colors.white,
                                            size: 38,
                                          ),
                                    const Color(0xFF2563EB),
                                  ),
                                );
                              } else if (realIndex == 1) {
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => FindDoctorScreen(),
                                      ),
                                    );
                                  },
                                  child: _buildBanner(
                                    const LinearGradient(
                                      colors: [Color(0xFF7C3AED), Color(0xFFEC4899)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    "Online Consultation",
                                    "Connect instantly",
                                    const Icon(
                                      Icons.support_agent_rounded,
                                      color: Colors.white,
                                      size: 38,
                                    ),
                                    const Color(0xFF7C3AED),
                                  ),
                                );
                              } else if (realIndex == 2) {
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const MedicineRemindersScreen(),
                                      ),
                                    );
                                  },
                                  child: _buildBanner(
                                    const LinearGradient(
                                      colors: [Color(0xFFF97316), Color(0xFFEF4444)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    "Medicine Reminders",
                                    "Track Daily Doses",
                                    const Icon(
                                      Icons.medication_rounded,
                                      color: Colors.white,
                                      size: 38,
                                    ),
                                    const Color(0xFFF97316),
                                  ),
                                );
                              } else {
                                return GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => const BloodFinderScreen(),
                                      ),
                                    );
                                  },
                                  child: _buildBanner(
                                    const LinearGradient(
                                      colors: [Color(0xFFDC2626), Color(0xFFF87171)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    "Blood Finder",
                                    "Find Donors Near You",
                                    const Icon(
                                      Icons.opacity_rounded,
                                      color: Colors.white,
                                      size: 38,
                                    ),
                                    const Color(0xFFDC2626),
                                  ),
                                );
                              }
                            },
                          ),
                        ).animate().fadeIn(delay: 200.ms).scale(),

                        const SizedBox(height: 12),
                        // Banner Indicators
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            4,
                            (index) => _buildIndicator(index),
                          ),
                        ),

                        const SizedBox(height: 32),

                        // 4. Feature Icons
                        Text(
                          'Your Health',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _buildFeatureIcon(
                              icon: Icons.medical_services_rounded,
                              label: 'Find Doctor',
                              color: Colors.blue,
                              onTap:
                                  () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => FindDoctorScreen(),
                                    ),
                                  ),
                              delay: 300,
                            ),

                            _buildFeatureIcon(
                              icon: Icons.bloodtype_rounded,
                              label: 'Blood Finder',
                              color: Colors.red,
                              onTap:
                                  () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const BloodFinderScreen(),
                                    ),
                                  ),
                              delay: 500,
                            ),
                            _buildFeatureIcon(
                              icon: Icons.shield_rounded,
                              label: 'Insurance',
                              color: Colors.orange,
                              onTap:
                                  () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const InsuranceScreen(),
                                    ),
                                  ),
                              delay: 600,
                            ),
                            _buildFeatureIcon(
                              icon: Icons.qr_code_scanner_rounded,
                              label: 'Scan QR',
                              color: Colors.purple,
                              onTap:
                                  () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (_) => const QRScannerScreen(),
                                    ),
                                  ),
                              delay: 700,
                            ),
                          ],
                        ),

                        const SizedBox(height: 32),

                        // 5. Today's Medicines Widget
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Today\'s Medicines',
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            TextButton(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => const MedicineRemindersScreen()),
                              ).then((_) => _fetchTodayMedicines()),
                              child: Text('View All', style: GoogleFonts.outfit(color: Colors.blue)),
                            )
                          ],
                        ),
                        const SizedBox(height: 12),
                        _todayMedicines.isEmpty
                            ? Container(
                                padding: const EdgeInsets.all(24),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Center(
                                  child: Text('No medicines scheduled for today', style: GoogleFonts.outfit(color: Colors.blue.shade700)),
                                ),
                              )
                            : Column(
                                children: _todayMedicines.map((med) => _buildTodayMedicineCard(med)).toList(),
                              ),

                        const SizedBox(height: 32),

                        // 6. Top Rated Doctors
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Top Rated Doctors',
                              style: GoogleFonts.outfit(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => FindDoctorScreen(),
                                  ),
                                );
                              },
                              child: Text('View All', style: GoogleFonts.outfit(color: Colors.blue)),
                            )
                          ],
                        ),
                        const SizedBox(height: 12),
                        _isLoadingDoctors
                            ? const Center(child: ConicLoader())
                            : _topDoctors.isEmpty
                                ? Text("No doctors found.", style: GoogleFonts.outfit(color: Colors.grey))
                                : SizedBox(
                                    height: 220,
                                    child: ListView.builder(
                                      scrollDirection: Axis.horizontal,
                                      physics: const BouncingScrollPhysics(),
                                      itemCount: _topDoctors.length,
                                      itemBuilder: (context, index) {
                                        return _buildDoctorCard(_topDoctors[index]);
                                      },
                                    ),
                                  ),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
      ),
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildBottomNavBar() {
    return NavigationBar(
      selectedIndex: _selectedIndex,
      onDestinationSelected: _onItemTapped,
      backgroundColor: Colors.white,
      elevation: 3,
      indicatorColor: Colors.blue.shade100,
      destinations: const [
        NavigationDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home),
          label: 'Home',
        ),
        NavigationDestination(
          icon: Icon(Icons.settings_outlined),
          selectedIcon: Icon(Icons.settings),
          label: 'Settings',
        ),
      ],
    );
  }  Widget _buildBanner(LinearGradient gradient, String title, String subtitle, Widget rightWidget, Color shadowColor) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: shadowColor.withValues(alpha: 0.25),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // Decorative background circle 1
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 150,
                height: 150,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.08),
                ),
              ),
            ),
            // Decorative background circle 2
            Positioned(
              right: 60,
              bottom: -50,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
            ),
            
            // Content
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Row(
                children: [
                  Expanded(
                    flex: 6,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            height: 1.2,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.3),
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Flexible(
                                child: Text(
                                  subtitle,
                                  style: GoogleFonts.outfit(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 1,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.arrow_forward_rounded,
                                color: Colors.white,
                                size: 14,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Glowing Illustration Icon
                  Expanded(
                    flex: 4,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white.withValues(alpha: 0.15),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.2),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.05),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: rightWidget,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIndicator(int index) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      height: 8,
      width: _currentPage == index ? 24 : 8,
      decoration: BoxDecoration(
        color: _currentPage == index ? Colors.blue : Colors.grey.shade300,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }

  Widget _buildFeatureIcon({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
    required int delay,
  }) {
    return GestureDetector(
          onTap: onTap,
          child: Column(
            children: [
              Container(
                width: 68,
                height: 68,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      color.withValues(alpha: 0.12),
                      color.withValues(alpha: 0.04),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: color.withValues(alpha: 0.25),
                    width: 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: color.withValues(alpha: 0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, color: color, size: 32),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF475569),
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(delay: Duration(milliseconds: delay))
        .slideY(begin: 0.2, end: 0);
  }

  Widget _buildTodayMedicineCard(Map<String, dynamic> med) {
    List<dynamic> times = [];
    try {
      times = jsonDecode(med['reminder_times'] ?? '[]');
    } catch (e) {
      // ignore
    }
    String nextDose = times.isNotEmpty ? times.first.toString() : 'N/A';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ]
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.medication, color: Colors.blue),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(med['medicine_name'] ?? '', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('$nextDose - ${med['food_timing']}', style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey.shade600)),
              ],
            ),
          ),
          // Actions block
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.check_circle, color: Colors.green),
                onPressed: () async {
                  await DBHelper().insertHistory({
                    'medicine_id': med['id'],
                    'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                    'time': DateFormat('hh:mm a').format(DateTime.now()),
                    'status': 'Taken',
                  });
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marked as taken')));
                },
              ),
              IconButton(
                icon: const Icon(Icons.cancel, color: Colors.red),
                onPressed: () async {
                  await DBHelper().insertHistory({
                    'medicine_id': med['id'],
                    'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                    'time': DateFormat('hh:mm a').format(DateTime.now()),
                    'status': 'Skipped',
                  });
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marked as skipped')));
                },
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildDoctorCard(dynamic doctor) {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DoctorDetailsScreen(doctor: doctor),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: Colors.blue.shade50,
                backgroundImage: _getDoctorImage(doctor),
                child: _getDoctorImage(doctor) == null
                    ? Text(
                        (doctor['name'] ?? 'D')[0],
                        style: GoogleFonts.outfit(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.blue,
                        ),
                      )
                    : null,
              ),
              const SizedBox(height: 12),
              Text(
                doctor['name'] ?? '',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              Text(
                doctor['specialization'] ?? '',
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  color: Colors.blue.shade600,
                  fontWeight: FontWeight.w500,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.star, size: 14, color: Colors.amber),
                  const SizedBox(width: 4),
                  Text(
                    "${doctor['ratings']?['averageRating']?.toStringAsFixed(1) ?? '0.0'}",
                    style: GoogleFonts.outfit(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
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

  ImageProvider? _getDoctorImage(dynamic doctor) {
    String? photoData = doctor['profileImage'] ?? doctor['doctorPhoto'];

    if (photoData != null && photoData.isNotEmpty) {
      if (photoData.startsWith('http')) {
        return NetworkImage(photoData);
      }

      if (photoData.startsWith('uploads/') || photoData.startsWith('/uploads/')) {
        final cleanPath = photoData.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
        return NetworkImage('${ApiService.baseUrl.replaceAll('/api', '')}/$cleanPath');
      }
      
      try {
        String base64String = photoData;
        if (base64String.contains(',')) {
          base64String = base64String.split(',').last;
        }
        return MemoryImage(base64Decode(base64String));
      } catch (e) {
        debugPrint('Error decoding base64 image: $e');
        return null;
      }
    }
    return null;
  }
}
