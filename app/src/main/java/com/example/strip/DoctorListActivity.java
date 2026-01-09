package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.SimpleAdapter;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DoctorListActivity extends AppCompatActivity {

    private ListView lvDoctors;
    private TextView tvEmptyView;
    private List<Map<String, String>> doctorList;
    private String location, symptoms, appointmentType, specialization;
    private List<Doctor> doctors;

    private static final String TAG = "DoctorListActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_doctor_list);

        Log.d(TAG, "=== DOCTOR LIST ACTIVITY STARTED ===");

        // Initialize views
        lvDoctors = findViewById(R.id.lvDoctors);
        tvEmptyView = findViewById(R.id.tvEmptyView);
        doctorList = new ArrayList<>();

        // Get data from previous activity
        Intent intent = getIntent();
        location = intent.getStringExtra("location");
        symptoms = intent.getStringExtra("symptoms");
        appointmentType = intent.getStringExtra("appointmentType");
        specialization = intent.getStringExtra("specialization");
        doctors = (List<Doctor>) intent.getSerializableExtra("doctors");

        Log.d(TAG, "Doctors received: " + (doctors != null ? doctors.size() : "null"));

        // Display doctors if we have them, otherwise load from API
        if (doctors != null && !doctors.isEmpty()) {
            Log.d(TAG, "Displaying doctors from intent");
            displayDoctors(doctors);
        } else {
            Log.d(TAG, "No doctors received from intent, loading from API");
            loadDoctorsFromApi();
        }
    }

    private void displayDoctors(List<Doctor> doctors) {
        Log.d(TAG, "displayDoctors called with " + (doctors != null ? doctors.size() : "null") + " doctors");

        doctorList.clear();
        this.doctors = doctors; // Make sure we have reference

        if (doctors == null || doctors.isEmpty()) {
            Log.d(TAG, "No doctors to display, showing empty view");
            showEmptyView("No doctors found for your criteria");
            return;
        }

        Log.d(TAG, "Preparing to display " + doctors.size() + " doctors");
        hideEmptyView();

        // Create the data for the adapter
        for (int i = 0; i < doctors.size(); i++) {
            Doctor doctor = doctors.get(i);
            Map<String, String> doctorMap = new HashMap<>();
            doctorMap.put("name", doctor.getDoctor_name());
            doctorMap.put("specialization", doctor.getSpecialization_name());
            doctorMap.put("hospital", doctor.getHospital_name());
            doctorMap.put("experience", doctor.getExperience() + " years experience");
            doctorMap.put("education", doctor.getEducation());
            doctorMap.put("price", "₹" + doctor.getFees());
            doctorMap.put("languages", "Languages: " + doctor.getLanguages());
            doctorMap.put("rating", "⭐ " + doctor.getRating() + " (" + doctor.getTotal_reviews() + " reviews)");
            doctorList.add(doctorMap);

            Log.d(TAG, "Added doctor " + i + ": " + doctor.getDoctor_name());
        }

        // Create and set the adapter
        String[] from = { "name", "specialization", "hospital", "experience", "education", "price", "languages",
                "rating" };
        int[] to = { R.id.tvDoctorName, R.id.tvSpecialization, R.id.tvHospital, R.id.tvExperience,
                R.id.tvEducation, R.id.tvPrice, R.id.tvLanguages, R.id.tvRating };

        Log.d(TAG, "Creating SimpleAdapter with " + doctorList.size() + " items");

        SimpleAdapter adapter = new SimpleAdapter(this,
                doctorList, R.layout.item_doctor, from, to);

        lvDoctors.setAdapter(adapter);
        Log.d(TAG, "Adapter set on ListView. Adapter count: " + adapter.getCount());

        // Setup click listener AFTER setting adapter
        setupClickListeners();

        // Show success message with instructions
        Toast.makeText(this, "Found " + doctors.size() + " doctors. Tap any doctor to view details.", Toast.LENGTH_LONG)
                .show();
    }

    private void setupClickListeners() {
        Log.d(TAG, "Setting up click listeners");

        // Set item click listener
        lvDoctors.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                Log.d(TAG, "=== LISTVIEW ITEM CLICKED ===");
                Log.d(TAG, "Position: " + position);
                Log.d(TAG, "Doctors list size: " + (doctors != null ? doctors.size() : "null"));

                if (doctors == null || doctors.isEmpty()) {
                    Log.e(TAG, "Doctors list is null or empty!");
                    Toast.makeText(DoctorListActivity.this, "Doctors data not available", Toast.LENGTH_SHORT).show();
                    return;
                }

                if (position < 0 || position >= doctors.size()) {
                    Log.e(TAG, "Invalid position: " + position + ", doctors size: " + doctors.size());
                    Toast.makeText(DoctorListActivity.this, "Invalid selection", Toast.LENGTH_SHORT).show();
                    return;
                }

                Doctor doctor = doctors.get(position);
                Log.d(TAG, "Doctor selected: " + doctor.getDoctor_name() + " (ID: " + doctor.getDoctor_id() + ")");

                openDoctorDetails(doctor);
            }
        });

        // Test: Add a long click listener to see if ANY click is registered
        lvDoctors.setOnItemLongClickListener(new AdapterView.OnItemLongClickListener() {
            @Override
            public boolean onItemLongClick(AdapterView<?> parent, View view, int position, long id) {
                Log.d(TAG, "LONG CLICK detected at position: " + position);
                Toast.makeText(DoctorListActivity.this, "Long click detected", Toast.LENGTH_SHORT).show();
                return true;
            }
        });

        Log.d(TAG, "Click listeners setup completed");
    }

    private void showEmptyView(String message) {
        Log.d(TAG, "Showing empty view: " + message);
        if (tvEmptyView != null) {
            tvEmptyView.setText(message);
            tvEmptyView.setVisibility(View.VISIBLE);
            lvDoctors.setVisibility(View.GONE);
        }
    }

    private void hideEmptyView() {
        Log.d(TAG, "Hiding empty view");
        if (tvEmptyView != null) {
            tvEmptyView.setVisibility(View.GONE);
            lvDoctors.setVisibility(View.VISIBLE);
        }
    }

    private void openDoctorDetails(Doctor doctor) {
        Log.d(TAG, "=== OPENING DOCTOR DETAILS ===");
        Log.d(TAG, "Doctor: " + doctor.getDoctor_name());
        Log.d(TAG, "Hospital: " + doctor.getHospital_name());

        try {
            Intent intent = new Intent(DoctorListActivity.this, DoctorDetailActivity.class);

            // Pass all doctor details
            intent.putExtra("doctorId", doctor.getDoctor_id());
            intent.putExtra("doctorName", doctor.getDoctor_name());
            intent.putExtra("specialization", doctor.getSpecialization_name());
            intent.putExtra("hospital", doctor.getHospital_name());
            intent.putExtra("experience", String.valueOf(doctor.getExperience()));
            intent.putExtra("education", doctor.getEducation());
            intent.putExtra("fees", String.valueOf(doctor.getFees()));
            intent.putExtra("languages", doctor.getLanguages());
            intent.putExtra("rating", String.valueOf(doctor.getRating()));
            intent.putExtra("totalReviews", String.valueOf(doctor.getTotal_reviews()));

            // Pass search criteria
            intent.putExtra("location", location);
            intent.putExtra("symptoms", symptoms);
            intent.putExtra("appointmentType", appointmentType);
            intent.putExtra("specialization", specialization);

            Log.d(TAG, "Starting DoctorDetailActivity...");
            startActivity(intent);
            Log.d(TAG, "DoctorDetailActivity started successfully!");

        } catch (Exception e) {
            Log.e(TAG, "Error starting DoctorDetailActivity: " + e.getMessage());
            e.printStackTrace();
            Toast.makeText(this, "Error opening doctor details: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    private void loadDoctorsFromApi() {
        Log.d(TAG, "loadDoctorsFromApi for specialization: " + specialization);

        if (specialization == null || specialization.isEmpty()) {
            Log.e(TAG, "Specialization is null or empty");
            showEmptyView("Please specify a specialization");
            return;
        }

        ApiService apiService = RetrofitClient.getApiService();
        Call<List<Doctor>> call = apiService.getDoctorsBySpecialization(specialization);

        call.enqueue(new Callback<List<Doctor>>() {
            @Override
            public void onResponse(Call<List<Doctor>> call, Response<List<Doctor>> response) {
                Log.d(TAG, "API Response received. Success: " + response.isSuccessful());

                if (response.isSuccessful() && response.body() != null) {
                    List<Doctor> allDoctors = response.body();
                    Log.d(TAG, "API returned " + allDoctors.size() + " doctors");

                    // Filter doctors by location if specified
                    if (location != null && !location.isEmpty()) {
                        List<Doctor> filteredDoctors = new ArrayList<>();
                        for (Doctor doctor : allDoctors) {
                            if (doctor.getHospital_name() != null &&
                                    matchesLocation(doctor.getHospital_name(), location)) {
                                filteredDoctors.add(doctor);
                            }
                        }

                        if (filteredDoctors.isEmpty()) {
                            Toast.makeText(DoctorListActivity.this,
                                    "No doctors found in '" + location + "'. Showing all available doctors.",
                                    Toast.LENGTH_LONG).show();
                            doctors = allDoctors;
                        } else {
                            doctors = filteredDoctors;
                        }
                        Log.d(TAG, "After location filter: " + doctors.size() + " doctors");
                    } else {
                        doctors = allDoctors;
                    }

                    displayDoctors(doctors);
                } else {
                    Log.e(TAG, "API error: " + response.code());
                    showEmptyView("No doctors found for your criteria");
                    Toast.makeText(DoctorListActivity.this,
                            "No doctors found for your criteria", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<Doctor>> call, Throwable t) {
                Log.e(TAG, "Network error: " + t.getMessage());
                showEmptyView("Error loading doctors. Please check your connection.");
                Toast.makeText(DoctorListActivity.this,
                        "Error loading doctors: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private boolean matchesLocation(String hospitalName, String location) {
        if (hospitalName == null || location == null)
            return false;
        return hospitalName.toLowerCase().contains(location.toLowerCase());
    }
}