import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
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
  
  // Custom password masking states
  bool _isPasswordVisible = false;
  String _actualPassword = '';
  Timer? _passwordMaskTimer;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _passwordMaskTimer?.cancel();
    super.dispose();
  }

  void _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final error = await _apiService.login(
      _emailController.text.trim(),
      _actualPassword, // Use actual plaintext password instead of masked text from controller
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

  void _onPasswordChanged(String value) {
    if (_isPasswordVisible) {
      _actualPassword = value;
      setState(() {});
      return;
    }

    String newActual = '';
    final cursorPosition = _passwordController.selection.baseOffset;

    if (value.length > _actualPassword.length) {
      // Character added (either typed or pasted)
      int addedLen = value.length - _actualPassword.length;
      int addedIndex = cursorPosition - addedLen;
      if (addedIndex >= 0 && addedIndex <= _actualPassword.length) {
        String addedText = value.substring(addedIndex, cursorPosition);
        newActual = _actualPassword.substring(0, addedIndex) + addedText + _actualPassword.substring(addedIndex);
      } else {
        newActual = _actualPassword + value.substring(_actualPassword.length);
      }
    } else if (value.length < _actualPassword.length) {
      // Character deleted
      int deletedLen = _actualPassword.length - value.length;
      int deletedIndex = cursorPosition;
      if (deletedIndex >= 0 && deletedIndex + deletedLen <= _actualPassword.length) {
        newActual = _actualPassword.substring(0, deletedIndex) + _actualPassword.substring(deletedIndex + deletedLen);
      } else {
        newActual = _actualPassword.substring(0, value.length);
      }
    } else {
      newActual = _actualPassword;
    }

    _actualPassword = newActual;

    if (newActual.isEmpty) {
      _passwordController.value = const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
      );
      setState(() {});
      return;
    }

    // Mask with bullets, leaving the very last typed character visible
    final masked = '•' * (newActual.length - 1) + newActual[newActual.length - 1];
    
    _passwordController.value = TextEditingValue(
      text: masked,
      selection: TextSelection.collapsed(offset: cursorPosition.clamp(0, masked.length)),
    );

    // Cancel old timer and start a new 800ms timer to mask the remaining last letter
    _passwordMaskTimer?.cancel();
    _passwordMaskTimer = Timer(const Duration(milliseconds: 800), () {
      if (!mounted) return;
      final currentSel = _passwordController.selection;
      _passwordController.value = TextEditingValue(
        text: '•' * _actualPassword.length,
        selection: currentSel,
      );
    });

    setState(() {});
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
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
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
                  labelText: 'Email or User ID',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  prefixIcon: const Icon(Icons.person_outline),
                ),
              ).animate().fadeIn(delay: 300.ms).slideX(),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: false, // We drive masking through controller dynamically
                keyboardType: TextInputType.visiblePassword,
                onChanged: _onPasswordChanged,
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
                    onPressed: () {
                      setState(() {
                        _isPasswordVisible = !_isPasswordVisible;
                        if (!_isPasswordVisible) {
                          _passwordController.text = '•' * _actualPassword.length;
                        } else {
                          _passwordController.text = _actualPassword;
                        }
                      });
                    },
                  ),
                ),
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
                child: _isLoading
                    ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: ConicLoader(
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
