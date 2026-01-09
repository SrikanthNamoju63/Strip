package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.AdapterView;
import android.widget.Button;
import android.widget.GridView;
import android.widget.SimpleAdapter;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DoctorDetailActivity extends AppCompatActivity {

    private TextView tvDoctorName, tvSpecialization, tvHospital, tvExperience, tvEducation, tvLanguages, tvPrice,
            tvRating;
    private GridView gvTimeSlots;
    private Button btnContinueBooking;

    private String doctorId, doctorName, specialization, hospital, experience, education, fees, languages, rating,
            totalReviews;
    private String location, symptoms, appointmentType;
    private String selectedDate, selectedTime;

    private static final String TAG = "DoctorDetailActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_doctor_detail);

        Log.d(TAG, "=== DOCTOR DETAIL ACTIVITY STARTED ===");

        // Initialize views
        initializeViews();

        // Get data from previous activity
        getIntentData();

        // Set doctor details
        setDoctorDetails();

        // Load available time slots
        loadTimeSlots(doctorId);

        // Setup button click listener
        setupButtonClickListener();
    }

    private void initializeViews() {
        tvDoctorName = findViewById(R.id.tvDoctorName);
        tvSpecialization = findViewById(R.id.tvSpecialization);
        tvHospital = findViewById(R.id.tvHospital);
        tvExperience = findViewById(R.id.tvExperience);
        tvEducation = findViewById(R.id.tvEducation);
        tvLanguages = findViewById(R.id.tvLanguages);
        tvPrice = findViewById(R.id.tvPrice);
        tvRating = findViewById(R.id.tvRating);
        gvTimeSlots = findViewById(R.id.gvTimeSlots);
        btnContinueBooking = findViewById(R.id.btnContinueBooking);

        Log.d(TAG, "All views initialized successfully");
    }

    private void getIntentData() {
        Intent intent = getIntent();
        doctorId = intent.getStringExtra("doctorId");
        doctorName = intent.getStringExtra("doctorName");
        specialization = intent.getStringExtra("specialization");
        hospital = intent.getStringExtra("hospital");
        experience = intent.getStringExtra("experience");
        education = intent.getStringExtra("education");
        fees = intent.getStringExtra("fees");
        languages = intent.getStringExtra("languages");
        rating = intent.getStringExtra("rating");
        totalReviews = intent.getStringExtra("totalReviews");
        location = intent.getStringExtra("location");
        symptoms = intent.getStringExtra("symptoms");
        appointmentType = intent.getStringExtra("appointmentType");

        Log.d(TAG, "Received doctor data:");
        Log.d(TAG, "Doctor ID: " + doctorId);
        Log.d(TAG, "Doctor Name: " + doctorName);
        Log.d(TAG, "Specialization: " + specialization);
        Log.d(TAG, "Hospital: " + hospital);
        Log.d(TAG, "Experience: " + experience);
        Log.d(TAG, "Education: " + education);
        Log.d(TAG, "Fees: " + fees);
        Log.d(TAG, "Languages: " + languages);
        Log.d(TAG, "Rating: " + rating);
        Log.d(TAG, "Total Reviews: " + totalReviews);
    }

    private void setDoctorDetails() {
        Log.d(TAG, "Setting doctor details in UI");

        try {
            tvDoctorName.setText(doctorName != null ? doctorName : "N/A");
            tvSpecialization.setText(specialization != null ? specialization : "N/A");
            tvHospital.setText(hospital != null ? hospital : "N/A");
            tvExperience.setText(experience != null ? experience + " years experience" : "Experience not available");
            tvEducation.setText(education != null ? education : "Education not available");
            tvLanguages.setText("Languages: " + (languages != null ? languages : "Not specified"));
            tvPrice.setText(fees != null ? "₹" + fees : "₹0");
            tvRating.setText("⭐ " + (rating != null ? rating : "0.0") + " ("
                    + (totalReviews != null ? totalReviews : "0") + " reviews)");

            Log.d(TAG, "Doctor details set successfully");
        } catch (Exception e) {
            Log.e(TAG, "Error setting doctor details: " + e.getMessage());
            Toast.makeText(this, "Error displaying doctor details", Toast.LENGTH_SHORT).show();
        }
    }

    private void setupButtonClickListener() {
        btnContinueBooking.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (selectedDate == null || selectedTime == null) {
                    Toast.makeText(DoctorDetailActivity.this, "Please select a time slot", Toast.LENGTH_SHORT).show();
                    return;
                }

                Log.d(TAG, "Continuing booking for " + doctorName + " at " + selectedDate + " " + selectedTime);

                try {
                    Intent bookingIntent = new Intent(DoctorDetailActivity.this, PatientDetailsActivity.class);

                    // Pass doctor details
                    bookingIntent.putExtra("doctorId", doctorId);
                    bookingIntent.putExtra("doctorName", doctorName);
                    bookingIntent.putExtra("specialization", specialization);
                    bookingIntent.putExtra("hospital", hospital);
                    bookingIntent.putExtra("price", fees);
                    bookingIntent.putExtra("appointmentDate", selectedDate);
                    bookingIntent.putExtra("appointmentTime", selectedTime);

                    // Pass search criteria
                    bookingIntent.putExtra("location", location);
                    bookingIntent.putExtra("symptoms", symptoms);
                    bookingIntent.putExtra("appointmentType", appointmentType);

                    startActivity(bookingIntent);
                    Log.d(TAG, "PatientDetailsActivity started successfully");
                } catch (Exception e) {
                    Log.e(TAG, "Error starting PatientDetailsActivity: " + e.getMessage());
                    Toast.makeText(DoctorDetailActivity.this, "Error starting booking process", Toast.LENGTH_SHORT)
                            .show();
                }
            }
        });
    }

    private void loadTimeSlots(String doctorId) {
        Log.d(TAG, "Loading time slots for doctor ID: " + doctorId);

        ApiService apiService = RetrofitClient.getApiService();
        Call<List<Availability>> call = apiService.getDoctorAvailability(doctorId);

        call.enqueue(new Callback<List<Availability>>() {
            @Override
            public void onResponse(Call<List<Availability>> call, Response<List<Availability>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    List<Availability> availabilityList = response.body();
                    Log.d(TAG, "Received " + availabilityList.size() + " availability records");
                    displayTimeSlots(availabilityList);
                } else {
                    Log.e(TAG, "No availability data received, using default slots. Response code: " + response.code());
                    // If no availability data, show default time slots
                    displayDefaultTimeSlots();
                }
            }

            @Override
            public void onFailure(Call<List<Availability>> call, Throwable t) {
                Log.e(TAG, "Error loading time slots: " + t.getMessage());
                Toast.makeText(DoctorDetailActivity.this,
                        "Error loading time slots. Using default availability.", Toast.LENGTH_SHORT).show();
                // Show default time slots on failure
                displayDefaultTimeSlots();
            }
        });
    }

    private void displayTimeSlots(List<Availability> availabilityList) {
        List<Map<String, String>> timeSlots = generateTimeSlots(availabilityList);

        if (timeSlots.isEmpty()) {
            Log.d(TAG, "No time slots generated, showing default");
            displayDefaultTimeSlots();
            return;
        }

        Log.d(TAG, "Displaying " + timeSlots.size() + " time slots");
        displayTimeSlotsList(timeSlots);
    }

    private List<Map<String, String>> generateTimeSlots(List<Availability> availabilityList) {
        List<Map<String, String>> timeSlots = new ArrayList<>();
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat displayFormat = new SimpleDateFormat("EEE, MMM d", Locale.getDefault());
        SimpleDateFormat dayOfWeekFormat = new SimpleDateFormat("EEEE", Locale.getDefault()); // Full day name (Monday)

        Log.d(TAG, "Generating slots for 7 days starting " + dateFormat.format(calendar.getTime()));

        for (int i = 0; i < 7; i++) {
            String date = dateFormat.format(calendar.getTime());
            String displayDate = displayFormat.format(calendar.getTime());
            String currentDayName = dayOfWeekFormat.format(calendar.getTime());

            // Find availability for this day
            Availability dayAvailability = null;
            if (availabilityList != null) {
                for (Availability a : availabilityList) {
                    // Match "Monday" to "Monday"
                    if (a.getDay_of_week() != null && a.getDay_of_week().equalsIgnoreCase(currentDayName)) {
                        dayAvailability = a;
                        break;
                    }
                }
            }

            if (dayAvailability != null && dayAvailability.isIs_available()) {
                String startTimeStr = dayAvailability.getStart_time();
                String endTimeStr = dayAvailability.getEnd_time();

                Log.d(TAG, "Found availability for " + currentDayName + ": " + startTimeStr + " - " + endTimeStr);

                if (startTimeStr != null && endTimeStr != null) {
                    try {
                        int startHour = Integer.parseInt(startTimeStr.split(":")[0]);
                        int endHour = Integer.parseInt(endTimeStr.split(":")[0]);

                        for (int hour = startHour; hour < endHour; hour++) {
                            // Example lunch break logic (1 PM)
                            if (hour == 13)
                                continue;

                            String time = String.format(Locale.getDefault(), "%02d:00", hour);
                            Map<String, String> slot = new HashMap<>();
                            slot.put("date", date);
                            slot.put("time", time);
                            slot.put("display", displayDate + "\n" + time);
                            timeSlots.add(slot);

                            // 30 min slot?
                            // String time30 = String.format(Locale.getDefault(), "%02d:30", hour);
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error parsing time for " + currentDayName + ": " + e.getMessage());
                    }
                }
            } else {
                Log.d(TAG, "No availability found for " + currentDayName);
            }
            calendar.add(Calendar.DATE, 1);
        }
        return timeSlots;
    }

    private void displayDefaultTimeSlots() {
        Log.d(TAG, "Displaying default time slots");
        List<Map<String, String>> timeSlots = new ArrayList<>();
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        SimpleDateFormat displayFormat = new SimpleDateFormat("EEE, MMM d", Locale.getDefault());

        // Generate time slots for next 7 days, 9 AM to 5 PM
        for (int i = 0; i < 7; i++) {
            String date = dateFormat.format(calendar.getTime());
            String displayDate = displayFormat.format(calendar.getTime());

            for (int hour = 9; hour <= 17; hour++) {
                if (hour == 12)
                    continue; // Skip lunch hour

                String time = String.format(Locale.getDefault(), "%02d:00", hour);
                Map<String, String> slot = new HashMap<>();
                slot.put("date", date);
                slot.put("time", time);
                slot.put("display", displayDate + "\n" + time);
                timeSlots.add(slot);
            }
            calendar.add(Calendar.DATE, 1);
        }

        displayTimeSlotsList(timeSlots);
    }

    private void displayTimeSlotsList(List<Map<String, String>> timeSlots) {
        String[] from = { "display" };
        int[] to = { android.R.id.text1 };

        SimpleAdapter adapter = new SimpleAdapter(DoctorDetailActivity.this,
                timeSlots, android.R.layout.simple_list_item_1, from, to);
        gvTimeSlots.setAdapter(adapter);

        gvTimeSlots.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                Map<String, String> slot = timeSlots.get(position);
                selectedDate = slot.get("date");
                selectedTime = slot.get("time");

                Log.d(TAG, "Time slot selected: " + selectedDate + " " + selectedTime);

                // Highlight selected slot
                for (int i = 0; i < parent.getChildCount(); i++) {
                    parent.getChildAt(i).setBackgroundResource(android.R.color.transparent);
                }
                view.setBackgroundResource(R.drawable.selected_time_slot_bg);

                Toast.makeText(DoctorDetailActivity.this,
                        "Selected: " + slot.get("display"), Toast.LENGTH_SHORT).show();
            }
        });

        if (timeSlots.isEmpty()) {
            Toast.makeText(this, "No available time slots", Toast.LENGTH_SHORT).show();
        } else {
            Toast.makeText(this, "Select a time slot", Toast.LENGTH_SHORT).show();
        }
    }
}