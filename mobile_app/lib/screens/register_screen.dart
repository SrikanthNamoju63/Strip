import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_app/widgets/conic_loader.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../services/api_service.dart';
import '../widgets/dr_strip_logo.dart';
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final PageController _pageController = PageController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _apiService = ApiService();

  final FocusNode _firstNameFocusNode = FocusNode();
  final FocusNode _lastNameFocusNode = FocusNode();
  final FocusNode _emailFocusNode = FocusNode();
  final FocusNode _phoneFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();
  final FocusNode _confirmPasswordFocusNode = FocusNode();

  int _currentStep = 0;
  DateTime? _selectedDate;
  bool _isLoading = false;
  
  // Custom password masking states
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _actualPassword = '';
  String _actualConfirmPassword = '';
  Timer? _passwordMaskTimer;
  Timer? _confirmPasswordMaskTimer;

  String? _errorMessage;

  // Step-specific error messages
  String? _firstNameError;
  String? _lastNameError;
  String? _emailError;
  String? _phoneError;
  String? _dobError;
  String? _passwordError;
  String? _confirmPasswordError;

  @override
  void initState() {
    super.initState();
    // Focus the first field after transition completes
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) {
        _firstNameFocusNode.requestFocus();
      }
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameFocusNode.dispose();
    _lastNameFocusNode.dispose();
    _emailFocusNode.dispose();
    _phoneFocusNode.dispose();
    _passwordFocusNode.dispose();
    _confirmPasswordFocusNode.dispose();
    _passwordMaskTimer?.cancel();
    _confirmPasswordMaskTimer?.cancel();
    super.dispose();
  }

  void _focusCurrentStep() {
    Future.delayed(const Duration(milliseconds: 300), () {
      if (!mounted) return;
      switch (_currentStep) {
        case 0:
          _firstNameFocusNode.requestFocus();
          break;
        case 1:
          _emailFocusNode.requestFocus();
          break;
        case 2:
          _phoneFocusNode.requestFocus();
          break;
        case 4:
          _passwordFocusNode.requestFocus();
          break;
      }
    });
  }

  bool _validateCurrentStep() {
    setState(() {
      _firstNameError = null;
      _lastNameError = null;
      _emailError = null;
      _phoneError = null;
      _dobError = null;
      _passwordError = null;
      _confirmPasswordError = null;
      _errorMessage = null;
    });

    if (_currentStep == 0) {
      final firstName = _firstNameController.text.trim();
      final lastName = _lastNameController.text.trim();
      bool isValid = true;
      if (firstName.isEmpty) {
        setState(() => _firstNameError = 'Please enter your first name');
        isValid = false;
      }
      if (lastName.isEmpty) {
        setState(() => _lastNameError = 'Please enter your last name');
        isValid = false;
      }
      return isValid;
    } else if (_currentStep == 1) {
      final email = _emailController.text.trim();
      if (email.isEmpty) {
        setState(() => _emailError = 'Please enter your email');
        return false;
      }
      final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
      if (!emailRegex.hasMatch(email)) {
        setState(() => _emailError = 'Please enter a valid email address');
        return false;
      }
    } else if (_currentStep == 2) {
      final phone = _phoneController.text.trim();
      if (phone.isEmpty) {
        setState(() => _phoneError = 'Please enter your phone number');
        return false;
      }
      final phoneRegex = RegExp(r'^[0-9]{10}$');
      if (!phoneRegex.hasMatch(phone)) {
        setState(() => _phoneError = 'Phone number must be exactly 10 digits');
        return false;
      }
    } else if (_currentStep == 3) {
      if (_selectedDate == null) {
        setState(() => _dobError = 'Please select your date of birth');
        return false;
      }
    } else if (_currentStep == 4) {
      if (_actualPassword.isEmpty) {
        setState(() => _passwordError = 'Please choose a password');
        return false;
      }
      if (_actualPassword.length < 6) {
        setState(() => _passwordError = 'Password must be at least 6 characters');
        return false;
      }
      if (_actualConfirmPassword.isEmpty) {
        setState(() => _confirmPasswordError = 'Please confirm your password');
        return false;
      }
      if (_actualPassword != _actualConfirmPassword) {
        setState(() => _confirmPasswordError = 'Passwords do not match');
        return false;
      }
    }

    return true;
  }

  void _nextStep() {
    if (_validateCurrentStep()) {
      if (_currentStep < 4) {
        _pageController.nextPage(
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOutCubic,
        );
        _focusCurrentStep();
      } else {
        _register();
      }
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
      _focusCurrentStep();
    } else {
      Navigator.pop(context);
    }
  }

  void _showDobPicker() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.blue.shade600,
              onPrimary: Colors.white,
              onSurface: Colors.black87,
            ),
          ),
          child: child!,
        );
      },
    );
    if (date != null) {
      setState(() {
        _selectedDate = date;
        _dobError = null;
      });
    }
  }

  // Interactive "peek-on-type" password masking handler
  void _onPasswordChanged(String value, bool isConfirm) {
    final controller = isConfirm ? _confirmPasswordController : _passwordController;
    final obscure = isConfirm ? _obscureConfirmPassword : _obscurePassword;
    final actual = isConfirm ? _actualConfirmPassword : _actualPassword;

    if (!obscure) {
      // If visible, actual is just the controller text
      if (isConfirm) {
        _actualConfirmPassword = value;
      } else {
        _actualPassword = value;
      }
      setState(() {});
      return;
    }

    // Obscured mode: calculate new actual text based on typing changes
    String newActual = '';
    final cursorPosition = controller.selection.baseOffset;

    if (value.length > actual.length) {
      // Character added (either typed or pasted)
      int addedLen = value.length - actual.length;
      int addedIndex = cursorPosition - addedLen;
      if (addedIndex >= 0 && addedIndex <= actual.length) {
        String addedText = value.substring(addedIndex, cursorPosition);
        newActual = actual.substring(0, addedIndex) + addedText + actual.substring(addedIndex);
      } else {
        newActual = actual + value.substring(actual.length);
      }
    } else if (value.length < actual.length) {
      // Character deleted
      int deletedLen = actual.length - value.length;
      int deletedIndex = cursorPosition;
      if (deletedIndex >= 0 && deletedIndex + deletedLen <= actual.length) {
        newActual = actual.substring(0, deletedIndex) + actual.substring(deletedIndex + deletedLen);
      } else {
        newActual = actual.substring(0, value.length);
      }
    } else {
      newActual = actual;
    }

    if (isConfirm) {
      _actualConfirmPassword = newActual;
    } else {
      _actualPassword = newActual;
    }

    if (newActual.isEmpty) {
      controller.value = const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
      );
      setState(() {});
      return;
    }

    // Mask with bullets, leaving only the very last typed character visible
    final masked = '•' * (newActual.length - 1) + newActual[newActual.length - 1];
    
    // Update the controller while maintaining proper cursor offset
    controller.value = TextEditingValue(
      text: masked,
      selection: TextSelection.collapsed(offset: cursorPosition.clamp(0, masked.length)),
    );

    // Cancel old timer and start a new 800ms timer to mask the remaining last letter
    if (isConfirm) {
      _confirmPasswordMaskTimer?.cancel();
      _confirmPasswordMaskTimer = Timer(const Duration(milliseconds: 800), () {
        if (!mounted) return;
        final currentSel = _confirmPasswordController.selection;
        _confirmPasswordController.value = TextEditingValue(
          text: '•' * _actualConfirmPassword.length,
          selection: currentSel,
        );
      });
    } else {
      _passwordMaskTimer?.cancel();
      _passwordMaskTimer = Timer(const Duration(milliseconds: 800), () {
        if (!mounted) return;
        final currentSel = _passwordController.selection;
        _passwordController.value = TextEditingValue(
          text: '•' * _actualPassword.length,
          selection: currentSel,
        );
      });
    }

    setState(() {});
  }

  void _register() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final fullName = '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}';

    final result = await _apiService.register(
      fullName,
      _emailController.text.trim(),
      _phoneController.text.trim(),
      _actualPassword,
      _selectedDate!,
    );

    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      if (mounted) {
        final userNumber = result['userNumber'] ?? '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              userNumber.isNotEmpty 
                ? 'Account created successfully! Your User ID is: $userNumber'
                : 'Account created successfully! Please login.',
              style: GoogleFonts.outfit(fontWeight: FontWeight.w600),
            ),
            backgroundColor: Colors.green.shade600,
            duration: const Duration(seconds: 6),
          ),
        );
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    } else {
      setState(() {
        _errorMessage = result['error'] ?? 'Registration failed';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: _currentStep == 0,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        _prevStep();
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black87),
            onPressed: _prevStep,
          ),
          title: const DrStripLogo(fontSize: 24, starSize: 28),
          centerTitle: true,
        ),
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_errorMessage != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ),
                ),

              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (page) {
                    setState(() {
                      _currentStep = page;
                    });
                  },
                  children: [
                    _buildStepWrapper(_buildNameStep()),
                    _buildStepWrapper(_buildEmailStep()),
                    _buildStepWrapper(_buildPhoneStep()),
                    _buildStepWrapper(_buildDobStep()),
                    _buildStepWrapper(_buildPasswordStep()),
                  ],
                ),
              ),

              // Navigation Bar
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        if (_currentStep > 0) ...[
                          OutlinedButton(
                            onPressed: _isLoading ? null : _prevStep,
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                              side: BorderSide(color: Colors.grey.shade300),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: Text(
                              'Back',
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                        ],
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isLoading ? null : _nextStep,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade600,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              elevation: 0,
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
                                    _currentStep == 4 ? 'Sign Up' : 'Next',
                                    style: GoogleFonts.outfit(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                    if (_currentStep == 0) ...[
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Already have an account? ',
                            style: GoogleFonts.outfit(color: Colors.grey.shade600),
                          ),
                          GestureDetector(
                            onTap: () => Navigator.pushReplacement(
                              context,
                              MaterialPageRoute(builder: (context) => const LoginScreen()),
                            ),
                            child: Text(
                              'Login',
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                color: Colors.blue.shade600,
                              ),
                            ),
                          ),
                        ],
                      ).animate().fadeIn(delay: 400.ms),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepWrapper(Widget child) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: child,
    );
  }

  Widget _buildNameStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Let's start with your name",
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ).animate().fadeIn().slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
        Text(
          "Join us to start your healthy journey",
          style: GoogleFonts.outfit(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 32),
        _buildTextField(
          controller: _firstNameController,
          label: 'First Name',
          icon: Icons.person_outline,
          focusNode: _firstNameFocusNode,
          errorText: _firstNameError,
          textCapitalization: TextCapitalization.words,
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _lastNameController,
          label: 'Last Name',
          icon: Icons.person_outline,
          focusNode: _lastNameFocusNode,
          errorText: _lastNameError,
          textCapitalization: TextCapitalization.words,
        ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),
      ],
    );
  }

  Widget _buildEmailStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "What's your email?",
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ).animate().fadeIn().slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
        Text(
          "We will use this to keep in touch and protect your account.",
          style: GoogleFonts.outfit(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 32),
        _buildTextField(
          controller: _emailController,
          label: 'Email',
          icon: Icons.email_outlined,
          focusNode: _emailFocusNode,
          keyboardType: TextInputType.emailAddress,
          errorText: _emailError,
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
      ],
    );
  }

  Widget _buildPhoneStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "And your phone number?",
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ).animate().fadeIn().slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
        Text(
          "Enter your mobile number to complete verify steps.",
          style: GoogleFonts.outfit(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 32),
        _buildTextField(
          controller: _phoneController,
          label: 'Phone Number',
          icon: Icons.phone_outlined,
          focusNode: _phoneFocusNode,
          keyboardType: TextInputType.phone,
          errorText: _phoneError,
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
      ],
    );
  }

  Widget _buildDobStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "When is your birthday?",
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ).animate().fadeIn().slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
        Text(
          "Your date of birth helps us customize your health indicators.",
          style: GoogleFonts.outfit(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 32),
        InkWell(
          onTap: _showDobPicker,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            decoration: BoxDecoration(
              border: Border.all(
                color: _dobError != null ? Colors.red.shade700 : Colors.grey.shade400,
                width: _dobError != null ? 1.5 : 1.0,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.cake_outlined, color: Colors.grey),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedDate == null 
                      ? 'Date of Birth' 
                      : DateFormat('dd/MM/yyyy').format(_selectedDate!),
                    style: TextStyle(
                      fontSize: 16,
                      color: _selectedDate == null ? Colors.grey.shade600 : Colors.black87,
                    ),
                  ),
                ),
                Icon(
                  Icons.arrow_drop_down,
                  color: Colors.grey.shade600,
                ),
              ],
            ),
          ),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
        if (_dobError != null) ...[
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 12),
            child: Text(
              _dobError!,
              style: TextStyle(color: Colors.red.shade700, fontSize: 12),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPasswordStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Create a password",
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ).animate().fadeIn().slideY(begin: 0.2, end: 0),
        const SizedBox(height: 8),
        Text(
          "Make sure your password is at least 6 characters long.",
          style: GoogleFonts.outfit(
            fontSize: 16,
            color: Colors.grey.shade600,
          ),
        ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0),
        const SizedBox(height: 32),
        
        // Password Field
        _buildTextField(
          controller: _passwordController,
          label: 'Password',
          icon: Icons.lock_outline,
          focusNode: _passwordFocusNode,
          errorText: _passwordError,
          onChanged: (val) => _onPasswordChanged(val, false),
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: Colors.grey,
            ),
            onPressed: () {
              setState(() {
                _obscurePassword = !_obscurePassword;
                if (_obscurePassword) {
                  _passwordController.text = '•' * _actualPassword.length;
                } else {
                  _passwordController.text = _actualPassword;
                }
              });
            },
          ),
        ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
        
        const SizedBox(height: 16),
        
        // Confirm Password Field
        _buildTextField(
          controller: _confirmPasswordController,
          label: 'Confirm Password',
          icon: Icons.lock_outline,
          focusNode: _confirmPasswordFocusNode,
          errorText: _confirmPasswordError,
          onChanged: (val) => _onPasswordChanged(val, true),
          suffixIcon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Inline match indicator: Green check circle on match, red close circle on mismatch
              if (_actualConfirmPassword.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(right: 4.0),
                  child: Icon(
                    _actualConfirmPassword == _actualPassword 
                        ? Icons.check_circle_rounded 
                        : Icons.cancel_rounded,
                    color: _actualConfirmPassword == _actualPassword 
                        ? Colors.green.shade600 
                        : Colors.red.shade600,
                    size: 22,
                  ),
                ),
              IconButton(
                icon: Icon(
                  _obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                  color: Colors.grey,
                ),
                onPressed: () {
                  setState(() {
                    _obscureConfirmPassword = !_obscureConfirmPassword;
                    if (_obscureConfirmPassword) {
                      _confirmPasswordController.text = '•' * _actualConfirmPassword.length;
                    } else {
                      _confirmPasswordController.text = _actualConfirmPassword;
                    }
                  });
                },
              ),
            ],
          ),
        ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1, end: 0),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    required FocusNode focusNode,
    String? errorText,
    Widget? suffixIcon,
    ValueChanged<String>? onChanged,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      obscureText: false, // We drive masking through the controller dynamically
      keyboardType: keyboardType ?? TextInputType.text,
      textCapitalization: textCapitalization,
      onChanged: onChanged,
      onSubmitted: (_) {
        if (focusNode == _firstNameFocusNode) {
          _lastNameFocusNode.requestFocus();
        } else if (focusNode == _passwordFocusNode) {
          _confirmPasswordFocusNode.requestFocus();
        } else {
          _nextStep();
        }
      },
      textInputAction: focusNode == _firstNameFocusNode || focusNode == _passwordFocusNode
          ? TextInputAction.next 
          : (_currentStep == 4 ? TextInputAction.done : TextInputAction.next),
      decoration: InputDecoration(
        labelText: label,
        errorText: errorText,
        errorStyle: const TextStyle(height: 0.8),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        prefixIcon: Icon(icon),
        suffixIcon: suffixIcon,
      ),
      style: GoogleFonts.outfit(),
    );
  }
}
