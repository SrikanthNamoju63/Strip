import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../services/api_service.dart';
import 'booking_success_screen.dart';

class BookAppointmentScreen extends StatefulWidget {
  final Map<String, dynamic> doctor;
  final DateTime? preSelectedDate;
  final String? preSelectedSlot;

  const BookAppointmentScreen({
    super.key,
    required this.doctor,
    this.preSelectedDate,
    this.preSelectedSlot,
  });

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _bookingForMe = false;
  bool _isLoading = false;

  // Controllers
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _contactController = TextEditingController();
  final TextEditingController _reasonController = TextEditingController();
  final TextEditingController _couponController = TextEditingController();

  // Slot Selection
  String? _selectedDate;
  String? _selectedTime;
  List<dynamic> _slots = []; // Changed to dynamic
  bool _loadingSlots = false;

  String _paymentMethod = 'UPI';
  String _gender = 'Male';
  
  // Fees
  double _platformFee = 10.0; // Default fallback
  double _discountAmount = 0.0;
  bool _loadingFees = false;
  bool _isValidatingCoupon = false;
  String _appliedCoupon = '';

  late Razorpay _razorpay;

  @override
  void initState() {
    super.initState();
    
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);

    // Initialize date from pre-selection or today
    _selectedDate =
        (widget.preSelectedDate ?? DateTime.now()).toIso8601String().split(
          'T',
        )[0];
    _selectedTime = widget.preSelectedSlot;

    // Fetch slots for the date
    _fetchSlots();
    _fetchFees();
  }

  @override
  void dispose() {
    super.dispose();
    _razorpay.clear();
  }


  Future<void> _fetchFees() async {
    setState(() => _loadingFees = true);
    final config = await ApiService.getFeeConfig();
    if (mounted && config != null) {
      if (config['platformFee'] != null) {
          setState(() {
            // platformFee can be int or double
            _platformFee = (config['platformFee'] as num).toDouble();
          });
      }
    }
    setState(() => _loadingFees = false);
  }

  Future<void> _fetchSlots() async {
    if (_selectedDate == null) return;
    setState(() => _loadingSlots = true);
    try {
      final slots = await ApiService.getDoctorSlots(
        widget.doctor['_id'],
        _selectedDate!,
      );
      setState(() {
        _slots = slots; 
        // We keep all slots to show status (Booked/Locked). 
        // Backend returns [{time: "10:00", status: "booked"}, ...]
      });
    } catch (e) {
      debugPrint('Error fetching slots: $e');
    } finally {
      setState(() => _loadingSlots = false);
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.parse(_selectedDate ?? now.toIso8601String()),
      firstDate: now,
      lastDate: now.add(Duration(days: 30)),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked.toIso8601String().split('T')[0];
        _selectedTime = null; // Reset time
      });
      _fetchSlots();
    }
  }

  Future<void> _toggleBookingForMe(bool? value) async {
    if (value == null) return;
    setState(() {
      _bookingForMe = value;
    });

    if (_bookingForMe) {
      setState(() => _isLoading = true);
      try {
        final api = ApiService();
        final profile = await api.getUserProfile();
        if (profile != null) {
          setState(() {
            _nameController.text = profile['name'] ?? '';
            _contactController.text = profile['phone'] ?? '';

            if (profile['age'] != null) {
              _ageController.text = profile['age'].toString();
            } else if (profile['dob'] != null) {
              try {
                final dob = DateTime.parse(profile['dob']);
                final age = DateTime.now().year - dob.year;
                _ageController.text = age.toString();
              } catch (e) {
                debugPrint("Error parsing DOB: $e");
              }
            }
            
            if (profile['gender'] != null) {
               // Ensure the value matches our dropdown items ['Male', 'Female', 'Other']
               String g = profile['gender'];
               if (['Male', 'Female', 'Other'].contains(g)) {
                   _gender = g;
               } else {
                   // Fallback or fuzzy match if needed, but for now strict match
                   // If backend stores 'M' or 'F', we might need mapping. 
                   // Assuming backend stores 'Male', 'Female' etc. as per simple schema usually.
                   if (g.toLowerCase() == 'male') {
                     _gender = 'Male';
                   } else if (g.toLowerCase() == 'female') _gender = 'Female';
               }
            }
          });
        }
      } catch (e) {
        debugPrint('Error loading profile: $e');
      } finally {
        setState(() => _isLoading = false);
      }
    } else {
      setState(() {
        _nameController.clear();
        _contactController.clear();
        _ageController.clear();
      });
    }
  }

  Map<String, dynamic>? _currentPaymentContext;

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      if (_currentPaymentContext == null) return;
      
      setState(() => _isLoading = true);
      
      final paymentId = response.paymentId;
      final signature = response.signature;
      final orderId = response.orderId;
      
      // Verify with backend
      final verify = await ApiService().verifyPayment(
          paymentId!,
          orderId!,
          signature!,
      );

      setState(() => _isLoading = false);

      if (verify != null && verify['success'] == true) {
        if (mounted) {
           Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder:
                  (ctx) => BookingSuccessScreen(
                    appointmentDetails: {
                      'doctorName': widget.doctor['name'],
                      'tokenNumber':
                          _currentPaymentContext!['appointment']['tokenNumber']?.toString() ??
                          _currentPaymentContext!['appointment']['_id'] ?? 'N/A',
                      'appointment': _currentPaymentContext!['appointment'],
                      'payment': verify['data'],
                    },
                  ),
            ),
          );
        }
      } else {
        _showErrorDialog("Payment verification failed. Please contact support.");
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showErrorDialog("Verification Error: $e");
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    setState(() => _isLoading = false);
    _showErrorDialog("Payment Failed: ${response.code} - ${response.message}");
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    setState(() => _isLoading = false);
    _showErrorDialog("External Wallet Selected: ${response.walletName}");
  }

  Future<void> _validateCoupon() async {
    if (_couponController.text.isEmpty) return;
    setState(() => _isValidatingCoupon = true);
    try {
      final res = await ApiService().validateCoupon(_couponController.text);
      if (res != null && res['coupon'] != null) {
        final coupon = res['coupon'];
        setState(() {
          _appliedCoupon = coupon['code'];
          double rawTotal = (widget.doctor['consultationFee'] ?? 0) + _platformFee;
          if (coupon['discountType'] == 'PERCENTAGE') {
            _discountAmount = (rawTotal * coupon['discountValue']) / 100;
          } else {
            _discountAmount = (coupon['discountValue']).toDouble();
          }
          if (coupon['maxDiscount'] != null && _discountAmount > coupon['maxDiscount']) {
            _discountAmount = (coupon['maxDiscount']).toDouble();
          }
          if (_discountAmount > rawTotal) {
             _discountAmount = rawTotal;
          }
        });
        showDialog(context: context, builder: (_) => AlertDialog(title: Text("Success"), content: Text("Coupon applied!")));
      } else {
        setState(() { _discountAmount = 0.0; _appliedCoupon = ''; });
        _showErrorDialog(res?['msg'] ?? "Invalid Coupon");
      }
    } catch (e) {
      setState(() { _discountAmount = 0.0; _appliedCoupon = ''; });
      _showErrorDialog("Failed to validate coupon");
    } finally {
      setState(() => _isValidatingCoupon = false);
    }
  }

  Future<void> _processPaymentAndBook() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedTime == null) {
      _showErrorDialog("Please select the slot to continue");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final api = ApiService();
      
      // 1. Create Appointment (Pending Status)
      final response = await api.bookAppointment(
        widget.doctor['_id'],
        _selectedDate!,
        _selectedTime!,
        _reasonController.text,
        _nameController.text,
        age: int.tryParse(_ageController.text),
        gender: _gender,
        contact: _contactController.text,
        couponCode: _appliedCoupon.isNotEmpty ? _appliedCoupon : null,
      );

      if (response != null) {
        final appointment = response['appointment'] ?? response;
        final appointmentId = appointment['_id'] ?? appointment['id'];

        // 2. Initiate Payment (Get Razorpay Order)
        final init = await api.initiatePayment(
          appointmentId.toString(),
          _paymentMethod,
        );

        if (init == null || init['success'] != true) {
          setState(() => _isLoading = false);
          _showErrorDialog('Failed to initiate payment. Please try again.');
          return;
        }

        final data = init['data'];
        final String orderId = data['orderId'];
        final String keyId = data['keyId'];
        final int amount = data['amount']; // in paise
        final String currency = data['currency'];
        
        // Store context for success handler
        _currentPaymentContext = {
            'appointment': appointment,
            'orderId': orderId,
        };

        // 3. Open Razorpay Checkout
        var options = {
          'key': keyId,
          'amount': amount,
          'name': 'HealthApp Consultation',
          'description': 'Appointment with ${widget.doctor['name']}',
          'order_id': orderId,
          'prefill': {
            'contact': _contactController.text,
            'email': 'test@example.com' // Should fetch user email
          },
          'external': {
            'wallets': ['paytm']
          }
        };

        _razorpay.open(options);
        // Loading state remains true until payment success/failure/closed
        
      } else {
         setState(() => _isLoading = false);
         _showErrorDialog("Booking failed. Please try again.");
      }

    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        String msg = e.toString().replaceAll("Exception: ", "");
        _showErrorDialog(msg);
      }
    }
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder:
          (ctx) => AlertDialog(
            title: Text("Notice", style: TextStyle(color: Colors.red)),
            content: Text(message),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text("OK"),
              ),
            ],
          ),
    );
  }

  void _showSuccessDialog(String? tokenArg) {
    final token =
        tokenArg ??
        DateTime.now().millisecondsSinceEpoch.toString().substring(8);
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (ctx) => AlertDialog(
            title: Column(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 60),
                SizedBox(height: 16),
                Text("Booking Confirmed!"),
              ],
            ),
            content: Text(
              "Your appointment with ${widget.doctor['name']} has been booked successfully.\n\nToken: TK-$token\n\nA confirmation email has been sent.",
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx); // Close Dialog
                  Navigator.pop(ctx); // Close Booking Screen
                  Navigator.pop(ctx); // Close Details Screen
                },
                child: Text("Go Home"),
              ),
            ],
          ),
    );
  }

  String _formatTime(String time) {
    if (time.isEmpty) return "";
    try {
      final parts = time.split(':');
      int hour = int.parse(parts[0]);
      int minute = int.parse(parts[1]);
      String period = hour >= 12 ? 'PM' : 'AM';
      hour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      return "${hour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $period";
    } catch (e) {
      return time;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Book Appointment")),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Doctor Summary
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(child: Text(widget.doctor['name'][0])),
                  title: Text(
                    widget.doctor['name'],
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(widget.doctor['specialization'] ?? ''),
                ),
                Divider(),

                // Checkbox
                Row(
                  children: [
                    Checkbox(
                      value: _bookingForMe,
                      onChanged: _toggleBookingForMe,
                    ),
                    Text("This booking is for me"),
                  ],
                ),
                if (_isLoading && _bookingForMe) LinearProgressIndicator(),

                // Form
                SizedBox(height: 16),
                Text(
                  "Patient Details",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 16),

                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: "Patient Name",
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) => v!.isEmpty ? "Required" : null,
                ),
                SizedBox(height: 16),
                SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _ageController,
                        decoration: InputDecoration(
                          labelText: "Age",
                          border: OutlineInputBorder(),
                        ),
                        keyboardType: TextInputType.number,
                        validator: (v) {
                          if (v == null || v.isEmpty) return "Required";
                          final age = int.tryParse(v);
                          if (age == null) return "Invalid";
                          if (age > 110) return "Max 110";
                          return null;
                        },
                      ),
                    ),
                    SizedBox(width: 8),
                    Expanded(
                      flex: 3,
                      child: DropdownButtonFormField<String>(
                        decoration: InputDecoration(
                          labelText: 'Gender',
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 0)
                        ),
                        value: _gender,
                        items: ['Male', 'Female', 'Other'].map((String value) {
                          return DropdownMenuItem<String>(
                            value: value,
                            child: Text(value),
                          );
                        }).toList(),
                        onChanged: (val) {
                           if (val != null) setState(() => _gender = val);
                        },
                        onSaved: (val) {
                          // _gender = val;
                        },
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _contactController,
                  decoration: InputDecoration(
                    labelText: "Phone Number",
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.phone,
                  validator: (v) {
                     if (v == null || v.isEmpty) return "Required";
                     if (v.length != 10) return "Must be 10 digits";
                     if (!RegExp(r'^[0-9]+$').hasMatch(v)) return "Digits only";
                     return null;
                  },
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _reasonController,
                  decoration: InputDecoration(
                    labelText: "Reason / Symptoms",
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                  validator: (v) => v!.isEmpty ? "Required" : null,
                ),

                SizedBox(height: 24),
                // Date Selection
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Date: ${DateFormat('dd/MM/yyyy').format(DateTime.parse(_selectedDate!))}",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: _pickDate,
                      child: Text("Change Date"),
                    ),
                  ],
                ),

                // Slot Selection
                Text(
                  "Select Slot",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),

                if (_loadingSlots)
                  Center(child: CircularProgressIndicator())
                else if (_slots.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Text(
                      "No slots available for this date.",
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3, // Reduced count for better visibility
                      childAspectRatio: 2.2,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                    ),
                    itemCount: _slots.length,
                    itemBuilder: (context, index) {
                      final slotObj = _slots[index];
                      final slotTime = slotObj is Map ? slotObj['time'] : slotObj;
                      final status = slotObj is Map ? slotObj['status'] : 'available'; // 'available', 'booked', 'locked'
                      
                      final isAvailable = status == 'available';
                      final isLocked = status == 'locked';
                      final isBooked = status == 'booked';
                      final isSelected = _selectedTime == slotTime;

                      Color bgColor = Colors.white;
                      Color textColor = Colors.black;
                      String label = _formatTime(slotTime);

                      if (isBooked) {
                        bgColor = Colors.grey.shade300;
                        textColor = Colors.grey;
                      } else if (isLocked) {
                        bgColor = Colors.orange.shade50;
                        textColor = Colors.orange.shade800;
                        label = "Being booked...";
                      } else if (isSelected) {
                        bgColor = Colors.blue.shade600;
                        textColor = Colors.white;
                      }

                      return GestureDetector(
                        onTap: isAvailable
                            ? () {
                                setState(() => _selectedTime = slotTime);
                              }
                            : null,
                        child: Container(
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: isSelected ? Colors.blue : (isLocked ? Colors.orange.shade200 : Colors.grey.shade300),
                            ),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                label,
                                style: TextStyle(
                                  fontSize: isLocked ? 10 : 12, // Smaller font for "Being booked..."
                                  fontWeight: isSelected || isLocked ? FontWeight.bold : FontWeight.normal,
                                  color: textColor,
                                  decoration: isBooked ? TextDecoration.lineThrough : null,
                                ),
                                textAlign: TextAlign.center,
                              ),
                             if (isLocked)
                                Padding(
                                  padding: const EdgeInsets.only(top: 2.0),
                                  child: Icon(Icons.lock_clock, size: 10, color: Colors.orange),
                                )
                            ],
                          ),
                        ),
                      );
                    },
                  ),

                SizedBox(height: 32),

                // Coupon
                Text(
                  "Have a Coupon?",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _couponController,
                        decoration: InputDecoration(
                          labelText: "Coupon Code",
                          border: OutlineInputBorder(),
                          contentPadding: EdgeInsets.symmetric(horizontal: 12),
                          suffixIcon: _appliedCoupon.isNotEmpty ? Icon(Icons.check_circle, color: Colors.green) : null,
                        ),
                        readOnly: _appliedCoupon.isNotEmpty,
                      ),
                    ),
                    SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _appliedCoupon.isNotEmpty ? () {
                         setState(() { _appliedCoupon = ''; _discountAmount = 0.0; _couponController.clear(); });
                      } : _isValidatingCoupon ? null : _validateCoupon,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _appliedCoupon.isNotEmpty ? Colors.red.shade100 : Colors.indigo.shade100,
                        foregroundColor: _appliedCoupon.isNotEmpty ? Colors.red : Colors.indigo,
                        elevation: 0,
                      ),
                      child: _isValidatingCoupon ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) 
                                                 : Text(_appliedCoupon.isNotEmpty ? "Remove" : "Apply"),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                if (_appliedCoupon.isNotEmpty)
                   Text("Coupon '$_appliedCoupon' applied successfully!", style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
                
                SizedBox(height: 24),

                // Payment
                Card(
                  color: Colors.green.shade50,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Consultation Fee",
                              style: TextStyle(fontSize: 14),
                            ),
                            Text(
                              "₹${widget.doctor['consultationFee'] ?? 0}",
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Platform Fee",
                              style: TextStyle(fontSize: 14),
                            ),
                            Text(
                              "₹${_platformFee.toStringAsFixed(2)}",
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        if (_discountAmount > 0)
                           Padding(
                             padding: const EdgeInsets.only(top: 8.0),
                             child: Row(
                               mainAxisAlignment: MainAxisAlignment.spaceBetween,
                               children: [
                                 Text(
                                   "Discount",
                                   style: TextStyle(fontSize: 14, color: Colors.green),
                                 ),
                                 Text(
                                   "- ₹${_discountAmount.toStringAsFixed(2)}",
                                   style: TextStyle(
                                     fontSize: 14,
                                     fontWeight: FontWeight.bold,
                                     color: Colors.green,
                                   ),
                                 ),
                               ],
                             ),
                           ),
                        Divider(height: 24, thickness: 1),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "Total Payable",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade900,
                              ),
                            ),
                            Text(
                              "₹${(((widget.doctor['consultationFee'] ?? 0) + _platformFee) - _discountAmount).toStringAsFixed(2)}",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.green.shade900,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 16),

                Text(
                  "Payment Method",
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children:
                      ['UPI', 'Debit Card', 'Net Banking'].map((method) {
                        final isSelected = _paymentMethod == method;
                        return ChoiceChip(
                          label: Text(method),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(
                              () => _paymentMethod = selected ? method : 'UPI',
                            );
                          },
                          selectedColor: Colors.green.shade100,
                        );
                      }).toList(),
                ),

                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _processPaymentAndBook,
                  style: ElevatedButton.styleFrom(
                    minimumSize: Size(double.infinity, 50),
                    backgroundColor: Colors.blue.shade800,
                  ),
                  child:
                      _isLoading
                          ? CircularProgressIndicator(color: Colors.white)
                          : Text(
                            "Pay & Book Appointment",
                            style: TextStyle(fontSize: 18, color: Colors.white),
                          ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
