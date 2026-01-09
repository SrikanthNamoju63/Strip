package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.RadioButton;
import android.widget.RadioGroup;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.Map;

public class PatientDetailsActivity extends AppCompatActivity {

    private EditText etPatientName, etAge, etContact, etEmail;
    private RadioGroup rgGender, rgPayment;
    private Button btnBookAppointment;
    private SessionManager sessionManager;

    private String doctorId, doctorName, specialization, hospital, price;
    private String appointmentDate, appointmentTime, location, symptoms, appointmentType;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_patient_details);

        sessionManager = new SessionManager(this);

        // Initialize views
        initializeViews();

        // Get data from previous activity
        getIntentData();

        // Pre-fill email if user is logged in
        if (sessionManager.isLoggedIn()) {
            etEmail.setText(sessionManager.getUserEmail());
        }

        setupButtonClickListener();
    }

    private void initializeViews() {
        etPatientName = findViewById(R.id.etPatientName);
        etAge = findViewById(R.id.etAge);
        etContact = findViewById(R.id.etContact);
        etEmail = findViewById(R.id.etEmail);
        rgGender = findViewById(R.id.rgGender);
        rgPayment = findViewById(R.id.rgPayment);
        btnBookAppointment = findViewById(R.id.btnBookAppointment);
    }

    private void getIntentData() {
        Intent intent = getIntent();
        doctorId = intent.getStringExtra("doctorId");
        doctorName = intent.getStringExtra("doctorName");
        specialization = intent.getStringExtra("specialization");
        hospital = intent.getStringExtra("hospital");
        price = intent.getStringExtra("price");
        appointmentDate = intent.getStringExtra("appointmentDate");
        appointmentTime = intent.getStringExtra("appointmentTime");
        location = intent.getStringExtra("location");
        symptoms = intent.getStringExtra("symptoms");
        appointmentType = intent.getStringExtra("appointmentType");

        // Log received data
        Log.d("PatientDetailsActivity", "Doctor: " + doctorName);
        Log.d("PatientDetailsActivity", "Appointment: " + appointmentDate + " " + appointmentTime);
    }

    private void setupButtonClickListener() {
        btnBookAppointment.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (validateInput()) {
                    // Check payment method and process accordingly
                    int paymentId = rgPayment.getCheckedRadioButtonId();
                    String paymentMethod = ((RadioButton) findViewById(paymentId)).getText().toString();

                    if (paymentMethod.equals("Credit/Debit Card") ||
                            paymentMethod.equals("PayPal") ||
                            paymentMethod.equals("Google Pay")) {
                        // Use dummy payment processor for testing
                        processDummyPayment();
                    } else {
                        bookAppointment();
                    }
                }
            }
        });
    }

    private boolean validateInput() {
        String patientName = etPatientName.getText().toString().trim();
        String age = etAge.getText().toString().trim();
        String contact = etContact.getText().toString().trim();
        String email = etEmail.getText().toString().trim();

        int genderId = rgGender.getCheckedRadioButtonId();
        if (genderId == -1) {
            Toast.makeText(PatientDetailsActivity.this, "Please select gender", Toast.LENGTH_SHORT).show();
            return false;
        }

        int paymentId = rgPayment.getCheckedRadioButtonId();
        if (paymentId == -1) {
            Toast.makeText(PatientDetailsActivity.this, "Please select payment method", Toast.LENGTH_SHORT).show();
            return false;
        }

        if (patientName.isEmpty()) {
            etPatientName.setError("Please enter your name");
            etPatientName.requestFocus();
            return false;
        }

        if (age.isEmpty()) {
            etAge.setError("Please enter your age");
            etAge.requestFocus();
            return false;
        }

        if (contact.isEmpty()) {
            etContact.setError("Please enter your contact number");
            etContact.requestFocus();
            return false;
        }

        if (email.isEmpty()) {
            etEmail.setError("Please enter your email");
            etEmail.requestFocus();
            return false;
        }

        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.setError("Please enter a valid email address");
            etEmail.requestFocus();
            return false;
        }

        return true;
    }

    /**
     * Dummy Payment Processor - Always approves for testing
     */
    private void processDummyPayment() {
        // Show loading state
        btnBookAppointment.setEnabled(false);
        btnBookAppointment.setText("Processing Payment...");

        // Map payment method to match backend enum values
        int paymentId = rgPayment.getCheckedRadioButtonId();
        String paymentMethod = ((RadioButton) findViewById(paymentId)).getText().toString();

        // Map to backend compatible values
        String mappedPaymentMethod;
        if (paymentMethod.equals("Credit/Debit Card")) {
            mappedPaymentMethod = "Credit Card";
        } else if (paymentMethod.equals("PayPal")) {
            mappedPaymentMethod = "PayPal";
        } else if (paymentMethod.equals("Google Pay")) {
            mappedPaymentMethod = "Google Pay";
        } else {
            mappedPaymentMethod = "Credit Card"; // default
        }

        // Simulate payment processing delay
        new android.os.Handler().postDelayed(
                new Runnable() {
                    @Override
                    public void run() {
                        // Always approve for testing
                        boolean paymentSuccess = true;
                        String transactionId = generateDummyTransactionId();

                        if (paymentSuccess) {
                            Log.d("DummyPayment", "Payment approved. Transaction ID: " + transactionId);
                            Toast.makeText(PatientDetailsActivity.this,
                                    "Payment approved! Transaction ID: " + transactionId,
                                    Toast.LENGTH_LONG).show();

                            // Proceed to book appointment after successful payment
                            bookAppointmentWithPayment(transactionId, "Completed", mappedPaymentMethod);
                        } else {
                            // This should never happen in testing mode
                            Log.e("DummyPayment", "Payment failed unexpectedly");
                            Toast.makeText(PatientDetailsActivity.this,
                                    "Payment failed. Please try again.",
                                    Toast.LENGTH_SHORT).show();
                            resetButtonState();
                        }
                    }
                },
                2000 // 2 second delay to simulate payment processing
        );
    }

    /**
     * Generate a dummy transaction ID for testing
     */
    private String generateDummyTransactionId() {
        return "TXN_" + System.currentTimeMillis() + "_TEST";
    }

    /**
     * Book appointment with payment details
     */
    private void bookAppointmentWithPayment(String transactionId, String paymentStatus, String paymentMethod) {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(this, "Please login to book an appointment", Toast.LENGTH_SHORT).show();
            resetButtonState();
            return;
        }

        String patientName = etPatientName.getText().toString().trim();
        String age = etAge.getText().toString().trim();
        String contact = etContact.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String gender = ((RadioButton) findViewById(rgGender.getCheckedRadioButtonId())).getText().toString();
        String originalPaymentMethod = ((RadioButton) findViewById(rgPayment.getCheckedRadioButtonId())).getText()
                .toString();

        int userId = sessionManager.getUserId();
        // Remove parsing: int doctorIdInt = Integer.parseInt(doctorId);

        // Create enhanced appointment request with payment info
        AppointmentRequest appointmentRequest = new AppointmentRequest(
                userId, doctorId, appointmentDate, appointmentTime,
                symptoms, appointmentType,
                "Patient: " + patientName + ", Age: " + age + ", Gender: " + gender +
                        ", Contact: " + contact + ", Email: " + email +
                        ", Payment: " + originalPaymentMethod + ", Transaction: " + transactionId);

        ApiService apiService = RetrofitClient.getApiService();
        // Call<Map<String, Object>> call =
        // apiService.bookAppointment(appointmentRequest);
        // In the bookAppointmentWithPayment method, change the API call to:
        Call<Map<String, Object>> call = apiService.bookAppointmentCompat(appointmentRequest);

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Map<String, Object> responseBody = response.body();
                    boolean success = responseBody.get("success") != null && (boolean) responseBody.get("success");

                    if (success) {
                        // Navigate to confirmation screen with payment details
                        Intent intent = new Intent(PatientDetailsActivity.this, BookingConfirmationActivity.class);
                        intent.putExtra("doctorName", doctorName);
                        intent.putExtra("specialization", specialization);
                        intent.putExtra("hospital", hospital);
                        intent.putExtra("appointmentDate", appointmentDate);
                        intent.putExtra("appointmentTime", appointmentTime);
                        intent.putExtra("patientName", patientName);
                        intent.putExtra("price", price);
                        intent.putExtra("paymentMethod", originalPaymentMethod);
                        intent.putExtra("transactionId", transactionId);
                        intent.putExtra("paymentStatus", paymentStatus);
                        startActivity(intent);
                        finish();
                    } else {
                        String errorMessage = responseBody.get("message") != null
                                ? responseBody.get("message").toString()
                                : "Failed to book appointment";
                        Toast.makeText(PatientDetailsActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                        resetButtonState();
                    }
                } else {
                    Toast.makeText(PatientDetailsActivity.this,
                            "Failed to book appointment. Please try again.", Toast.LENGTH_SHORT).show();
                    resetButtonState();
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                Toast.makeText(PatientDetailsActivity.this,
                        "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                resetButtonState();
            }
        });
    }

    /**
     * Original bookAppointment method (for cases without payment)
     */
    private void bookAppointment() {
        if (!sessionManager.isLoggedIn()) {
            Toast.makeText(this, "Please login to book an appointment", Toast.LENGTH_SHORT).show();
            return;
        }

        String patientName = etPatientName.getText().toString().trim();
        String age = etAge.getText().toString().trim();
        String contact = etContact.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String gender = ((RadioButton) findViewById(rgGender.getCheckedRadioButtonId())).getText().toString();
        String paymentMethod = ((RadioButton) findViewById(rgPayment.getCheckedRadioButtonId())).getText().toString();

        int userId = sessionManager.getUserId();
        // Remove parsing: int doctorIdInt = Integer.parseInt(doctorId);

        AppointmentRequest appointmentRequest = new AppointmentRequest(
                userId, doctorId, appointmentDate, appointmentTime,
                symptoms, appointmentType,
                "Patient: " + patientName + ", Age: " + age + ", Gender: " + gender +
                        ", Contact: " + contact + ", Email: " + email);

        ApiService apiService = RetrofitClient.getApiService();
        Call<Map<String, Object>> call = apiService.bookAppointment(appointmentRequest);

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    Map<String, Object> responseBody = response.body();
                    boolean success = responseBody.get("success") != null && (boolean) responseBody.get("success");

                    if (success) {
                        // Navigate to confirmation screen
                        Intent intent = new Intent(PatientDetailsActivity.this, BookingConfirmationActivity.class);
                        intent.putExtra("doctorName", doctorName);
                        intent.putExtra("specialization", specialization);
                        intent.putExtra("hospital", hospital);
                        intent.putExtra("appointmentDate", appointmentDate);
                        intent.putExtra("appointmentTime", appointmentTime);
                        intent.putExtra("patientName", patientName);
                        intent.putExtra("price", price);
                        startActivity(intent);
                        finish();
                    } else {
                        String errorMessage = responseBody.get("message") != null
                                ? responseBody.get("message").toString()
                                : "Failed to book appointment";
                        Toast.makeText(PatientDetailsActivity.this, errorMessage, Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(PatientDetailsActivity.this,
                            "Failed to book appointment. Please try again.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                Toast.makeText(PatientDetailsActivity.this,
                        "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Reset button to original state
     */
    private void resetButtonState() {
        btnBookAppointment.setEnabled(true);
        btnBookAppointment.setText("Book Appointment & Pay");
    }
}