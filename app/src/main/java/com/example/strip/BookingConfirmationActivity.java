package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;

public class BookingConfirmationActivity extends AppCompatActivity {

    private TextView tvConfirmationDetails;
    private Button btnViewAppointments, btnBackToHome, btnAddToCalendar;
    private android.widget.ImageView ivSuccess;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_confirmation);

        initializeViews();
        displayConfirmationDetails();
        setupButtonListeners();
        setupBackPressedHandler();
    }

    private void initializeViews() {
        tvConfirmationDetails = findViewById(R.id.tvConfirmationDetails);
        btnViewAppointments = findViewById(R.id.btnViewAppointments);
        btnBackToHome = findViewById(R.id.btnBackToHome);
        btnAddToCalendar = findViewById(R.id.btnAddToCalendar);
        ivSuccess = findViewById(R.id.ivSuccess);

        // Start Success Animation
        android.graphics.drawable.Drawable drawable = ivSuccess.getDrawable();
        if (drawable instanceof android.graphics.drawable.Animatable) {
            ((android.graphics.drawable.Animatable) drawable).start();
        }
    }

    private void displayConfirmationDetails() {
        Intent intent = getIntent();

        // Get all possible data from intent
        String doctorName = intent.getStringExtra("doctorName");
        String specialization = intent.getStringExtra("specialization");
        String hospital = intent.getStringExtra("hospital");
        String appointmentDate = intent.getStringExtra("appointmentDate");
        String appointmentTime = intent.getStringExtra("appointmentTime");
        String patientName = intent.getStringExtra("patientName");
        String address = intent.getStringExtra("address");
        String price = intent.getStringExtra("price");
        String paymentMethod = intent.getStringExtra("paymentMethod");
        String transactionId = intent.getStringExtra("transactionId");
        String paymentStatus = intent.getStringExtra("paymentStatus");

        // Format and display confirmation message
        String confirmationMessage = formatConfirmationMessage(
                doctorName, specialization, hospital, appointmentDate,
                appointmentTime, patientName, address, price, paymentMethod, paymentStatus, transactionId);
        tvConfirmationDetails.setText(confirmationMessage);
    }

    private String formatConfirmationMessage(String doctorName, String specialization,
            String hospital, String appointmentDate,
            String appointmentTime, String patientName,
            String address, String price, String paymentMethod,
            String paymentStatus, String transactionId) {

        StringBuilder message = new StringBuilder();

        if (patientName != null) {
            message.append("Dear ").append(patientName).append(",\n\n");
        } else {
            message.append("Dear Patient,\n\n");
        }

        // message.append("Your appointment has been confirmed!\n\n"); // Removed as
        // header already says this

        // Appointment Details
        if (doctorName != null) {
            message.append("Doctor: Dr. ").append(doctorName).append("\n");
        }

        if (specialization != null) {
            message.append("Specialization: ").append(specialization).append("\n");
        }

        if (hospital != null) {
            message.append("Hospital: ").append(hospital).append("\n");
        }

        if (appointmentDate != null && appointmentTime != null) {
            message.append("Date & Time: ").append(appointmentDate).append(" at ").append(appointmentTime).append("\n");
        } else if (appointmentDate != null) {
            message.append("Date: ").append(appointmentDate).append("\n");
        }

        if (address != null) {
            message.append("Address: ").append(address).append("\n");
        } else if (hospital != null) {
            message.append("Location: ").append(hospital).append("\n");
        }

        // Payment Information
        if (price != null) {
            message.append("Amount: ₹").append(price).append("\n");
        }

        if (paymentStatus != null) {
            String statusEmoji = paymentStatus.equalsIgnoreCase("Completed") ? "" : "";
            message.append(statusEmoji).append(" Payment Status: ").append(paymentStatus).append("\n");
        } else if (paymentMethod != null) {
            message.append("Payment Method: ").append(paymentMethod).append("\n");
        }

        if (transactionId != null) {
            message.append("Transaction ID: ").append(transactionId).append("\n");
        }

        message.append("\nYou will receive a confirmation email shortly.\n");
        message.append("\nThank you for choosing our service!");

        return message.toString();
    }

    private void setupButtonListeners() {
        btnViewAppointments.setOnClickListener(v -> {
            Intent profileIntent = new Intent(BookingConfirmationActivity.this, ProfileActivity.class);
            profileIntent.putExtra("showAppointments", true);
            startActivity(profileIntent);
            finish();
        });

        btnBackToHome.setOnClickListener(v -> {
            navigateToHome();
        });

        btnAddToCalendar.setOnClickListener(v -> {
            addToGoogleCalendar();
        });
    }

    private void setupBackPressedHandler() {
        // Modern way to handle back press with OnBackPressedDispatcher
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                navigateToHome();
            }
        });
    }

    private void navigateToHome() {
        Intent homeIntent = new Intent(BookingConfirmationActivity.this, AppointmentBookingActivity.class);
        homeIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(homeIntent);
        finish();
    }

    private void addToGoogleCalendar() {
        try {
            Intent intent = getIntent();
            String doctorName = intent.getStringExtra("doctorName");
            String specialization = intent.getStringExtra("specialization");
            String hospital = intent.getStringExtra("hospital");
            String appointmentDate = intent.getStringExtra("appointmentDate");
            String appointmentTime = intent.getStringExtra("appointmentTime");
            String address = intent.getStringExtra("address");
            String paymentMethod = intent.getStringExtra("paymentMethod");

            Intent calendarIntent = new Intent(Intent.ACTION_INSERT);
            calendarIntent.setType("vnd.android.cursor.item/event");

            // Set event details
            String eventTitle = "Doctor Appointment";
            if (doctorName != null) {
                eventTitle += " - Dr. " + doctorName;
            }
            calendarIntent.putExtra("title", eventTitle);

            StringBuilder description = new StringBuilder();
            if (specialization != null) {
                description.append("Specialization: ").append(specialization).append("\n");
            }
            if (hospital != null) {
                description.append("Hospital: ").append(hospital).append("\n");
            }
            if (paymentMethod != null) {
                description.append("Payment Method: ").append(paymentMethod).append("\n");
            }
            calendarIntent.putExtra("description", description.toString());

            String location = address != null ? address : (hospital != null ? hospital : "");
            calendarIntent.putExtra("eventLocation", location);

            // Set date and time (simplified - in real app, parse your actual date format)
            long startTime = System.currentTimeMillis() + (60 * 60 * 1000); // 1 hour from now
            calendarIntent.putExtra("beginTime", startTime);
            calendarIntent.putExtra("endTime", startTime + (45 * 60 * 1000)); // 45 minutes duration

            // Set reminder (15 minutes before)
            calendarIntent.putExtra("allDay", false);
            calendarIntent.putExtra("hasAlarm", true);

            startActivity(calendarIntent);

        } catch (Exception e) {
            Toast.makeText(this, "Error adding to calendar: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            Toast.makeText(this, "Please make sure you have a calendar app installed", Toast.LENGTH_LONG).show();
        }
    }
}