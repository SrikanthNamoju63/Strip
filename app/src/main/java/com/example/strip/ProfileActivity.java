package com.example.strip;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;
import java.util.*;

public class ProfileActivity extends AppCompatActivity {

    private TextView tvUserName, tvUserEmail, tvUserId, tvNoAppointments;
    private TextView tvAge, tvGender, tvPhone, tvBloodGroup, tvCity, tvBio;
    private ImageView ivProfileImage;
    private ListView lvAppointments;
    private Button btnLogout, btnEditProfile;
    private LinearLayout cvPersonalInfo, cvAppointments;
    private ProgressBar progressBar;
    private SessionManager sessionManager;
    private UserProfile userProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        sessionManager = new SessionManager(this);

        if (!sessionManager.isLoggedIn()) {
            startActivity(new Intent(ProfileActivity.this, LoginActivity.class));
            finish();
            return;
        }

        initializeViews();
        setupClickListeners();
        loadUserProfile();
    }

    private void initializeViews() {
        tvUserName = findViewById(R.id.tvUserName);
        tvUserEmail = findViewById(R.id.tvUserEmail);
        tvUserId = findViewById(R.id.tvUserId);
        tvAge = findViewById(R.id.tvAge);
        tvGender = findViewById(R.id.tvGender);
        tvPhone = findViewById(R.id.tvPhone);
        tvBloodGroup = findViewById(R.id.tvBloodGroup);
        tvCity = findViewById(R.id.tvCity);
        tvBio = findViewById(R.id.tvBio);
        ivProfileImage = findViewById(R.id.ivProfileImage);
        lvAppointments = findViewById(R.id.lvAppointments);
        tvNoAppointments = findViewById(R.id.tvNoAppointments);
        btnLogout = findViewById(R.id.btnLogout);
        btnEditProfile = findViewById(R.id.btnEditProfile);
        cvPersonalInfo = findViewById(R.id.cvPersonalInfo);
        cvAppointments = findViewById(R.id.cvAppointments);
        progressBar = findViewById(R.id.progressBar);
    }

    private void setupClickListeners() {
        btnLogout.setOnClickListener(v -> showLogoutConfirmation());
        btnEditProfile.setOnClickListener(v -> openEditProfile());

        lvAppointments.setOnItemClickListener((parent, view, position, id) -> {
            if (userProfile != null && userProfile.getAppointments() != null
                    && position < userProfile.getAppointments().size()) {
                Appointment appointment = userProfile.getAppointments().get(position);
                showAppointmentDetails(appointment);
            }
        });
    }

    private void loadUserProfile() {
        showLoading(true);
        int userId = sessionManager.getUserId();

        Log.d("ProfileActivity", "Loading profile for user ID: " + userId);

        ApiService apiService = RetrofitClient.getApiService();
        Call<Map<String, Object>> call = apiService.getProfile(userId);

        call.enqueue(new Callback<Map<String, Object>>() {
            @Override
            public void onResponse(Call<Map<String, Object>> call, Response<Map<String, Object>> response) {
                showLoading(false);

                if (response.isSuccessful() && response.body() != null) {
                    Map<String, Object> responseBody = response.body();
                    Log.d("ProfileActivity", "Response received: " + responseBody.toString());

                    Boolean success = (Boolean) responseBody.get("success");
                    if (success != null && success) {
                        Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                        if (data != null) {
                            userProfile = convertToUserProfile(data);
                            displayUserProfile(userProfile);
                            Log.d("ProfileActivity", "Profile loaded successfully");
                        } else {
                            showError("No profile data found in response");
                        }
                    } else {
                        String error = (String) responseBody.get("error");
                        showError("Failed to load profile: " + (error != null ? error : "Unknown error"));
                    }
                } else {
                    String errorMessage = "Failed to load profile: ";
                    if (response.code() == 404 || response.code() == 401) {
                        // Session is stale or user was deleted from DB
                        Toast.makeText(ProfileActivity.this, "Session invalid. Please login again.", Toast.LENGTH_LONG)
                                .show();
                        sessionManager.logout();
                        Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                        startActivity(intent);
                        finish();
                        return;
                    } else if (response.code() == 500) {
                        errorMessage += "Server error (500)";
                    } else {
                        errorMessage += response.message() + " (" + response.code() + ")";
                    }
                    showError(errorMessage);
                    Log.e("ProfileActivity", "HTTP Error: " + response.code() + " - " + response.message());
                }
            }

            @Override
            public void onFailure(Call<Map<String, Object>> call, Throwable t) {
                showLoading(false);
                showError("Network error: " + t.getMessage());
                Log.e("ProfileActivity", "Network error loading profile", t);
            }
        });
    }

    private UserProfile convertToUserProfile(Map<String, Object> data) {
        UserProfile profile = new UserProfile();

        try {
            // Basic user info
            if (data.containsKey("user_id"))
                profile.setUser_id(((Number) data.get("user_id")).intValue());
            if (data.containsKey("display_id"))
                profile.setDisplay_id((String) data.get("display_id"));
            if (data.containsKey("name"))
                profile.setName((String) data.get("name"));
            if (data.containsKey("email"))
                profile.setEmail((String) data.get("email"));
            if (data.containsKey("profile_image"))
                profile.setProfile_image((String) data.get("profile_image"));

            // Personal info with null checks
            if (data.containsKey("age")) {
                Object ageObj = data.get("age");
                if (ageObj != null) {
                    profile.setAge(((Number) ageObj).intValue());
                }
            }
            if (data.containsKey("dob"))
                profile.setDob((String) data.get("dob"));
            if (data.containsKey("gender"))
                profile.setGender((String) data.get("gender"));
            if (data.containsKey("city"))
                profile.setCity((String) data.get("city"));
            if (data.containsKey("phone"))
                profile.setPhone((String) data.get("phone"));
            if (data.containsKey("bio"))
                profile.setBio((String) data.get("bio"));
            if (data.containsKey("blood_group"))
                profile.setBlood_group((String) data.get("blood_group"));
            if (data.containsKey("state"))
                profile.setState((String) data.get("state"));

            // Convert appointments
            if (data.containsKey("appointments")) {
                Object appointmentsObj = data.get("appointments");
                List<Appointment> appointments = new ArrayList<>();

                if (appointmentsObj instanceof List) {
                    List<?> appointmentList = (List<?>) appointmentsObj;
                    for (Object appointmentObj : appointmentList) {
                        if (appointmentObj instanceof Map) {
                            Map<String, Object> appointmentMap = (Map<String, Object>) appointmentObj;
                            Appointment appointment = convertToAppointment(appointmentMap);
                            if (appointment != null) {
                                appointments.add(appointment);
                            }
                        }
                    }
                }
                profile.setAppointments(appointments);
                Log.d("ProfileActivity", "Converted " + appointments.size() + " appointments");
            }

        } catch (Exception e) {
            Log.e("ProfileActivity", "Error converting user profile", e);
        }

        return profile;
    }

    private Appointment convertToAppointment(Map<String, Object> appointmentMap) {
        Appointment appointment = new Appointment();

        try {
            if (appointmentMap.containsKey("appointment_id")) {
                Object idObj = appointmentMap.get("appointment_id");
                if (idObj != null) {
                    appointment.setAppointment_id(((Number) idObj).intValue());
                }
            }
            if (appointmentMap.containsKey("doctor_name")) {
                appointment.setDoctor_name((String) appointmentMap.get("doctor_name"));
            }
            if (appointmentMap.containsKey("specialization")) {
                appointment.setSpecialization((String) appointmentMap.get("specialization"));
            }
            if (appointmentMap.containsKey("hospital_name")) {
                appointment.setHospital_name((String) appointmentMap.get("hospital_name"));
            }
            if (appointmentMap.containsKey("appointment_date")) {
                appointment.setAppointment_date((String) appointmentMap.get("appointment_date"));
            }
            if (appointmentMap.containsKey("status")) {
                appointment.setStatus((String) appointmentMap.get("status"));
            }
            if (appointmentMap.containsKey("notes")) {
                appointment.setNotes((String) appointmentMap.get("notes"));
            }
        } catch (Exception e) {
            Log.e("ProfileActivity", "Error converting appointment", e);
            return null;
        }

        return appointment;
    }

    private void displayUserProfile(UserProfile profile) {
        // Basic Info
        tvUserName.setText(profile.getName() != null ? profile.getName() : "Unknown User");
        tvUserEmail.setText(profile.getEmail() != null ? profile.getEmail() : "No email");

        // Display 6-digit user ID
        String formattedUserId = profile.getFormattedUserId();
        tvUserId.setText("ID: " + formattedUserId);

        // Personal Information with fallbacks
        tvAge.setText(profile.getAge() != null ? profile.getAge() + " years" : "Not set");
        tvGender.setText(profile.getGender() != null ? profile.getGender() : "Not set");
        tvPhone.setText(profile.getPhone() != null ? profile.getPhone() : "Not set");
        tvBloodGroup.setText(profile.getBlood_group() != null ? profile.getBlood_group() : "Not set");

        // City and State
        String location = profile.getDisplayCity() != null ? profile.getDisplayCity() : "";
        if (location.isEmpty())
            location = "Not set";

        if (profile.getState() != null && !profile.getState().isEmpty()) {
            if (location.equals("Not set")) {
                location = profile.getState();
            } else {
                location += ", " + profile.getState();
            }
        }
        tvCity.setText(location);

        tvBio.setText(profile.getBio() != null ? profile.getBio() : "No bio added");

        // Load profile image
        loadProfileImage(profile.getProfile_image());

        // Display appointments
        displayAppointments(profile.getAppointments());
    }

    private void loadProfileImage(String profileImage) {
        if (profileImage != null && !profileImage.isEmpty()) {
            String imageUrl = RetrofitClient.getImageUrl(profileImage);
            Log.d("ProfileActivity", "Loading profile image from: " + imageUrl);

            Glide.with(this)
                    .load(imageUrl)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .placeholder(R.drawable.ic_profile)
                    .error(R.drawable.ic_profile)
                    .circleCrop()
                    .into(ivProfileImage);
        } else {
            ivProfileImage.setImageResource(R.drawable.ic_profile);
            Log.d("ProfileActivity", "No profile image found, using default");
        }
    }

    private void displayAppointments(List<Appointment> appointments) {
        Log.d("ProfileActivity", "Displaying " + (appointments != null ? appointments.size() : 0) + " appointments");

        if (appointments == null || appointments.isEmpty()) {
            tvNoAppointments.setVisibility(View.VISIBLE);
            lvAppointments.setVisibility(View.GONE);
            return;
        }

        tvNoAppointments.setVisibility(View.GONE);
        lvAppointments.setVisibility(View.VISIBLE);

        List<Map<String, String>> appointmentData = new ArrayList<>();

        for (Appointment appointment : appointments) {
            Map<String, String> map = new HashMap<>();
            map.put("doctor", appointment.getDoctor_name() != null ? appointment.getDoctor_name() : "Unknown Doctor");
            map.put("specialization",
                    appointment.getSpecialization() != null ? appointment.getSpecialization() : "General");
            map.put("hospital",
                    appointment.getHospital_name() != null ? appointment.getHospital_name() : "Unknown Hospital");

            String formattedDateTime = appointment.getFormattedDateTime();
            map.put("date", formattedDateTime);

            String status = appointment.getStatus() != null ? appointment.getStatus() : "Scheduled";
            map.put("status", status);

            appointmentData.add(map);
        }

        String[] from = { "doctor", "specialization", "hospital", "date", "status" };
        int[] to = { R.id.tvDoctorName, R.id.tvSpecialization, R.id.tvHospital, R.id.tvAppointmentDate, R.id.tvStatus };

        SimpleAdapter adapter = new SimpleAdapter(this, appointmentData, R.layout.item_appointment, from, to);
        lvAppointments.setAdapter(adapter);
    }

    private void showAppointmentDetails(Appointment appointment) {
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Appointment Details")
                .setMessage(
                        "Doctor: " + (appointment.getDoctor_name() != null ? appointment.getDoctor_name() : "Unknown")
                                + "\n" +
                                "Specialization: "
                                + (appointment.getSpecialization() != null ? appointment.getSpecialization()
                                        : "General")
                                + "\n" +
                                "Hospital: "
                                + (appointment.getHospital_name() != null ? appointment.getHospital_name() : "Unknown")
                                + "\n" +
                                "Date: " + appointment.getFormattedDateTime() + "\n" +
                                "Status: " + (appointment.getStatus() != null ? appointment.getStatus() : "Scheduled"))
                .setPositiveButton("OK", null)
                .show();
    }

    private void showLoading(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        findViewById(R.id.scrollView).setVisibility(show ? View.GONE : View.VISIBLE);
    }

    private void showError(String message) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
        Log.e("ProfileActivity", message);
    }

    private void showLogoutConfirmation() {
        new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("Logout")
                .setMessage("Are you sure you want to logout?")
                .setPositiveButton("Logout", (dialog, which) -> logout())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void logout() {
        sessionManager.logout();
        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(ProfileActivity.this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void openEditProfile() {
        Intent intent = new Intent(ProfileActivity.this, EditProfileActivity.class);
        if (userProfile != null) {
            intent.putExtra("userProfile", userProfile);
        }
        startActivityForResult(intent, 1);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1 && resultCode == RESULT_OK) {
            loadUserProfile(); // Refresh profile after editing
        }
    }
}