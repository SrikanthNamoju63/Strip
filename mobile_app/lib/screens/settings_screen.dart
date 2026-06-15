import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'feedback_screen.dart';

class SettingsScreen extends StatefulWidget {
  final Widget? bottomNavigationBar;
  final bool showBackButton;

  const SettingsScreen({
    super.key,
    this.bottomNavigationBar,
    this.showBackButton = true,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  // Toggles state
  bool _appointmentReminders = true;
  bool _medicineReminders = true;
  bool _bloodDonationAlerts = true;
  bool _promotionalNotifications = false;
  bool _twoFactorAuth = false;

  // Preferences
  String _heightUnit = 'cm';
  String _weightUnit = 'kg';

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _appointmentReminders = prefs.getBool('appointment_reminders') ?? true;
      _medicineReminders = prefs.getBool('medicine_reminders') ?? true;
      _bloodDonationAlerts = prefs.getBool('blood_donation_alerts') ?? true;
      _promotionalNotifications = prefs.getBool('promotional_notifications') ?? false;
      _twoFactorAuth = prefs.getBool('two_factor_auth') ?? false;
      
      _heightUnit = prefs.getString('height_unit') ?? 'cm';
      _weightUnit = prefs.getString('weight_unit') ?? 'kg';

      _isLoading = false;
    });
  }

  Future<void> _saveBoolSetting(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  Future<void> _saveStringSetting(String key, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: ConicLoader()),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        automaticallyImplyLeading: widget.showBackButton,
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: Text(
          'Settings',
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
            fontSize: 22,
          ),
        ),
      ),
      bottomNavigationBar: widget.bottomNavigationBar,
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        children: [
          _buildSectionHeader('Notifications'),
          _buildCard([
            _buildSwitchTile(
              title: 'Appointment Reminders',
              subtitle: 'Receive alerts before your doctor appointment',
              icon: Icons.calendar_today_outlined,
              value: _appointmentReminders,
              onChanged: (val) {
                setState(() => _appointmentReminders = val);
                _saveBoolSetting('appointment_reminders', val);
              },
            ),
            _buildDivider(),
            _buildSwitchTile(
              title: 'Medicine Reminders',
              subtitle: 'Never miss your daily medication',
              icon: Icons.medication_outlined,
              value: _medicineReminders,
              onChanged: (val) {
                setState(() => _medicineReminders = val);
                _saveBoolSetting('medicine_reminders', val);
              },
            ),
            _buildDivider(),
            _buildSwitchTile(
              title: 'Blood Donation Alerts',
              subtitle: 'Alerts for nearby blood donation requests',
              icon: Icons.bloodtype_outlined,
              value: _bloodDonationAlerts,
              onChanged: (val) {
                setState(() => _bloodDonationAlerts = val);
                _saveBoolSetting('blood_donation_alerts', val);
              },
            ),
            _buildDivider(),
            _buildSwitchTile(
              title: 'Promotional Notifications',
              subtitle: 'Offers, discounts, and health tips',
              icon: Icons.local_offer_outlined,
              value: _promotionalNotifications,
              onChanged: (val) {
                setState(() => _promotionalNotifications = val);
                _saveBoolSetting('promotional_notifications', val);
              },
            ),
          ]),

          const SizedBox(height: 20),
          _buildSectionHeader('Preferences'),
          _buildCard([
            _buildNavigationTile(
              title: 'Units',
              subtitle: '$_heightUnit, $_weightUnit',
              icon: Icons.straighten_outlined,
              onTap: _showUnitsBottomSheet,
            ),
          ]),

          const SizedBox(height: 20),
          _buildSectionHeader('Privacy & Security'),
          _buildCard([
            _buildNavigationTile(
              title: 'Privacy Policy',
              icon: Icons.privacy_tip_outlined,
              onTap: () => _showSimpleDialog('Privacy Policy', 'Privacy policy content opens in web view here.'),
            ),
            _buildDivider(),
            _buildNavigationTile(
              title: 'Terms & Conditions',
              icon: Icons.description_outlined,
              onTap: () => _showSimpleDialog('Terms & Conditions', 'Terms & Conditions content opens in web view here.'),
            ),
            _buildDivider(),
            _buildNavigationTile(
              title: 'Data Usage',
              icon: Icons.data_usage_outlined,
              onTap: () => _showSimpleDialog('Data Usage', 'Your data is securely stored and used only for healthcare purposes.'),
            ),
            _buildDivider(),
            _buildSwitchTile(
              title: 'Two Factor Authentication',
              subtitle: 'Enhance your account security',
              icon: Icons.security_outlined,
              value: _twoFactorAuth,
              onChanged: (val) {
                setState(() => _twoFactorAuth = val);
                _saveBoolSetting('two_factor_auth', val);
              },
            ),
          ]),

          const SizedBox(height: 20),
          _buildSectionHeader('Help & Support'),
          _buildCard([
            _buildNavigationTile(
              title: 'Contact Support',
              icon: Icons.support_agent_outlined,
              onTap: () => _showSimpleDialog('Contact Support', 'Opens email or chat screen.'),
            ),
            _buildDivider(),
            _buildNavigationTile(
              title: 'FAQs',
              icon: Icons.help_outline,
              onTap: () => _showSimpleDialog('FAQs', 'Frequently asked questions screen opens here.'),
            ),
            _buildDivider(),
            _buildNavigationTile(
              title: 'Report a Problem',
              icon: Icons.feedback_outlined,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => FeedbackScreen()),
                );
              },
            ),
          ]),

          const SizedBox(height: 20),
          _buildSectionHeader('About'),
          _buildCard([
             _buildNavigationTile(
              title: 'App Version',
              trailingText: '1.0.0',
              icon: Icons.info_outline,
              onTap: () {},
            ),
            _buildDivider(),
            _buildNavigationTile(
              title: 'About App',
              icon: Icons.article_outlined,
              onTap: () {
                _showSimpleDialog('About App', 'Developed by HealthPredict.\nCopyright © 2026. All rights reserved.');
              },
            ),
          ]),
          
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 8),
      child: Text(
        title,
        style: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.blueGrey,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildCard(List<Widget> children) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: children,
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    String? subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.blue, size: 22),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w500),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey[600]),
            )
          : null,
      trailing: Switch.adaptive(
        value: value,
        onChanged: onChanged,
        activeColor: Colors.blue,
      ),
    );
  }

  Widget _buildNavigationTile({
    required String title,
    String? subtitle,
    required IconData icon,
    required VoidCallback onTap,
    String? trailingText,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.blue.withOpacity(0.1),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.blue, size: 22),
      ),
      title: Text(
        title,
        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w500),
      ),
      subtitle: subtitle != null
          ? Text(
              subtitle,
              style: GoogleFonts.outfit(fontSize: 13, color: Colors.grey[600]),
            )
          : null,
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (trailingText != null)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Text(
                trailingText,
                style: GoogleFonts.outfit(fontSize: 14, color: Colors.grey),
              ),
            ),
          const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
        ],
      ),
      onTap: onTap,
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, thickness: 1, indent: 56, endIndent: 16, color: Color(0xFFF0F0F0));
  }

  void _showSimpleDialog(String title, String content) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text(content, style: GoogleFonts.outfit()),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close', style: GoogleFonts.outfit(color: Colors.blue)),
          ),
        ],
      ),
    );
  }

  void _showUnitsBottomSheet() {
    String tempHeight = _heightUnit;
    String tempWeight = _weightUnit;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Measurement Units',
                    style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'Height',
                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.grey[700]),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: RadioListTile<String>(
                          title: Text('cm', style: GoogleFonts.outfit()),
                          value: 'cm',
                          groupValue: tempHeight,
                          onChanged: (val) => setModalState(() => tempHeight = val!),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      Expanded(
                        child: RadioListTile<String>(
                          title: Text('ft', style: GoogleFonts.outfit()),
                          value: 'ft',
                          groupValue: tempHeight,
                          onChanged: (val) => setModalState(() => tempHeight = val!),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  ),
                  const Divider(),
                  Text(
                    'Weight',
                    style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.grey[700]),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: RadioListTile<String>(
                          title: Text('kg', style: GoogleFonts.outfit()),
                          value: 'kg',
                          groupValue: tempWeight,
                          onChanged: (val) => setModalState(() => tempWeight = val!),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                      Expanded(
                        child: RadioListTile<String>(
                          title: Text('lbs', style: GoogleFonts.outfit()),
                          value: 'lbs',
                          groupValue: tempWeight,
                          onChanged: (val) => setModalState(() => tempWeight = val!),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () {
                        setState(() {
                          _heightUnit = tempHeight;
                          _weightUnit = tempWeight;
                        });
                        _saveStringSetting('height_unit', tempHeight);
                        _saveStringSetting('weight_unit', tempWeight);
                        Navigator.pop(context);
                      },
                      child: Text(
                        'Save',
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
