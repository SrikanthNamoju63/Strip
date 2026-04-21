import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'home_screen.dart';
import 'register_screen.dart';
import '../widgets/dr_strip_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _apiService = ApiService();
  bool _isLoading = false;
  String? _errorMessage;
  bool _isPasswordVisible = false;

  void _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final error = await _apiService.login(
      _emailController.text,
      _passwordController.text,
    );

    setState(() {
      _isLoading = false;
    });

    if (error == null) {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const HomeScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = error;
      });
    }
  }

  void _handleForgotPassword() {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      setState(() => _errorMessage = "Please enter email to reset password");
      return;
    }

    showDialog(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: Text('Reset Password'),
            content: Text('Send password reset link to $email?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text('Cancel'),
              ),
              TextButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  // Call API
                  final res = await _apiService.forgotPassword(email);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(res ?? 'Reset link sent to your email'),
                        backgroundColor:
                            res == null ? Colors.green : Colors.red,
                      ),
                    );
                  }
                },
                child: Text('Send'),
              ),
            ],
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          // Added scroll view
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48), // Padding top
              const DrStripLogo(
                fontSize: 48,
                starSize: 60,
              ).animate().fadeIn().slideY(begin: -0.2, end: 0),
              const SizedBox(height: 80),
              Text(
                'Welcome Back',
                style: GoogleFonts.outfit(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade800,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: 8),
              Text(
                'Sign in to manage your health',
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  color: Colors.grey.shade600,
                ),
                textAlign: TextAlign.center,
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 48),
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(color: Colors.red.shade700),
                  ),
                ),
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: 'Email',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.email_outlined),
                ),
              ).animate().fadeIn(delay: 300.ms).slideX(),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed:
                        () => setState(
                          () => _isPasswordVisible = !_isPasswordVisible,
                        ),
                  ),
                ),
                obscureText: !_isPasswordVisible,
              ).animate().fadeIn(delay: 400.ms).slideX(),

              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _handleForgotPassword,
                  child: Text(
                    'Forgot Password?',
                    style: GoogleFonts.outfit(color: Colors.blue.shade600),
                  ),
                ),
              ),

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade600,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child:
                    _isLoading
                        ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                        : Text(
                          'Login',
                          style: GoogleFonts.outfit(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
              ).animate().fadeIn(delay: 500.ms).scale(),

              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account?",
                    style: GoogleFonts.outfit(color: Colors.grey.shade600),
                  ),
                  TextButton(
                    onPressed: () {
                      // Navigate to Sign Up (Assuming RegisterScreen exists or needs creation)
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const RegisterScreen(),
                        ),
                      );
                    },
                    child: Text(
                      'Sign Up',
                      style: GoogleFonts.outfit(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade600,
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
